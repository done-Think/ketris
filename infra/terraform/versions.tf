terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Estado local por enquanto (terraform.tfstate fica de fora do git — ver .gitignore). Migre
  # para um backend remoto (ex.: S3 + DynamoDB lock) assim que mais de uma pessoa passar a
  # rodar `terraform apply` neste diretório.
}
