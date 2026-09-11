output "rds_endpoint" {
  description = "Endpoint do RDS (host:porta)."
  value       = aws_db_instance.main.endpoint
}

output "rds_database_url" {
  description = <<-EOT
    DATABASE_URL pronta (com sslmode=require) para colar no .env/Vercel/GitHub secret.
    uselibpqcompat=true é necessário: versões recentes do driver `pg` tratam sslmode=require como
    alias de verify-full, e o certificado do RDS não bate com uma CA confiável por padrão no
    Node - essa flag restaura o comportamento tradicional (criptografa, não valida a cadeia),
    suficiente para o nível de risco aceito em staging (ver README).
  EOT
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.main.endpoint}/${var.db_name}?sslmode=require&uselibpqcompat=true"
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Nome do bucket S3 de uploads."
  value       = aws_s3_bucket.uploads.bucket
}

output "app_storage_access_key_id" {
  description = "AWS_ACCESS_KEY_ID do IAM user dedicado ao app (S3)."
  value       = aws_iam_access_key.app_storage.id
}

output "app_storage_secret_access_key" {
  description = "AWS_SECRET_ACCESS_KEY do IAM user dedicado ao app (S3)."
  value       = aws_iam_access_key.app_storage.secret
  sensitive   = true
}
