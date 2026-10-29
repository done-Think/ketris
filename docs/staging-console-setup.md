# Configuração da publicação automática de staging

Use estes prompts na extensão com o console correspondente aberto. Eles configuram acessos;
a ativação final depende dos testes do workflow da branch `ci/automate-staging-release`.
RDS e S3 existentes podem ser reaproveitados. O usuário autorizou descartar os dados fictícios,
mas não é necessário excluir os recursos para configurar a publicação.

## Prompt para GitHub e Vercel — necessário

```text
Configure os acessos para o pipeline de staging do repositório done-Think/ketris.
O projeto Vercel correto é ketris-web-x9bk, com domínio ketris-web-x9bk.vercel.app.

1. Na Vercel, confirme o time proprietário, Project ID, Team ID, Root Directory apps/web
   e o ambiente production desse projeto de STAGING. Não selecionar outro projeto.
2. Crie um token de automação da Vercel no time correto e salve-o diretamente como
   secret VERCEL_TOKEN no GitHub Environment staging. Não retorne o token no chat.
3. No GitHub Environment staging, configure as variables VERCEL_ORG_ID e
   VERCEL_PROJECT_ID com os IDs confirmados. Configure STAGING_RELEASE_ENABLED=false
   por enquanto e STAGING_SNAPSHOT_ENABLED=false, pois os dados atuais são fictícios.
4. Restrinja o environment à branch dev. A publicação automática não pode depender
   de aprovação manual em cada execução. Preserve as proteções da produção.
5. Confira a existência dos secrets STAGING_DATABASE_URL e CONTRACTS_DATA_ENCRYPTION_KEY.
   A URL deve apontar para o mesmo RDS usado por esse projeto Vercel. A chave de contratos
   deve ser a existente, igual à da aplicação. Não gere outra chave nem exponha os valores.
   Se uma informação não estiver disponível, informe apenas qual secret falta.
6. Configure o secret STAGING_SMOKE_EMAIL=staging-smoke@ketris.example.test e gere uma
   senha aleatória de pelo menos 20 caracteres para o secret STAGING_SMOKE_PASSWORD.
   O pipeline criará/reconciliará somente essa conta fictícia em um tenant reservado.
   Não é preciso cadastrar a conta no site. Não utilizar a senha pessoal do proprietário.
7. Se o deployment candidato tiver Deployment Protection, configure um secret de bypass
   da automação da Vercel como VERCEL_AUTOMATION_BYPASS_SECRET no mesmo environment.
   Preserve a proteção dos deployments.
8. Não faça deploy, merge, reset, promoção ou ativação de STAGING_RELEASE_ENABLED ainda.
   O repositório preparará a desativação do deploy direto por Git na dev para evitar
   dois publicadores. Não altere globalmente os outros projetos do monorepo.

Retorne somente: time/projeto/IDs confirmados, nomes dos secrets/variables configurados,
eventuais pendências e confirmação de que a automação continua desativada. Sem credenciais.
```

## Prompt para AWS — opcional para snapshots automáticos

O acesso PostgreSQL usa `STAGING_DATABASE_URL`; não precisa de access key AWS. Esta role é
necessária apenas para ativar `STAGING_SNAPSHOT_ENABLED=true` depois. A autenticação por OIDC
usa credenciais temporárias, conforme a [documentação do GitHub](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).

```text
No console AWS, configure apenas a autenticação OIDC para snapshots do staging do Ketris.
Confirme a conta 946232032967 e região us-east-1. O banco é ketris-staging.

1. IAM → Identity providers: reutilize token.actions.githubusercontent.com se existir.
   Caso não exista, adicione OpenID Connect com provider URL
   https://token.actions.githubusercontent.com e audience sts.amazonaws.com.
2. Crie/reconcilie a role ketris-staging-github-release com a trust policy abaixo.
   Não anexar AdministratorAccess, AmazonRDSFullAccess nem permissões de S3.
3. Adicione a inline policy ketris-staging-release-snapshots abaixo.
4. Preserve o RDS, bucket, usuários IAM da aplicação, senhas e chaves existentes.
   A autorização para descartar staging não exige excluir esses recursos nesta tarefa.
5. Não crie access keys permanentes. Não execute Terraform, reset ou deploy.

Retorne somente o ARN do provider e da role, o nome da policy e o resultado da configuração.
Não retorne tokens ou senhas. A role será registrada no Terraform antes de qualquer apply.
```

Trust policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::946232032967:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {"StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:done-Think/ketris:environment:staging"
    }}
  }]
}
```

Inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InspectStagingBackups",
      "Effect": "Allow",
      "Action": ["rds:DescribeDBInstances", "rds:DescribeDBSnapshots"],
      "Resource": "*",
      "Condition": {"StringEquals": {"aws:RequestedRegion": "us-east-1"}}
    },
    {
      "Sid": "CreateStagingSnapshot",
      "Effect": "Allow",
      "Action": "rds:CreateDBSnapshot",
      "Resource": [
        "arn:aws:rds:us-east-1:946232032967:db:ketris-staging",
        "arn:aws:rds:us-east-1:946232032967:snapshot:ketris-staging-ci-*"
      ]
    },
    {
      "Sid": "TagStagingSnapshot",
      "Effect": "Allow",
      "Action": "rds:AddTagsToResource",
      "Resource": "arn:aws:rds:us-east-1:946232032967:snapshot:ketris-staging-ci-*"
    }
  ]
}
```

Depois da configuração, usar o ARN da role na variable `AWS_STAGING_RELEASE_ROLE_ARN` e
`AWS_REGION=us-east-1` do environment `staging`. Antes de habilitar snapshots automáticos,
definir retenção/limpeza: snapshots manuais gerados pelo pipeline não expiram sozinhos.
