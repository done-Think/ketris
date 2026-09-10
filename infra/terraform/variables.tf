variable "aws_region" {
  description = "Região AWS onde os recursos de staging são criados."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefixo usado no nome/tags de todos os recursos."
  type        = string
  default     = "ketris"
}

variable "environment" {
  description = "Nome do ambiente (aparece em tags e nos identificadores dos recursos)."
  type        = string
  default     = "staging"
}

variable "db_name" {
  description = "Nome do banco de dados Postgres criado na instância RDS."
  type        = string
  default     = "ketris"
}

variable "db_username" {
  description = "Usuário master do Postgres. Evite \"admin\"/\"postgres\" (reservados pelo RDS)."
  type        = string
  default     = "ketris"
}

variable "db_password" {
  description = <<-EOT
    Senha do usuário master do Postgres.
    NUNCA versione um valor real aqui — defina via terraform.tfvars (git-ignorado, ver
    terraform.tfvars.example) ou pela env var TF_VAR_db_password antes do apply.
  EOT
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "Classe da instância RDS."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Armazenamento alocado (GB) para a instância RDS."
  type        = number
  default     = 20
}
