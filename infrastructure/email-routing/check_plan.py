#!/usr/bin/env python3
"""Enforce forwarding-specific invariants on a Terraform JSON plan."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any


class PlanError(RuntimeError):
    pass


def _boolean(name: str) -> bool:
    value = os.environ.get(name, "")
    if value not in {"true", "false"}:
        raise PlanError(f"{name} must be exactly true or false")
    return value == "true"


def _resources(plan: dict[str, Any]) -> list[dict[str, Any]]:
    root = ((plan.get("planned_values") or {}).get("root_module") or {})
    resources = list(root.get("resources") or [])
    for module in root.get("child_modules") or []:
        resources.extend(module.get("resources") or [])
    return [resource for resource in resources if isinstance(resource, dict)]


def _dkim_tokens() -> tuple[str, ...]:
    try:
        value = json.loads(os.environ["SES_DKIM_TOKENS"])
    except json.JSONDecodeError as error:
        raise PlanError("SES_DKIM_TOKENS must be valid JSON") from error
    if not (
        isinstance(value, list)
        and len(value) == 3
        and all(
            isinstance(token, str) and token.isalnum() and token.islower()
            for token in value
        )
    ):
        raise PlanError(
            "SES_DKIM_TOKENS must contain exactly three lowercase alphanumeric tokens"
        )
    return tuple(value)


def validate_plan(plan: dict[str, Any]) -> None:
    onboarding_enabled = _boolean("EMAIL_ROUTING_ONBOARDING_ENABLED")
    forwarding_enabled = _boolean("EMAIL_FORWARDING_RULE_ENABLED")
    account_id = os.environ["CLOUDFLARE_ACCOUNT_ID"]
    zone_id = os.environ["CLOUDFLARE_ZONE_ID"]
    domain = os.environ["EMAIL_ROUTING_DOMAIN"].lower()
    source_address = os.environ["EMAIL_ROUTING_SOURCE_ADDRESS"].lower()
    destination = os.environ["EMAIL_FORWARDING_DESTINATION"].lower()
    if source_address != f"contact@{domain}":
        raise PlanError("The configured source must be the exact contact address")

    destructive: list[Any] = []
    for change in plan.get("resource_changes") or []:
        actions = ((change.get("change") or {}).get("actions") or [])
        if "delete" not in actions:
            continue
        is_exact_rule_rollback = (
            not forwarding_enabled
            and change.get("address")
            == "cloudflare_email_routing_rule.contact[0]"
            and actions == ["delete"]
        )
        if not is_exact_rule_rollback:
            destructive.append(change.get("address"))
    if destructive:
        raise PlanError(
            "The plan contains unexpected deletion or replacement actions: "
            + ", ".join(str(address) for address in destructive)
        )

    resources = _resources(plan)
    allowed_email_routing_types = {
        "cloudflare_email_routing_address",
        "cloudflare_email_routing_dns",
        "cloudflare_email_routing_rule",
    }
    forbidden_types = {
        "cloudflare_email_routing_catch_all",
        "cloudflare_workers_script",
        "cloudflare_worker",
        "cloudflare_email_security_block_sender",
    }
    present_forbidden = sorted(
        {
            str(resource.get("type"))
            for resource in resources
            if resource.get("type") in forbidden_types
        }
    )
    if present_forbidden:
        raise PlanError(
            "The plan contains a forbidden catch-all, Worker, or email-security resource: "
            + ", ".join(present_forbidden)
        )
    unexpected_email_routing_types = sorted(
        {
            str(resource.get("type"))
            for resource in resources
            if str(resource.get("type", "")).startswith(
                "cloudflare_email_routing_"
            )
            and resource.get("type") not in allowed_email_routing_types
        }
    )
    if unexpected_email_routing_types:
        raise PlanError(
            "The plan contains an unexpected Email Routing resource: "
            + ", ".join(unexpected_email_routing_types)
        )

    by_type: dict[str, list[dict[str, Any]]] = {}
    for resource in resources:
        by_type.setdefault(str(resource.get("type")), []).append(resource)

    expected_onboarding_count = 1 if onboarding_enabled else 0
    for resource_type in allowed_email_routing_types - {
        "cloudflare_email_routing_rule"
    }:
        actual = len(by_type.get(resource_type, []))
        if actual != expected_onboarding_count:
            raise PlanError(
                f"Expected {expected_onboarding_count} {resource_type} resource, found {actual}"
            )

    if onboarding_enabled:
        dns_values = by_type["cloudflare_email_routing_dns"][0].get("values") or {}
        if dns_values.get("zone_id") != zone_id:
            raise PlanError("Email Routing DNS does not target the exact protected zone")
        if dns_values.get("name") is not None:
            raise PlanError(
                "Zone-apex Email Routing DNS must omit the optional subdomain name"
            )

        address_values = by_type["cloudflare_email_routing_address"][0].get(
            "values"
        ) or {}
        if (
            address_values.get("account_id") != account_id
            or str(address_values.get("email", "")).lower() != destination
        ):
            raise PlanError(
                "The Email Routing destination does not match the protected account/value"
            )

    rules = by_type.get("cloudflare_email_routing_rule", [])
    expected_rule_count = 1 if forwarding_enabled else 0
    if len(rules) != expected_rule_count:
        raise PlanError(
            f"Expected {expected_rule_count} exact forwarding rule, found {len(rules)}"
        )
    if rules:
        values = rules[0].get("values") or {}
        if (
            values.get("zone_id") != zone_id
            or values.get("enabled") is not True
            or values.get("source") != "api"
        ):
            raise PlanError("The contact rule must be enabled and API/Terraform owned")
        if values.get("matchers") != [
            {"field": "to", "type": "literal", "value": source_address}
        ]:
            raise PlanError("The forwarding matcher is not the exact contact address")
        if values.get("actions") != [
            {"type": "forward", "value": [destination]}
        ]:
            raise PlanError("The forwarding action is not the one protected destination")

    dns_records = by_type.get("cloudflare_dns_record", [])
    dmarc = dns_records
    dmarc_values = [
        resource.get("values") or {}
        for resource in dmarc
        if (resource.get("values") or {}).get("name") == f"_dmarc.{domain}"
    ]
    if len(dmarc_values) != 1 or dmarc_values[0].get("content") != (
        "v=DMARC1; p=none; adkim=r; aspf=r; pct=100"
    ):
        raise PlanError("The monitoring-only DMARC resource is missing or changed")

    expected_dkim = {
        f"{token}._domainkey.{domain}": f"{token}.dkim.amazonses.com"
        for token in _dkim_tokens()
    }
    dkim_values = [
        resource.get("values") or {}
        for resource in dns_records
        if str(resource.get("address", "")).startswith(
            "cloudflare_dns_record.ses_dkim["
        )
    ]
    actual_dkim = {
        values.get("name"): values.get("content")
        for values in dkim_values
        if values.get("type") == "CNAME" and values.get("proxied") is False
    }
    if len(dkim_values) != 3 or actual_dkim != expected_dkim:
        raise PlanError("The three Amazon SES Easy DKIM records are missing or changed")


def main() -> int:
    try:
        path = Path(sys.argv[1] if len(sys.argv) > 1 else "production-plan.json")
        with path.open(encoding="utf-8") as plan_file:
            validate_plan(json.load(plan_file))
    except (KeyError, OSError, json.JSONDecodeError, PlanError) as error:
        print(f"Terraform forwarding plan invariant failed: {error}", file=sys.stderr)
        return 1
    print("Terraform forwarding plan invariants passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
