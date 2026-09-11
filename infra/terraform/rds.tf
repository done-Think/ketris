# rds.force_ssl é um parâmetro estático (exige reboot se mudado depois de criada a instância),
# por isso vive num parameter group customizado desde o início em vez de ser aplicado depois.
resource "aws_db_parameter_group" "postgres16_force_ssl" {
  name        = "${var.project_name}-${var.environment}-pg16-force-ssl"
  family      = "postgres16"
  description = "Postgres 16 com TLS obrigatório (rds.force_ssl=1)."

  parameter {
    name  = "rds.force_ssl"
    value = "1"
    # apply_method fixado explicitamente: sem isso, o provider assume "immediate" por padrão no
    # plano mas a instância criada com este parameter group desde o início já nasce com o valor
    # ativo, então a AWS devolve "pending-reboot" no refresh - gerando um diff fantasma em todo
    # `terraform plan` futuro se não travarmos o valor aqui (visto no apply real deste módulo).
    apply_method = "pending-reboot"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-${var.environment}"
  engine         = "postgres"
  engine_version = "16"

  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
  storage_type      = "gp3"
  db_name           = var.db_name
  username          = var.db_username
  password          = var.db_password
  port              = 5432

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres16_force_ssl.name

  publicly_accessible        = true
  multi_az                   = false
  auto_minor_version_upgrade = true
  backup_retention_period    = 1
  deletion_protection        = false
  skip_final_snapshot        = true
  apply_immediately          = true

  tags = {
    Name = "${var.project_name}-${var.environment}-postgres"
  }
}
