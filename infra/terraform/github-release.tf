# Opt-in: the GitHub environment uses OIDC only for optional staging snapshots.
# The application storage user is unrelated and is preserved.
variable "github_release_enabled" {
  description = "Gerencia a role OIDC dos snapshots de staging; importar primeiro se criada no console."
  type        = bool
  default     = false
}

variable "github_oidc_provider_arn" {
  description = "ARN do provider existente token.actions.githubusercontent.com."
  type        = string
  default     = ""
}

data "aws_caller_identity" "github_release" {
  count = var.github_release_enabled ? 1 : 0
}

data "aws_iam_policy_document" "github_release_trust" {
  count = var.github_release_enabled ? 1 : 0
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:done-Think/ketris:environment:staging"]
    }
  }
}

resource "aws_iam_role" "github_release" {
  count              = var.github_release_enabled ? 1 : 0
  name               = "${var.project_name}-${var.environment}-github-release"
  assume_role_policy = data.aws_iam_policy_document.github_release_trust[0].json

  lifecycle {
    precondition {
      condition     = var.environment == "staging" && can(regex("^arn:aws:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$", var.github_oidc_provider_arn))
      error_message = "A role é exclusiva de staging e exige o ARN do provider OIDC do GitHub."
    }
  }
}

data "aws_iam_policy_document" "github_release_snapshots" {
  count = var.github_release_enabled ? 1 : 0
  statement {
    sid       = "InspectStagingBackups"
    actions   = ["rds:DescribeDBInstances", "rds:DescribeDBSnapshots"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }
  statement {
    sid     = "CreateStagingSnapshot"
    actions = ["rds:CreateDBSnapshot"]
    resources = [
      aws_db_instance.main.arn,
      "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.github_release[0].account_id}:snapshot:${var.project_name}-${var.environment}-ci-*"
    ]
  }
  statement {
    sid       = "TagStagingSnapshot"
    actions   = ["rds:AddTagsToResource"]
    resources = ["arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.github_release[0].account_id}:snapshot:${var.project_name}-${var.environment}-ci-*"]
  }
}

resource "aws_iam_role_policy" "github_release_snapshots" {
  count  = var.github_release_enabled ? 1 : 0
  name   = "${var.project_name}-${var.environment}-release-snapshots"
  role   = aws_iam_role.github_release[0].id
  policy = data.aws_iam_policy_document.github_release_snapshots[0].json
}

output "github_release_role_arn" {
  description = "Variable AWS_STAGING_RELEASE_ROLE_ARN do GitHub Environment staging."
  value       = var.github_release_enabled ? aws_iam_role.github_release[0].arn : null
}
