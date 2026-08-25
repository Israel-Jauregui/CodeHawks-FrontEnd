#!/usr/bin/env python3

from __future__ import annotations

import copy
import unittest
from typing import Any

from preflight import (
    CloudflareClient,
    Config,
    EXPECTED_DMARC,
    EXPECTED_ROUTING_SPF,
    PublicDnsClient,
    PreflightError,
    collect_snapshot,
    validate_snapshot,
)


TOKENS = ("a" * 32, "b" * 32, "c" * 32)


def config(**overrides: object) -> Config:
    values: dict[str, object] = {
        "account_id": "1" * 32,
        "zone_id": "2" * 32,
        "domain": "codehawks.org",
        "source_address": "contact@codehawks.org",
        "destination": "owner@example.edu",
        "onboarding_enabled": True,
        "forwarding_enabled": False,
        "ses_dkim_tokens": TOKENS,
        "state_has_dns": False,
        "state_has_address": False,
        "state_has_rule": False,
    }
    values.update(overrides)
    return Config(**values)  # type: ignore[arg-type]


def snapshot() -> dict[str, object]:
    records: list[dict[str, object]] = [
        {
            "type": "TXT",
            "name": "_dmarc.codehawks.org",
            "content": EXPECTED_DMARC,
        }
    ]
    records.extend(
        {
            "type": "CNAME",
            "name": f"{token}._domainkey.codehawks.org",
            "content": f"{token}.dkim.amazonses.com",
        }
        for token in TOKENS
    )
    return {
        "token": {"status": "active"},
        "zone": {
            "id": "2" * 32,
            "name": "codehawks.org",
            "status": "active",
            "account": {"id": "1" * 32},
        },
        "dns_records": records,
        "routing_settings": {"enabled": False, "status": "unconfigured"},
        "routing_dns": {
            "record": [
                {
                    "type": "MX",
                    "name": "codehawks.org",
                    "content": "route1.mx.cloudflare.net",
                    "priority": 46,
                },
                {
                    "type": "MX",
                    "name": "codehawks.org",
                    "content": "route2.mx.cloudflare.net",
                    "priority": 90,
                },
                {
                    "type": "MX",
                    "name": "codehawks.org",
                    "content": "route3.mx.cloudflare.net",
                    "priority": 76,
                },
                {
                    "type": "TXT",
                    "name": "codehawks.org",
                    "content": EXPECTED_ROUTING_SPF,
                },
                {
                    "type": "TXT",
                    "name": "cf2024-1._domainkey.codehawks.org",
                    "content": "v=DKIM1; h=sha256; k=rsa; p=example",
                },
            ]
        },
        "destinations": [],
        "rules": [],
        "catch_all": {"enabled": False},
    }


class RecordingClient(CloudflareClient):
    def __init__(self) -> None:
        self.get_paths: list[str] = []
        self.list_paths: list[str] = []

    def get(self, path: str) -> dict[str, object]:
        self.get_paths.append(path)
        return {"result": {}}

    def list_all(self, path: str) -> list[dict[str, object]]:
        self.list_paths.append(path)
        return []


class StaticPublicDnsClient(PublicDnsClient):
    def __init__(self, records: list[dict[str, object]] | None = None) -> None:
        self.records = records or []
        self.queries: tuple[tuple[str, str], ...] = ()

    def resolve(  # type: ignore[override]
        self, queries: tuple[tuple[str, str], ...], domain: str
    ) -> list[dict[str, object]]:
        self.queries = queries
        return copy.deepcopy(self.records)


class FixturePublicDnsClient(PublicDnsClient):
    def __init__(
        self, payloads: dict[tuple[str, str, str], dict[str, Any]]
    ) -> None:
        self.payloads = payloads

    def _get(  # type: ignore[override]
        self, resolver: str, endpoint: str, name: str, record_type: str
    ) -> dict[str, Any]:
        del endpoint
        return copy.deepcopy(self.payloads[(resolver, name, record_type)])


class EmailRoutingPreflightTests(unittest.TestCase):
    def test_public_resolvers_parse_the_same_chunked_txt_record(self) -> None:
        answer = {
            "Status": 0,
            "Answer": [
                {
                    "name": "codehawks.org.",
                    "type": 16,
                    "data": '"v=spf1 include:_spf.mx.cloudflare.net " "~all"',
                }
            ],
        }
        client = FixturePublicDnsClient(
            {
                ("Cloudflare", "codehawks.org", "TXT"): answer,
                ("Google", "codehawks.org", "TXT"): answer,
            }
        )

        records = client.resolve((("codehawks.org", "TXT"),), "codehawks.org")

        self.assertEqual(records[0]["content"], EXPECTED_ROUTING_SPF)

    def test_public_resolver_disagreement_stops(self) -> None:
        cloudflare_answer = {
            "Status": 0,
            "Answer": [
                {
                    "name": "codehawks.org.",
                    "type": 16,
                    "data": f'"{EXPECTED_ROUTING_SPF}"',
                }
            ],
        }
        client = FixturePublicDnsClient(
            {
                ("Cloudflare", "codehawks.org", "TXT"): cloudflare_answer,
                ("Google", "codehawks.org", "TXT"): {"Status": 0},
            }
        )

        with self.assertRaisesRegex(PreflightError, "resolvers disagree"):
            client.resolve((("codehawks.org", "TXT"),), "codehawks.org")

    def test_apex_routing_dns_read_omits_subdomain_query(self) -> None:
        current_config = config()
        client = RecordingClient()

        public_dns_client = StaticPublicDnsClient()

        collected = collect_snapshot(client, current_config, public_dns_client)

        self.assertIn(
            f"zones/{current_config.zone_id}/email/routing/dns",
            client.get_paths,
        )
        self.assertFalse(
            any("subdomain=" in path for path in client.get_paths),
            "The zone-apex Email Routing DNS request must not include a subdomain query",
        )
        self.assertIn((current_config.domain, "MX"), public_dns_client.queries)
        self.assertIn(
            ("cf2024-1._domainkey.codehawks.org", "TXT"),
            public_dns_client.queries,
        )
        self.assertEqual(collected["public_dns_records"], [])

    def test_clean_unconfigured_onboarding_preflight_passes(self) -> None:
        result = validate_snapshot(snapshot(), config())
        self.assertEqual(result["mx_records"], 0)
        self.assertFalse(result["destination_verified"])

    def test_conflicting_mx_stops(self) -> None:
        current = snapshot()
        current["dns_records"].append(  # type: ignore[union-attr]
            {
                "type": "MX",
                "name": "codehawks.org",
                "content": "mail.other-provider.example",
                "priority": 10,
            }
        )
        with self.assertRaisesRegex(PreflightError, "Conflicting"):
            validate_snapshot(current, config())

    def test_duplicate_spf_stops(self) -> None:
        current = snapshot()
        current["dns_records"].extend(  # type: ignore[union-attr]
            [
                {
                    "type": "TXT",
                    "name": "codehawks.org",
                    "content": "v=spf1 include:_spf.mx.cloudflare.net ~all",
                },
                {
                    "type": "TXT",
                    "name": "codehawks.org",
                    "content": "v=spf1 include:other.example ~all",
                },
            ]
        )
        with self.assertRaisesRegex(PreflightError, "Duplicate apex SPF"):
            validate_snapshot(current, config())

    def test_account_zone_mismatch_stops(self) -> None:
        current = snapshot()
        current["zone"]["account"]["id"] = "9" * 32  # type: ignore[index]
        with self.assertRaisesRegex(PreflightError, "account/zone mismatch"):
            validate_snapshot(current, config())

    def test_unverified_destination_cannot_enable_rule(self) -> None:
        current = snapshot()
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["dns_records"].extend(  # type: ignore[union-attr]
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        current["destinations"] = [
            {"email": "owner@example.edu", "verified": None}
        ]
        with self.assertRaisesRegex(PreflightError, "not verified"):
            validate_snapshot(
                current,
                config(
                    forwarding_enabled=True,
                    state_has_dns=True,
                    state_has_address=True,
                ),
            )

    def test_verified_exact_rule_activation_preflight_passes(self) -> None:
        current = snapshot()
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["dns_records"].extend(  # type: ignore[union-attr]
            copy.deepcopy((current["routing_dns"])["record"])  # type: ignore[index]
        )
        current["destinations"] = [
            {
                "email": "owner@example.edu",
                "verified": "2026-08-24T12:00:00Z",
            }
        ]
        result = validate_snapshot(
            current,
            config(
                forwarding_enabled=True,
                state_has_dns=True,
                state_has_address=True,
            ),
        )
        self.assertTrue(result["destination_verified"])

    def test_ready_routing_with_empty_managed_dns_response_uses_public_dns(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {"record": []}
        current["public_dns_records"] = [
            *copy.deepcopy(current["dns_records"]),  # type: ignore[arg-type]
            *routing_records,
        ]
        current["destinations"] = [
            {
                "email": "owner@example.edu",
                "verified": "2026-08-24T12:00:00Z",
            }
        ]

        result = validate_snapshot(
            current,
            config(
                forwarding_enabled=True,
                state_has_dns=True,
                state_has_address=True,
            ),
        )

        self.assertEqual(result["routing_dns_records"], 5)
        self.assertEqual(result["mx_records"], 3)
        self.assertEqual(result["spf_records"], 1)
        self.assertTrue(result["destination_verified"])

    def test_ready_routing_with_unexpected_public_mx_stops(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        routing_records.append(
            {
                "type": "MX",
                "name": "codehawks.org",
                "content": "mail.other-provider.example",
                "priority": 10,
            }
        )
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {"record": []}
        current["public_dns_records"] = [
            *copy.deepcopy(current["dns_records"]),  # type: ignore[arg-type]
            *routing_records,
        ]

        with self.assertRaisesRegex(PreflightError, "conflicting"):
            validate_snapshot(current, config(state_has_dns=True))

    def test_ready_routing_with_missing_public_dkim_stops(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"][:-1]  # type: ignore[index]
        )
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {"record": []}
        current["public_dns_records"] = [
            *copy.deepcopy(current["dns_records"]),  # type: ignore[arg-type]
            *routing_records,
        ]

        with self.assertRaisesRegex(PreflightError, "DKIM record is incomplete"):
            validate_snapshot(current, config(state_has_dns=True))

    def test_ready_routing_with_missing_public_dmarc_stops(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {"record": []}
        current["public_dns_records"] = routing_records

        with self.assertRaisesRegex(PreflightError, "DMARC policy is missing"):
            validate_snapshot(current, config(state_has_dns=True))

    def test_ready_routing_with_clean_partial_api_dns_response_passes(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {
            "record": [*routing_records[:3], routing_records[-1]]
        }
        current["public_dns_records"] = [
            *copy.deepcopy(current["dns_records"]),  # type: ignore[arg-type]
            *routing_records,
        ]

        result = validate_snapshot(current, config(state_has_dns=True))

        self.assertEqual(result["routing_dns_records"], 5)
        self.assertEqual(result["routing_dns_api_records"], 4)
        self.assertEqual(result["routing_dns_api_errors"], 0)

    def test_ready_routing_with_conflicting_api_dns_response_stops(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        conflicting_record = {
            "type": "TXT",
            "name": "codehawks.org",
            "content": "v=spf1 include:other.example ~all",
        }
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {
            "record": [*routing_records[:-1], conflicting_record]
        }
        current["public_dns_records"] = [
            *copy.deepcopy(current["dns_records"]),  # type: ignore[arg-type]
            *routing_records,
        ]

        with self.assertRaisesRegex(PreflightError, "conflicts with public DNS"):
            validate_snapshot(current, config(state_has_dns=True))

    def test_ready_routing_with_api_reported_missing_record_stops(self) -> None:
        current = snapshot()
        routing_records = copy.deepcopy(
            (current["routing_dns"])["record"]  # type: ignore[index]
        )
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["routing_dns"] = {
            "record": [*routing_records[:3], routing_records[-1]],
            "errors": [
                {
                    "code": "spf_missing",
                    "missing": routing_records[-2],
                }
            ],
        }
        current["public_dns_records"] = [
            *copy.deepcopy(current["dns_records"]),  # type: ignore[arg-type]
            *routing_records,
        ]

        with self.assertRaisesRegex(PreflightError, "reports missing"):
            validate_snapshot(current, config(state_has_dns=True))

    def test_enabled_catch_all_stops(self) -> None:
        current = snapshot()
        current["catch_all"] = {"enabled": True}
        with self.assertRaisesRegex(PreflightError, "catch-all"):
            validate_snapshot(current, config())

    def test_missing_cloudflare_managed_routing_dkim_stops(self) -> None:
        current = snapshot()
        current["routing_settings"] = {"enabled": True, "status": "ready"}
        current["dns_records"].extend(  # type: ignore[union-attr]
            copy.deepcopy((current["routing_dns"])["record"][:-1])  # type: ignore[index]
        )
        with self.assertRaisesRegex(PreflightError, "DKIM record is incomplete"):
            validate_snapshot(current, config(state_has_dns=True))

    def test_unmanaged_exact_rule_stops(self) -> None:
        current = snapshot()
        current["rules"] = [
            {
                "enabled": False,
                "source": "api",
                "matchers": [
                    {
                        "type": "literal",
                        "field": "to",
                        "value": "contact@codehawks.org",
                    }
                ],
                "actions": [
                    {"type": "forward", "value": ["owner@example.edu"]}
                ],
            }
        ]
        with self.assertRaisesRegex(PreflightError, "outside"):
            validate_snapshot(current, config())


if __name__ == "__main__":
    unittest.main()
