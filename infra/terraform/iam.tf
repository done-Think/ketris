# IAM user dedicado (não role — o app não roda dentro da AWS, é serverless na Vercel), com
# policy restrita só ao bucket de uploads. Sem AmazonS3FullAccess, sem delete amplo.
resource "aws_iam_user" "app_storage" {
  name = "${var.project_name}-${var.environment}-app-storage"
}

resource "aws_iam_access_key" "app_storage" {
  user = aws_iam_user.app_storage.name
}

data "aws_iam_policy_document" "app_storage" {
  statement {
    sid       = "ListBucket"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.uploads.arn]
  }

  statement {
    sid       = "ReadWriteObjects"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${aws_s3_bucket.uploads.arn}/*"]
  }
}

resource "aws_iam_user_policy" "app_storage" {
  name   = "${var.project_name}-${var.environment}-app-storage-policy"
  user   = aws_iam_user.app_storage.name
  policy = data.aws_iam_policy_document.app_storage.json
}
