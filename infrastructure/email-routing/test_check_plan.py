from __future__ import annotations

import copy
import os
import unittest
from unittest.mock import patch

import check_plan


TOKENS = ["dkimone", "dkimtwo", "dkimthree"]


def dns_record(address: str, name: str, record_type: str, content: str) -> dict:
    return {
        "address": address,
        "type": "cloudflare_dns_record",
        "values": {
            "name": name,
            "type": record_type,
            "content": content,
            "proxied": False,
        },
    }


def base_plan(*, forwarding: bool = False) -> dict:
    resources = [
        dns_record(
            "cloudflare_dns_record.dmarc",
            "_dmarc.codehawks.org",
            "TXT",
            "v=DMARC1; p=none; adkim=r; aspf=r; pct=100",
        )
    ]
    resources.extend(
        dns_record(
            f'cloudflare_dns_record.ses_dkim["{token}"]',
            f"{token}._domainkey.codehawks.org",
            "CNAME",
            f"{token}.dkim.amazonses.com",
        )
        for token in TOKENS
    )
    resources.extend(
        [
            {
                "address": "cloudflare_email_routing_dns.contact[0]",
                "type": "cloudflare_email_routing_dns",
                "values": {"name": None, "zone_id": "b" * 32},
            },
            {
                "address": "cloudflare_email_routing_address.contact[0]",
                "type": "cloudflare_email_routing_address",
                "values": {"account_id": "a" * 32, "email": "owner@ung.edu"},
            },
        ]
    )
    if forwarding:
        resources.append(
            {
                "address": "cloudflare_email_routing_rule.contact[0]",
                "type": "cloudflare_email_routing_rule",
                "values": {
                    "zone_id": "b" * 32,
                    "enabled": True,
                    "source": "api",
                    "matchers": [
                        {
                            "field": "to",
                            "type": "literal",
                            "value": "contact@codehawks.org",
                        }
                    ],
                    "actions": [{"type": "forward", "value": ["owner@ung.edu"]}],
                },
            }
        )
    return {
        "planned_values": {"root_module": {"resources": resources}},
        "resource_changes": [],
    }


class PlanInvariantTests(unittest.TestCase):
    def env(self, *, forwarding: bool = False) -> dict[str, str]:
        return {
            "CLOUDFLARE_ACCOUNT_ID": "a" * 32,
            "CLOUDFLARE_ZONE_ID": "b" * 32,
            "EMAIL_FORWARDING_DESTINATION": "owner@ung.edu",
            "EMAIL_FORWARDING_RULE_ENABLED": str(forwarding).lower(),
            "EMAIL_ROUTING_DOMAIN": "codehawks.org",
            "EMAIL_ROUTING_ONBOARDING_ENABLED": "true",
            "EMAIL_ROUTING_SOURCE_ADDRESS": "contact@codehawks.org",
            "SES_DKIM_TOKENS": '["dkimone","dkimtwo","dkimthree"]',
        }

    def validate(self, plan: dict, *, forwarding: bool = False) -> None:
        with patch.dict(os.environ, self.env(forwarding=forwarding), clear=True):
            check_plan.validate_plan(plan)

    def test_accepts_onboarding_without_a_rule(self) -> None:
        self.validate(base_plan())

    def test_rejects_apex_domain_sent_as_subdomain_name(self) -> None:
        plan = copy.deepcopy(base_plan())
        resources = plan["planned_values"]["root_module"]["resources"]
        dns = next(
            resource
            for resource in resources
            if resource["type"] == "cloudflare_email_routing_dns"
        )
        dns["values"]["name"] = "codehawks.org"
        with self.assertRaisesRegex(check_plan.PlanError, "omit the optional"):
            self.validate(plan)

    def test_accepts_one_exact_verified_stage_rule(self) -> None:
        self.validate(base_plan(forwarding=True), forwarding=True)

    def test_rejects_any_delete_or_replacement_action(self) -> None:
        plan = base_plan()
        plan["resource_changes"] = [
            {
                "address": "cloudflare_dns_record.apex",
                "change": {"actions": ["delete", "create"]},
            }
        ]
        with self.assertRaisesRegex(check_plan.PlanError, "deletion or replacement"):
            self.validate(plan)

    def test_accepts_only_the_intentional_exact_rule_rollback(self) -> None:
        plan = base_plan()
        plan["resource_changes"] = [
            {
                "address": "cloudflare_email_routing_rule.contact[0]",
                "change": {"actions": ["delete"]},
            }
        ]
        self.validate(plan)

    def test_rejects_changed_ses_dkim(self) -> None:
        plan = copy.deepcopy(base_plan())
        plan["planned_values"]["root_module"]["resources"][1]["values"][
            "content"
        ] = "wrong.dkim.amazonses.com"
        with self.assertRaisesRegex(check_plan.PlanError, "Easy DKIM"):
            self.validate(plan)

    def test_rejects_catch_all_or_worker_resources(self) -> None:
        plan = base_plan()
        plan["planned_values"]["root_module"]["resources"].append(
            {
                "address": "cloudflare_email_routing_catch_all.bad",
                "type": "cloudflare_email_routing_catch_all",
                "values": {},
            }
        )
        with self.assertRaisesRegex(check_plan.PlanError, "forbidden"):
            self.validate(plan)


if __name__ == "__main__":
    unittest.main()
