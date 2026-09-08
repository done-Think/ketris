# Infra de staging — AWS RDS (Postgres) + S3

Provisiona o banco de staging (RDS Postgres) e o bucket de storage (S3) usados pelos deploys
de Preview da Vercel e pelo pipeline de CI. Produção fica para depois, reaproveitando este
mesmo desenho com uma instância separada.

## Por que a arquitetura é assim

- **RDS público (`publicly_accessible = true`)**: nem a Vercel (sem add-on de IP fixo) nem os
  runners hospedados do GitHub Actions têm IP de saída estável — não há origem fixa para
  restringir no Security Group. A mitigação fica em outra camada: TLS obrigatório
  (`rds.force_ssl=1`, ver `rds.tf`) + senha forte, nunca em rede.
- **Sem RDS Proxy**: RDS Proxy é estritamente um recurso interno de VPC — não existe forma de
  expô-lo publicamente na AWS real. Para o volume de staging, o pooling fica por conta do
  `pg.Pool` que o `PrismaPg` já usa internamente (`apps/web/src/server/db/prisma.ts`). Quando o
  tráfego real de staging crescer, ou na virada para produção, revisitar com um PgBouncer
  dedicado em compute pequeno (Fargate/App Runner) na frente de um RDS privado — ver "Dívida
  técnica" abaixo.
- **VPC dedicada, não a default da conta**: RDS exige subnets em ≥2 AZs mesmo sem standby, então
  o esforço de criar 2 subnets públicas + IGW é o mesmo custo, e evita misturar recursos do
  Terraform com o que já existe por padrão na conta.

## Riscos de segurança aceitos (leia antes do primeiro apply)

1. **Scan/fingerprinting da porta 5432 aberta ao mundo** — scanners automatizados vão achar o
   endpoint em horas/dias. Mitigado por `auto_minor_version_upgrade = true` (patches
   automáticos de segurança).
2. **Vazamento de credencial = acesso total, sem segunda camada de rede** — sem VPN/bastion, só
   a senha protege. Mitigações: nunca logar a `DATABASE_URL`, rotacionar a senha
   periodicamente (manual, não automatizado aqui), configurar um alarme de CloudWatch em
   `DatabaseConnections` com threshold baixo para detectar uso anômalo.
3. **Exaustão de recursos por handshake TCP não autenticado** — RDS não faz rate-limit de
   tráfego bruto na porta do banco; a instância pode ficar instável sob scan agressivo. Não há
   como eliminar isso via Security Group aqui; aceito como risco de staging (resize reativo se
   acontecer).
4. **O que a exposição pública NÃO piora**: um comprometimento de supply-chain dentro da
   própria function serverless já teria a `DATABASE_URL` em `process.env` de qualquer forma —
   RDS privado não ajudaria nesse cenário específico. O ganho real de rede privada é só contra
   vazamento acidental/externo da credencial.

## Pré-requisitos

- Terraform >= 1.7 instalado (`terraform version`).
- Uma conta AWS já existente.
- Um IAM user **dedicado ao Terraform em si** (diferente do IAM user que o Terraform vai criar
  para o app usar o S3) com permissão para criar VPC/RDS/S3/IAM — o jeito mais simples pra
  começar é anexar a policy gerenciada `AdministratorAccess` a esse user (aperte depois se
  quiser, mas não bloqueia o primeiro apply).
- Gere uma access key para esse IAM user no console AWS e rode:

  ```bash
  aws configure --profile ketris-terraform
  # AWS Access Key ID / Secret / região (ex.: us-east-1) / output format (json)
  export AWS_PROFILE=ketris-terraform
  ```

## Passo a passo

```bash
cd infra/terraform

cp terraform.tfvars.example terraform.tfvars
# edite terraform.tfvars se quiser mudar região/usuário — NÃO coloque a senha nele diretamente
export TF_VAR_db_password="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 32)"
echo "Guarde essa senha em um cofre (1Password/Bitwarden) — não fica em nenhum arquivo do repo."

terraform init
terraform plan    # REVISE a saída antes de aplicar — o Security Group 0.0.0.0/0 merece
                   # uma checagem visual manual todo apply, não só na primeira vez
terraform apply
```

Depois do primeiro `terraform init`, um arquivo `.terraform.lock.hcl` é gerado — **comite esse
arquivo** (ele pina a versão exata do provider AWS, igual um `package-lock.json`).

## Pegando os outputs

```bash
terraform output rds_endpoint
terraform output s3_bucket_name
terraform output app_storage_access_key_id

# Os dois sensíveis precisam do -raw:
terraform output -raw rds_database_url
terraform output -raw app_storage_secret_access_key
```

## Configurando a Vercel (manual — não tenho acesso à conta)

No dashboard do projeto na Vercel → Settings → Environment Variables, adicione (escopo
**Preview**, e depois Production quando existir):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | saída de `terraform output -raw rds_database_url` |
| `AWS_ACCESS_KEY_ID` | saída de `terraform output app_storage_access_key_id` |
| `AWS_SECRET_ACCESS_KEY` | saída de `terraform output -raw app_storage_secret_access_key` |
| `AWS_REGION` | o valor de `aws_region` usado (padrão `us-east-1`) |
| `S3_BUCKET_NAME` | saída de `terraform output s3_bucket_name` |

Depois disso, `AUTH_MOCK_ENABLED` pode ficar desligado nos Preview deploys — eles já vão
conseguir falar com um Postgres de verdade.

Se o volume de variáveis crescer ou precisar ficar sincronizado entre várias pessoas, dá pra
automatizar isso via Vercel CLI (`vercel env add <NOME> preview --token=$VERCEL_TOKEN --force`)
dentro do workflow `deploy-staging.yml` — não implementado agora porque, com meia dúzia de
variáveis que mudam raramente, o dashboard manual já resolve.

## CI/CD (`.github/workflows/`)

- `ci.yml`: typecheck/lint/testes contra um Postgres **efêmero do próprio runner**
  (`services: postgres:16-alpine`) — nunca contra este RDS de staging. Roda em todo PR/push.
- `deploy-staging.yml`: só em push para `dev`, roda `prisma migrate deploy` + `npm run db:seed`
  (idempotente) contra este RDS via a secret do GitHub `STAGING_DATABASE_URL`. O workflow usa
  um GitHub **Environment** chamado `staging` (Settings → Environments → New environment,
  nome exatamente `staging`) — configure as secrets ali dentro (não em Settings → Secrets →
  Actions direto), colando a mesma `rds_database_url` acima em `STAGING_DATABASE_URL`.
  Configure também `PLATFORM_ADMIN_NAME`/`PLATFORM_ADMIN_EMAIL`/`PLATFORM_ADMIN_PASSWORD` como
  secrets do mesmo Environment (usados pelo seed para bootstrapar o primeiro platform admin —
  ver ADR-0003). Usar um Environment (em vez de secret de repositório) permite adicionar
  revisores obrigatórios depois, se quiserem gate manual antes do deploy tocar o banco.

## Dívida técnica registrada (não bloqueia agora)

- **PgBouncer dedicado + RDS privado**: quando o tráfego real de staging crescer, ou na virada
  para produção, mover o RDS para `publicly_accessible = false` e colocar um PgBouncer em um
  compute pequeno e público (Fargate/App Runner) na frente, resolvendo pooling de verdade sem
  reabrir a porta do Postgres ao mundo.
- **`sslmode=verify-full`**: hoje a `DATABASE_URL` usa `sslmode=require&uselibpqcompat=true`
  (criptografa, mas não valida o certificado do servidor). A flag `uselibpqcompat=true` é
  necessária porque versões recentes do driver `pg` tratam `sslmode=require` como alias de
  `verify-full` por padrão, e o certificado do RDS não bate com uma CA confiável no Node sem o
  bundle da AWS — sem essa flag, a conexão falha com `self-signed certificate in certificate
  chain` (descoberto testando a conexão real). Upgrade de curto prazo: baixar o
  `global-bundle.pem` da AWS e usar `sslmode=verify-full` + `sslrootcert` (aí sim sem precisar de
  `uselibpqcompat`).
- **Backend remoto do Terraform**: state hoje é local (não commitado). Migrar para S3+DynamoDB
  lock assim que mais de uma pessoa passar a rodar `apply`.
- **Ajuste de código, fora deste diretório**: `apps/web/src/server/db/prisma.ts` não passa `max`
  para o `PrismaPg` hoje (usa o default do driver `pg`, que é 10). Quando ligar o app ao RDS de
  verdade, considere um `max` baixo (2-5) por instância de função serverless, para não somar mais
  rápido que o `max_connections` do `db.t4g.micro` (~87) suporta.
