#!/usr/bin/env python3
"""Fail closed when bootstrap IAM separation or resource scoping regresses."""

import json
import re
from pathlib import Path

import yaml


class CloudFormationLoader(yaml.SafeLoader):
    pass


def construct_intrinsic(loader, tag_suffix, node):
    if isinstance(node, yaml.ScalarNode):
        value = loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        value = loader.construct_sequence(node)
    else:
        value = loader.construct_mapping(node)
    return {tag_suffix: value}


CloudFormationLoader.add_multi_constructor("!", construct_intrinsic)

template_path = Path(__file__).with_name("template.yaml")
template = yaml.load(template_path.read_text(encoding="utf-8"), Loader=CloudFormationLoader)

replacements = {
    "AWS::Partition": "aws",
    "AWS::Region": "us-east-1",
    "AWS::AccountId": "000000000000",
    "InfrastructureBoundary": "arn:aws:iam::000000000000:policy/codehawks-infrastructure-boundary",
}


def substitute(value):
    return re.sub(
        r"\$\{([^}]+)\}",
        lambda match: replacements.get(match.group(1), "resolved-value"),
        value,
    )


def resolve(value):
    if isinstance(value, list):
        return [resolve(item) for item in value]
    if isinstance(value, dict):
        if set(value) == {"Sub"}:
            return substitute(value["Sub"])
        if set(value) == {"GetAtt"}:
            return replacements.get(value["GetAtt"], "resolved-value")
        if set(value) == {"Ref"}:
            return replacements.get(value["Ref"], "resolved-value")
        return {key: resolve(item) for key, item in value.items()}
    return value


def statements(document, effect=None):
    result = document["Statement"]
    if effect is not None:
        result = [statement for statement in result if statement["Effect"] == effect]
    return result


def actions(statement):
    value = statement["Action"]
    return value if isinstance(value, list) else [value]


def resources(statement):
    value = resolve(statement["Resource"])
    return value if isinstance(value, list) else [value]


def inline_policy(role_name):
    return template["Resources"][role_name]["Properties"]["Policies"][0][
        "PolicyDocument"
    ]


boundary = template["Resources"]["InfrastructureBoundary"]["Properties"][
    "PolicyDocument"
]
routine = inline_policy("InfrastructureRole")
bootstrap_update = inline_policy("BootstrapUpdateRole")
bootstrap_service = inline_policy("BootstrapCloudFormationRole")

size_budget = 5800
rendered_boundary_size = len(json.dumps(resolve(boundary), separators=(",", ":")))
if rendered_boundary_size > size_budget:
    raise SystemExit(
        f"InfrastructureBoundary renders to {rendered_boundary_size} characters; "
        f"the repository safety budget is {size_budget}."
    )
print(f"InfrastructureBoundary: {rendered_boundary_size}/{size_budget} characters")

frontend_role_arn = "arn:aws:iam::000000000000:role/codehawks-frontend-deploy"
protected_role_arns = {
    "arn:aws:iam::000000000000:role/codehawks-infrastructure-apply",
    "arn:aws:iam::000000000000:role/codehawks-bootstrap-update",
    "arn:aws:iam::000000000000:role/codehawks-bootstrap-cloudformation",
}
boundary_arn = "arn:aws:iam::000000000000:policy/codehawks-infrastructure-boundary"
bootstrap_stack_arn = (
    "arn:aws:cloudformation:us-east-1:000000000000:stack/codehawks-bootstrap/*"
)

dangerous_control_plane_actions = {
    "cloudformation:CreateChangeSet",
    "cloudformation:DeleteChangeSet",
    "cloudformation:ExecuteChangeSet",
    "cloudformation:SetStackPolicy",
    "cloudformation:UpdateStack",
    "cloudformation:UpdateTerminationProtection",
    "iam:AttachRolePolicy",
    "iam:CreatePolicyVersion",
    "iam:DeletePolicy",
    "iam:DeletePolicyVersion",
    "iam:DetachRolePolicy",
    "iam:PassRole",
    "iam:SetDefaultPolicyVersion",
}

for name, document in (("InfrastructureBoundary", boundary), ("InfrastructureRole", routine)):
    for statement in statements(document, "Allow"):
        allowed_actions = set(actions(statement))
        if allowed_actions & dangerous_control_plane_actions:
            raise SystemExit(
                f"{name} must not allow bootstrap/control-plane actions: "
                f"{sorted(allowed_actions & dangerous_control_plane_actions)}"
            )

        if "iam:DeleteRolePermissionsBoundary" in allowed_actions:
            raise SystemExit(
                f"{name} must never allow permissions-boundary removal from any role."
            )

        iam_mutations = {
            action
            for action in allowed_actions
            if action.startswith("iam:")
            and action
            not in {
                "iam:GetOpenIDConnectProvider",
                "iam:GetRole",
                "iam:GetRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:ListInstanceProfilesForRole",
                "iam:ListOpenIDConnectProviders",
                "iam:ListRolePolicies",
            }
        }
        if iam_mutations and set(resources(statement)) != {frontend_role_arn}:
            raise SystemExit(
                f"{name} IAM mutations must target only {frontend_role_arn}; "
                f"found {resources(statement)}."
            )

        if any("codehawks-*" in resource for resource in resources(statement)):
            raise SystemExit(f"{name} contains a wildcard CodeHawks resource ARN.")

    deny_actions_by_resource = {
        resource: {
            action
            for statement in statements(document, "Deny")
            if resource in resources(statement)
            for action in actions(statement)
        }
        for resource in protected_role_arns | {boundary_arn, bootstrap_stack_arn}
    }
    for role_arn in protected_role_arns:
        required = {
            "iam:DeleteRolePermissionsBoundary",
            "iam:PassRole",
            "iam:PutRolePermissionsBoundary",
            "iam:PutRolePolicy",
            "iam:UpdateAssumeRolePolicy",
            "iam:UpdateRole",
        }
        if not required <= deny_actions_by_resource[role_arn]:
            raise SystemExit(f"{name} lacks explicit mutation denies for {role_arn}.")
    required_boundary_denies = {
        "iam:CreatePolicyVersion",
        "iam:DeletePolicyVersion",
        "iam:SetDefaultPolicyVersion",
    }
    if not required_boundary_denies <= deny_actions_by_resource[boundary_arn]:
        raise SystemExit(f"{name} lacks explicit permissions-boundary version denies.")
    if "cloudformation:UpdateStack" not in deny_actions_by_resource[bootstrap_stack_arn]:
        raise SystemExit(f"{name} lacks an explicit bootstrap stack update deny.")

    frontend_boundary_denies = {
        action
        for statement in statements(document, "Deny")
        if frontend_role_arn in resources(statement)
        for action in actions(statement)
    }
    if "iam:DeleteRolePermissionsBoundary" not in frontend_boundary_denies:
        raise SystemExit(
            f"{name} must explicitly deny boundary removal from the frontend deploy role."
        )

    boundary_setter = next(
        (
            statement
            for statement in statements(document, "Allow")
            if "iam:PutRolePermissionsBoundary" in actions(statement)
        ),
        None,
    )
    if boundary_setter is None or boundary_arn not in json.dumps(
        resolve(boundary_setter.get("Condition", {}))
    ):
        raise SystemExit(
            f"{name} may attach only the exact infrastructure boundary to the deploy role."
        )

    role_creator = next(
        (
            statement
            for statement in statements(document, "Allow")
            if "iam:CreateRole" in actions(statement)
        ),
        None,
    )
    if role_creator is None or boundary_arn not in json.dumps(
        resolve(role_creator.get("Condition", {}))
    ):
        raise SystemExit(
            f"{name} may create the deploy role only with the exact infrastructure boundary."
        )

bootstrap_update_role = template["Resources"]["BootstrapUpdateRole"]["Properties"]
bootstrap_trust = json.dumps(bootstrap_update_role["AssumeRolePolicyDocument"])
if "BootstrapGitHubEnvironment" not in bootstrap_trust:
    raise SystemExit("Bootstrap update trust must use the separate bootstrap environment.")
if "environment:${GitHubEnvironment}" in bootstrap_trust:
    raise SystemExit("Bootstrap update trust must not use the routine Terraform environment.")

update_allows = statements(bootstrap_update, "Allow")
update_stack_statement = next(
    (
        statement
        for statement in update_allows
        if "cloudformation:UpdateStack" in actions(statement)
    ),
    None,
)
if update_stack_statement is None or resources(update_stack_statement) != [
    bootstrap_stack_arn
]:
    raise SystemExit("Bootstrap updater must update only the exact bootstrap stack.")

pass_role_statement = next(
    (statement for statement in update_allows if "iam:PassRole" in actions(statement)),
    None,
)
bootstrap_service_role_arn = (
    "arn:aws:iam::000000000000:role/codehawks-bootstrap-cloudformation"
)
if pass_role_statement is None or resources(pass_role_statement) != [
    bootstrap_service_role_arn
]:
    raise SystemExit("Bootstrap updater may pass only the bootstrap service role.")
if "cloudformation.amazonaws.com" not in json.dumps(
    pass_role_statement.get("Condition", {})
):
    raise SystemExit("Bootstrap service-role passing must be limited to CloudFormation.")

service_trust = template["Resources"]["BootstrapCloudFormationRole"]["Properties"][
    "AssumeRolePolicyDocument"
]
if json.dumps(service_trust).count("cloudformation.amazonaws.com") != 1:
    raise SystemExit("Bootstrap service role must trust only CloudFormation.")
if "Federated" in json.dumps(service_trust):
    raise SystemExit("Bootstrap service role must not be directly assumable through OIDC.")

service_resources = {
    resource
    for statement in statements(bootstrap_service, "Allow")
    for resource in resources(statement)
}
unexpected_role_resources = {
    resource
    for resource in service_resources
    if ":role/" in resource and resource not in protected_role_arns
}
if unexpected_role_resources:
    raise SystemExit(
        f"Bootstrap service role can mutate unexpected roles: {unexpected_role_resources}."
    )

print("Bootstrap IAM separation invariants passed.")
