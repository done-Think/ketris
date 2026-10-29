# Configuração da publicação automática de staging

Use estes prompts na extensão com o console correspondente aberto. Eles configuram acessos;
a publicação automática começa ao integrar a branch `ci/automate-staging-release` na `dev`,
após o CI aprovado.
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
   VERCEL_PROJECT_ID com os IDs confirmados. Não há flags de ativação para cadastrar.
4. Restrinja o environment à branch dev. A publicação automática não pode depender
   de aprovação manual em cada execução. Preserve as proteções da produção.
5. Confira a existência dos secrets STAGING_DATABASE_URL e CONTRACTS_DATA_ENCRYPTION_KEY.
   A URL deve apontar para o mesmo RDS usado por esse projeto Vercel. A chave de contratos
   deve ser a existente, igual à da aplicação. Não gere outra chave nem exponha os valores.
   Se uma informação não estiver disponível, informe apenas qual secret falta.
6. A conta de teste de login é criada pelo pipeline em um tenant reservado, com senha
   aleatória gerada em memória a cada execução. Não cadastrar conta ou secrets de smoke.
7. Preserve a proteção dos deployments. O pipeline reutiliza o acesso de automação
   existente ou o cria pela API quando a proteção está ativada e o token tem permissão.
   O secret VERCEL_AUTOMATION_BYPASS_SECRET no GitHub é apenas um override opcional.
8. Conclua a configuração dos acessos antes do merge. Esta etapa configura os painéis;
   a integração da branch será feita após a validação. O repositório desabilitará o deploy
   direto por Git na dev para evitar dois publicadores. Não altere globalmente os outros
   projetos do monorepo.

Retorne somente: time/projeto/IDs confirmados, nomes dos secrets/variables configurados,
eventuais pendências. Sem credenciais. Não execute merge, deploy, reset ou promoção neste prompt.
```

## AWS nesta publicação

O pipeline conecta ao RDS existente por TLS usando `STAGING_DATABASE_URL`. Ele não cria
snapshots extras nem precisa de uma nova role, provider OIDC ou access keys AWS. Os backups
já configurados no RDS continuam com a política existente. RDS e S3 não são alterados por esta
simplificação; credenciais de upload/e-mail da aplicação continuam nas configurações próprias.
