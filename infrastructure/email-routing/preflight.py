#!/usr/bin/env python3
"""Fail-closed, read-only Cloudflare Email Routing production preflight."""

from __future__ import annotations

import json
import os
import shlex
import sys
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any


API_BASE = "https://api.cloudflare.com/client/v4"
EXPECTED_DMARC = "v=DMARC1; p=none; adkim=r; aspf=r; pct=100"
EXPECTED_ROUTING_MX_TARGETS = {
    "route1.mx.cloudflare.net",
    "route2.mx.cloudflare.net",
    "route3.mx.cloudflare.net",
}
EXPECTED_ROUTING_SPF = "v=spf1 include:_spf.mx.cloudflare.net ~all"
ROUTING_DKIM_SELECTOR = "cf2024-1._domainkey"
PUBLIC_DNS_RESOLVERS = (
    ("Cloudflare", "https://cloudflare-dns.com/dns-query"),
    ("Google", "https://dns.google/resolve"),
)
DNS_TYPES = {"CNAME": 5, "MX": 15, "TXT": 16}


class PreflightError(RuntimeError):
    """A safety invariant failed and the workflow must stop."""


def _required(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise PreflightError(f"Missing required protected value: {name}")
    return value


def _boolean(name: str) -> bool:
    value = _required(name)
    if value not in {"true", "false"}:
        raise PreflightError(f"{name} must be exactly true or false")
    return value == "true"


@dataclass(frozen=True)
class Config:
    account_id: str
    zone_id: str
    domain: str
    source_address: str
    destination: str
    onboarding_enabled: bool
    forwarding_enabled: bool
    ses_dkim_tokens: tuple[str, ...]
    state_has_dns: bool
    state_has_address: bool
    state_has_rule: bool

    @classmethod
    def from_environment(cls) -> "Config":
        domain = _required("EMAIL_ROUTING_DOMAIN").lower()
        source = _required("EMAIL_ROUTING_SOURCE_ADDRESS").lower()
        destination = _required("EMAIL_FORWARDING_DESTINATION").lower()
        if source != f"contact@{domain}":
            raise PreflightError(
                "EMAIL_ROUTING_SOURCE_ADDRESS must be the exact contact address for the configured domain"
            )

        try:
            tokens_value = json.loads(_required("SES_DKIM_TOKENS"))
        except json.JSONDecodeError as error:
            raise PreflightError("SES_DKIM_TOKENS must be valid JSON") from error
        if not (
            isinstance(tokens_value, list)
            and len(tokens_value) == 3
            and all(
                isinstance(token, str) and token.isalnum() and token.islower()
                for token in tokens_value
            )
        ):
            raise PreflightError(
                "SES_DKIM_TOKENS must contain exactly three lowercase alphanumeric tokens"
            )

        return cls(
            account_id=_required("CLOUDFLARE_ACCOUNT_ID"),
            zone_id=_required("CLOUDFLARE_ZONE_ID"),
            domain=domain,
            source_address=source,
            destination=destination,
            onboarding_enabled=_boolean("EMAIL_ROUTING_ONBOARDING_ENABLED"),
            forwarding_enabled=_boolean("EMAIL_FORWARDING_RULE_ENABLED"),
            ses_dkim_tokens=tuple(tokens_value),
            state_has_dns=_boolean("TF_STATE_HAS_EMAIL_ROUTING_DNS"),
            state_has_address=_boolean("TF_STATE_HAS_EMAIL_ROUTING_ADDRESS"),
            state_has_rule=_boolean("TF_STATE_HAS_EMAIL_ROUTING_RULE"),
        )


class CloudflareClient:
    def __init__(self, token: str) -> None:
        self._token = token

    def get(self, path: str) -> dict[str, Any]:
        request = urllib.request.Request(
            f"{API_BASE}/{path}",
            headers={
                "Authorization": f"Bearer {self._token}",
                "Accept": "application/json",
                "User-Agent": "CodeHawks-email-routing-preflight/1.0",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as error:
            raise PreflightError(
                f"Cloudflare read-only request failed for {path.split('?')[0]} with HTTP {error.code}"
            ) from error
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            raise PreflightError(
                f"Cloudflare read-only request failed for {path.split('?')[0]}"
            ) from error

        if not isinstance(payload, dict) or payload.get("success") is not True:
            raise PreflightError(
                f"Cloudflare rejected the read-only request for {path.split('?')[0]}"
            )
        return payload

    def list_all(self, path: str) -> list[dict[str, Any]]:
        separator = "&" if "?" in path else "?"
        page = 1
        items: list[dict[str, Any]] = []
        while True:
            payload = self.get(f"{path}{separator}per_page=100&page={page}")
            result = payload.get("result", [])
            if not isinstance(result, list):
                raise PreflightError(
                    f"Cloudflare returned an unexpected collection for {path.split('?')[0]}"
                )
            items.extend(item for item in result if isinstance(item, dict))
            result_info = payload.get("result_info") or {}
            total_pages = int(result_info.get("total_pages") or 1)
            if page >= total_pages:
                return items
            page += 1


class PublicDnsClient:
    """Resolve the protected mail records through two independent DoH services."""

    def _get(
        self, resolver: str, endpoint: str, name: str, record_type: str
    ) -> dict[str, Any]:
        query = urllib.parse.urlencode({"name": name, "type": record_type})
        request = urllib.request.Request(
            f"{endpoint}?{query}",
            headers={
                "Accept": "application/dns-json",
                "User-Agent": "CodeHawks-email-routing-preflight/1.0",
            },
            method="GET",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.load(response)
        except urllib.error.HTTPError as error:
            raise PreflightError(
                f"{resolver} public DNS lookup failed with HTTP {error.code}"
            ) from error
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            raise PreflightError(f"{resolver} public DNS lookup failed") from error

        if not isinstance(payload, dict) or payload.get("Status") != 0:
            raise PreflightError(
                f"{resolver} public DNS returned an unsuccessful response"
            )
        return payload

    def resolve(
        self, queries: tuple[tuple[str, str], ...], domain: str
    ) -> list[dict[str, Any]]:
        resolver_records: list[list[dict[str, Any]]] = []
        for resolver, endpoint in PUBLIC_DNS_RESOLVERS:
            records: list[dict[str, Any]] = []
            for name, record_type in queries:
                payload = self._get(resolver, endpoint, name, record_type)
                records.extend(
                    _public_dns_answers(payload, name, record_type, resolver)
                )
            resolver_records.append(records)

        first_keys = {_dns_key(record, domain) for record in resolver_records[0]}
        second_keys = {_dns_key(record, domain) for record in resolver_records[1]}
        if first_keys != second_keys:
            raise PreflightError(
                "Cloudflare and Google public DNS resolvers disagree on protected mail records"
            )
        return resolver_records[0]


def _txt_answer(value: Any, resolver: str) -> str:
    content = str(value or "").strip()
    if not content.startswith('"'):
        return content
    try:
        return "".join(shlex.split(content))
    except ValueError as error:
        raise PreflightError(
            f"{resolver} public DNS returned a malformed TXT record"
        ) from error


def _public_dns_answers(
    payload: dict[str, Any], name: str, record_type: str, resolver: str
) -> list[dict[str, Any]]:
    answers = payload.get("Answer") or []
    if not isinstance(answers, list):
        raise PreflightError(
            f"{resolver} public DNS returned an unexpected answer collection"
        )

    expected_type = DNS_TYPES[record_type]
    normalized_name = name.lower().rstrip(".")
    records: list[dict[str, Any]] = []
    for answer in answers:
        if not isinstance(answer, dict) or answer.get("type") != expected_type:
            continue
        if str(answer.get("name") or "").lower().rstrip(".") != normalized_name:
            continue

        data = answer.get("data")
        if record_type == "MX":
            parts = str(data or "").split(maxsplit=1)
            if len(parts) != 2:
                raise PreflightError(
                    f"{resolver} public DNS returned a malformed MX record"
                )
            try:
                priority = int(parts[0])
            except ValueError as error:
                raise PreflightError(
                    f"{resolver} public DNS returned a malformed MX priority"
                ) from error
            records.append(
                {
                    "type": "MX",
                    "name": normalized_name,
                    "content": parts[1],
                    "priority": priority,
                }
            )
        else:
            content = (
                _txt_answer(data, resolver)
                if record_type == "TXT"
                else str(data or "")
            )
            records.append(
                {
                    "type": record_type,
                    "name": normalized_name,
                    "content": content,
                }
            )
    return records


def collect_public_dns(client: PublicDnsClient, config: Config) -> list[dict[str, Any]]:
    queries = (
        (config.domain, "MX"),
        (config.domain, "TXT"),
        (f"_dmarc.{config.domain}", "TXT"),
        (f"{ROUTING_DKIM_SELECTOR}.{config.domain}", "TXT"),
        *(
            (f"{token_value}._domainkey.{config.domain}", "CNAME")
            for token_value in config.ses_dkim_tokens
        ),
    )
    return client.resolve(queries, config.domain)


def collect_snapshot(
    client: CloudflareClient,
    config: Config,
    public_dns_client: PublicDnsClient | None = None,
) -> dict[str, Any]:
    return {
        "token": client.get("user/tokens/verify").get("result") or {},
        "zone": client.get(f"zones/{config.zone_id}").get("result") or {},
        "dns_records": client.list_all(f"zones/{config.zone_id}/dns_records"),
        "public_dns_records": collect_public_dns(
            public_dns_client or PublicDnsClient(), config
        ),
        "routing_settings": client.get(
            f"zones/{config.zone_id}/email/routing"
        ).get("result")
        or {},
        "routing_dns": client.get(
            f"zones/{config.zone_id}/email/routing/dns"
        ).get("result")
        or {},
        "destinations": client.list_all(
            f"accounts/{config.account_id}/email/routing/addresses"
        ),
        "rules": client.list_all(
            f"zones/{config.zone_id}/email/routing/rules"
        ),
        "catch_all": client.get(
            f"zones/{config.zone_id}/email/routing/rules/catch_all"
        ).get("result")
        or {},
    }


def _dns_name(value: Any, domain: str) -> str:
    name = str(value or "").lower().rstrip(".")
    return domain if name in {"", "@"} else name


def _dns_content(record_type: str, value: Any) -> str:
    content = str(value or "").strip()
    if record_type in {"MX", "CNAME"}:
        return content.lower().rstrip(".")
    return content


def _dns_key(record: dict[str, Any], domain: str) -> tuple[str, str, str, int]:
    record_type = str(record.get("type") or "").upper()
    priority = int(record.get("priority") or 0)
    return (
        record_type,
        _dns_name(record.get("name"), domain),
        _dns_content(record_type, record.get("content")),
        priority,
    )


def _routing_dns_records(snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    routing_dns = snapshot.get("routing_dns") or {}
    if isinstance(routing_dns, list):
        return [record for record in routing_dns if isinstance(record, dict)]
    for key in ("record", "records"):
        records = routing_dns.get(key, []) if isinstance(routing_dns, dict) else []
        if isinstance(records, list):
            return [record for record in records if isinstance(record, dict)]
    return []


def _matches_source(rule: dict[str, Any], source_address: str) -> bool:
    matchers = rule.get("matchers") or []
    return any(
        isinstance(matcher, dict)
        and matcher.get("type") == "literal"
        and matcher.get("field") == "to"
        and str(matcher.get("value") or "").lower() == source_address
        for matcher in matchers
    )


def _validate_complete_routing_dns(
    records: list[dict[str, Any]], domain: str, source: str
) -> None:
    mx_records = [
        record
        for record in records
        if str(record.get("type") or "").upper() == "MX"
        and _dns_name(record.get("name"), domain) == domain
    ]
    mx_targets = {
        _dns_content("MX", record.get("content")) for record in mx_records
    }
    spf_records = [
        record
        for record in records
        if str(record.get("type") or "").upper() == "TXT"
        and _dns_name(record.get("name"), domain) == domain
        and _dns_content("TXT", record.get("content")).lower().startswith("v=spf1")
    ]
    routing_dkim_records = [
        record
        for record in records
        if str(record.get("type") or "").upper() == "TXT"
        and _dns_name(record.get("name"), domain)
        == f"{ROUTING_DKIM_SELECTOR}.{domain}"
    ]
    routing_dkim_prefix = "v=DKIM1; h=sha256; k=rsa; p="
    routing_dkim_content = (
        _dns_content("TXT", routing_dkim_records[0].get("content"))
        if len(routing_dkim_records) == 1
        else ""
    )

    if len(mx_records) != 3 or mx_targets != EXPECTED_ROUTING_MX_TARGETS:
        raise PreflightError(
            f"{source} has incomplete, conflicting, or non-Cloudflare apex MX records"
        )
    if len(spf_records) != 1 or _dns_content(
        "TXT", spf_records[0].get("content")
    ) != EXPECTED_ROUTING_SPF:
        raise PreflightError(
            f"{source} does not have the single reviewed Email Routing SPF record"
        )
    if not (
        routing_dkim_content.startswith(routing_dkim_prefix)
        and len(routing_dkim_content) > len(routing_dkim_prefix)
    ):
        raise PreflightError(
            f"{source} Email Routing DKIM record is incomplete or changed"
        )


def validate_snapshot(snapshot: dict[str, Any], config: Config) -> dict[str, Any]:
    token = snapshot.get("token") or {}
    if token.get("status") != "active":
        raise PreflightError("The scoped Cloudflare API token is not active")

    zone = snapshot.get("zone") or {}
    if zone.get("id") != config.zone_id:
        raise PreflightError("Cloudflare returned a different zone ID")
    if str(zone.get("name") or "").lower() != config.domain:
        raise PreflightError("Cloudflare zone/domain mismatch")
    if (zone.get("account") or {}).get("id") != config.account_id:
        raise PreflightError("Cloudflare account/zone mismatch")
    if zone.get("status") != "active":
        raise PreflightError("The Cloudflare zone is not active")

    api_dns_records = [
        record
        for record in snapshot.get("dns_records", [])
        if isinstance(record, dict)
    ]
    dns_records = [
        record
        for record in (
            snapshot.get("public_dns_records", [])
            if "public_dns_records" in snapshot
            else api_dns_records
        )
        if isinstance(record, dict)
    ]
    settings = snapshot.get("routing_settings") or {}
    settings_enabled = settings.get("enabled") is True
    settings_status = str(settings.get("status") or "unconfigured")
    live_mx = {
        _dns_key(record, config.domain)
        for record in dns_records
        if str(record.get("type") or "").upper() == "MX"
        and _dns_name(record.get("name"), config.domain) == config.domain
    }
    live_spf = {
        _dns_content("TXT", record.get("content"))
        for record in dns_records
        if str(record.get("type") or "").upper() == "TXT"
        and _dns_name(record.get("name"), config.domain) == config.domain
        and _dns_content("TXT", record.get("content")).lower().startswith("v=spf1")
    }
    if len(live_spf) > 1:
        raise PreflightError("Duplicate apex SPF records detected")

    expected_routing_records = _routing_dns_records(snapshot)
    expected_routing_keys = {
        _dns_key(record, config.domain) for record in expected_routing_records
    }
    live_dns_keys = {_dns_key(record, config.domain) for record in dns_records}
    expected_mx = {
        _dns_key(record, config.domain)
        for record in expected_routing_records
        if str(record.get("type") or "").upper() == "MX"
    }
    expected_spf = {
        _dns_content("TXT", record.get("content"))
        for record in expected_routing_records
        if str(record.get("type") or "").upper() == "TXT"
        and _dns_content("TXT", record.get("content")).lower().startswith("v=spf1")
    }
    if settings_enabled:
        _validate_complete_routing_dns(
            dns_records, config.domain, "Public DNS"
        )
        if expected_routing_records:
            _validate_complete_routing_dns(
                expected_routing_records,
                config.domain,
                "Cloudflare's Email Routing DNS response",
            )
            missing_routing_records = expected_routing_keys - live_dns_keys
            if missing_routing_records:
                raise PreflightError(
                    "Cloudflare Email Routing DNS is incomplete or changed"
                )
    else:
        if live_mx and live_mx != expected_mx:
            raise PreflightError(
                "Conflicting or non-Cloudflare apex MX records detected"
            )
        if live_spf and live_spf != expected_spf:
            raise PreflightError(
                "The apex SPF record conflicts with Cloudflare Email Routing"
            )

    dmarc_records = [
        record
        for record in dns_records
        if str(record.get("type") or "").upper() == "TXT"
        and _dns_name(record.get("name"), config.domain)
        == f"_dmarc.{config.domain}"
    ]
    if len(dmarc_records) > 1:
        raise PreflightError("Duplicate DMARC records detected")
    if settings_enabled and not dmarc_records:
        raise PreflightError("The reviewed DMARC policy is missing from public DNS")
    if dmarc_records and dmarc_records[0].get("content") != EXPECTED_DMARC:
        raise PreflightError("The live DMARC policy differs from the reviewed monitoring policy")

    for token_value in config.ses_dkim_tokens:
        expected_name = f"{token_value}._domainkey.{config.domain}"
        expected_target = f"{token_value}.dkim.amazonses.com"
        matching = [
            record
            for record in dns_records
            if str(record.get("type") or "").upper() == "CNAME"
            and _dns_name(record.get("name"), config.domain) == expected_name
        ]
        if len(matching) != 1 or _dns_content(
            "CNAME", matching[0].get("content")
        ) != expected_target:
            raise PreflightError(f"SES Easy DKIM is missing or changed at {expected_name}")

    if settings_enabled and not config.onboarding_enabled:
        raise PreflightError(
            "Cloudflare Email Routing is live while Terraform onboarding is disabled"
        )
    if settings_enabled and not config.state_has_dns:
        raise PreflightError(
            "Cloudflare Email Routing DNS is live but absent from the reviewed Terraform state"
        )
    if config.state_has_dns and not settings_enabled:
        raise PreflightError(
            "Terraform state owns Email Routing DNS but Cloudflare does not report it enabled"
        )

    catch_all = snapshot.get("catch_all") or {}
    if catch_all.get("enabled") is True:
        raise PreflightError("Cloudflare Email Routing catch-all is enabled")

    destinations = [
        address
        for address in snapshot.get("destinations", [])
        if isinstance(address, dict)
        and str(address.get("email") or "").lower() == config.destination
    ]
    if len(destinations) > 1:
        raise PreflightError("Duplicate protected forwarding destinations detected")
    if config.onboarding_enabled and destinations and not config.state_has_address:
        raise PreflightError(
            "The configured destination already exists outside the reviewed Terraform state"
        )
    if config.state_has_address and not destinations:
        raise PreflightError(
            "Terraform state owns the destination but Cloudflare no longer returns it"
        )
    destination_verified = bool(destinations and destinations[0].get("verified"))

    rules = [
        rule for rule in snapshot.get("rules", []) if isinstance(rule, dict)
    ]
    exact_rules = [
        rule for rule in rules if _matches_source(rule, config.source_address)
    ]
    if len(exact_rules) > 1:
        raise PreflightError("Duplicate exact-address forwarding rules detected")
    if exact_rules and not config.state_has_rule:
        raise PreflightError(
            "The exact contact forwarding rule exists outside the reviewed Terraform state"
        )
    if config.state_has_rule and not exact_rules:
        raise PreflightError(
            "Terraform state owns the exact forwarding rule but Cloudflare no longer returns it"
        )
    enabled_other_rules = [
        rule
        for rule in rules
        if rule.get("enabled") is True
        and not _matches_source(rule, config.source_address)
    ]
    if enabled_other_rules:
        raise PreflightError("Unexpected additional Email Routing rules are enabled")

    if exact_rules:
        rule = exact_rules[0]
        actions = rule.get("actions") or []
        if not (
            len(actions) == 1
            and isinstance(actions[0], dict)
            and actions[0].get("type") == "forward"
            and [str(value).lower() for value in actions[0].get("value") or []]
            == [config.destination]
            and rule.get("source") in {None, "api"}
        ):
            raise PreflightError(
                "The exact contact rule has an unexpected action, destination, or owner"
            )

    if config.forwarding_enabled:
        if not config.onboarding_enabled:
            raise PreflightError("Forwarding cannot be enabled before onboarding")
        if not settings_enabled or settings_status != "ready":
            raise PreflightError("Cloudflare Email Routing is not ready")
        if not destination_verified:
            raise PreflightError(
                "The protected destination is not verified; open the Cloudflare message first"
            )

    return {
        "zone": config.domain,
        "routing_status": settings_status,
        "routing_enabled": settings_enabled,
        "mx_records": len(live_mx),
        "spf_records": len(live_spf),
        "routing_dns_records": (
            5
            if settings_enabled and not expected_routing_keys
            else len(expected_routing_keys)
        ),
        "ses_dkim_records": len(config.ses_dkim_tokens),
        "destination_present": bool(destinations),
        "destination_verified": destination_verified,
        "exact_rule_present": bool(exact_rules),
        "exact_rule_enabled": bool(exact_rules and exact_rules[0].get("enabled")),
        "catch_all_enabled": False,
    }


def main() -> int:
    try:
        config = Config.from_environment()
        client = CloudflareClient(_required("CLOUDFLARE_API_TOKEN"))
        summary = validate_snapshot(collect_snapshot(client, config), config)
    except PreflightError as error:
        print(f"Email Routing preflight failed: {error}", file=sys.stderr)
        return 1

    print("Cloudflare Email Routing read-only preflight passed.")
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
