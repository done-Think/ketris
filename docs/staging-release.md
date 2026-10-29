# Publicação coordenada da refatoração

Status em 29/10/2026: última publicação automática confirmada no commit
`87ead6ced95ae428c721cd4c5fba88ffe044342d`, após o merge do PR #164.
A [execução 40897148130](https://github.com/done-Think/ketris/actions/runs/40897148130) aprovou
2.902 testes unitários, 733 integrações, build e 65 cenários de navegador. A release verificou
o destino, não encontrou migrations pendentes, conferiu o schema, aprovou login no candidato,
promoveu o artefato e aprovou login no domínio público. Sessão e estatísticas públicas
responderam 200 com o SHA esperado; estatísticas exigem o contrato HTTP v2.
Os fluxos privados de S3 e o envio SES foram exercitados nesse artefato em 29/10, conforme abaixo.

O merge posterior do PR #166 (`0c65673e`) aprovou quality e build, mas o teste de seleção
de bairro/cidade verificou a URL antes de a navegação terminar. A
[execução 40943395733](https://github.com/done-Think/ketris/actions/runs/40943395733) falhou
em `auth-e2e` e ignorou `release-staging`, preservando o artefato anterior. Consultas públicas
em 29/10 confirmaram o SHA `87ead6ce`. A branch `fix/staging-readiness` corrige a espera do
teste e preserva capturas de falha como artefatos por execução/tentativa, durante sete dias.

### Próxima entrega: contrato HTTP v3

Com o inventário do staging limitado ao site Ketris, esta branch prepara o corte de entradas
legadas: contrato HTTP v3, ações CRM canônicas e access tokens de tenant com `role`. Frontend, OpenAPI, tipos
gerados e smoke de publicação passam à mesma versão. O artefato publicado `87ead6ce` ainda usa v2.

Após a promoção, abas com v2 recebem 409 antes do handler e devem recarregar. Cookies de tenant dependentes
do claim aposentado exigem novo login; sessões canônicas conservam suas verificações de usuário
e versão. Históricos antigos permanecem legíveis. A cadeia de 53 migrations não muda.

Verificação local: 338 testes unitários direcionados, 39 testes dos scripts, 33 integrações
PostgreSQL e 67 cenários Cypress em 18 specs aprovados, além de build, tipos, lint, guardas e
OpenAPI. O navegador conferiu a sessão canônica, o novo login exigido pelo cookie legado e
o bloqueio de mutações de abas v2 antes da escrita. Os bancos descartáveis foram removidos.
O Cypress usou espera padrão de comandos de 30 s somente na CLI local; o CI mantém seus tempos padrão.

### Integrações exercitadas em 29/10/2026

- SES: requisição de confirmação pelo site para destinatário autorizado; o contador do SES
  passou de zero para um envio e o usuário confirmou o recebimento no Outlook, com remetente
  `contato@donethink.com`. O cadastro temporário da aplicação foi removido. A identidade verificada
  de envio é independente da URL Vercel do site.
- S3: APIs reais de Contracts e Maintenance, preflights HTTP da origem de staging, PUT com
  checksum, confirmação e downloads assinados com integridade conferida. Acesso anônimo e de
  outro tenant foram recusados. O registro manual das duas partes usou o PDF/hash corretos e
  produziu auditoria. Duas rodadas cobriram arquivos pequenos, PDF de 10 MiB e PNG de 7,49 MiB.
  Os quatro tenants temporários, registros e quatro versões S3 foram removidos.

As evidências detalhadas estão em [Contracts](technical-debt/contracts-s3-cors.md) e
[Maintenance](technical-debt/maintenance-s3-cors.md). Aceite humano das telas e ensaios de carga
no hosting continuam separados desses testes de integração.

A migration de renome muda o contrato físico do banco. Uma instância antiga não pode continuar
atendendo durante a troca. `X-Ketris-Api-Version` protege o contrato HTTP; não adapta uma
instância antiga ao banco novo. O incidente abaixo ocorreu com migrations manuais e deploy independente.
A automação de mudanças compatíveis coordena essas etapas e foi exercitada no staging.

## Automação implementada e validada no staging

Implementação integrada à `dev` pelo PR #162, commit `2ae29ef12f3d3dde8d69bb00263e5b10ed5d1718`.
Secrets, variables e restrição à branch `dev` foram configurados no GitHub Environment
`staging`. A [primeira execução](https://github.com/done-Think/ketris/actions/runs/40812034760)
expôs a ausência do repasse dos secrets. Nenhum deploy, reset ou apply AWS foi executado
nessa tentativa. O PR #163 corrigiu o repasse nominal dos secrets e a duplicação de CI nas
branches de trabalho; a execução bem-sucedida de 29/10 está registrada acima.

```text
Merge na dev → quality + auth-e2e → deployment candidato sem promoção
             → migrations pendentes → diff do schema
             → conta de smoke isolada → login no candidato → promoção → login no domínio público
```

O CI chama o workflow reutilizável `deploy-staging.yml` pelo mesmo SHA. A chamada automática
não depende de `workflow_dispatch` na `main`. Push de outra branch e PR não publicam. O CI da
`dev` não é cancelado por outro push; release e reset compartilham a trava
`ketris-staging-release`. Um commit superado é recusado antes da alteração do banco.

Os testes completos rodam em cada abertura, reabertura ou atualização de PR. O gatilho
`push` fica restrito à `dev` e à `main`: branches de trabalho precisam de um PR aberto para
executar o CI, incluindo PRs em rascunho. Isso evita executar as mesmas suítes por push e
por atualização do PR. Depois do merge, a execução na `dev` valida o commit integrado antes
da publicação; a execução na `main` valida o resultado integrado nessa branch.

A chamada repassa nominalmente os três secrets obrigatórios e o override opcional de bypass.
O job reutilizável continua vinculado ao environment `staging`, cujos valores prevalecem.
Sem esse repasse, o GitHub resolve os secrets como vazios mesmo com `environment` declarado;
ver [secrets em workflows reutilizáveis](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows).

A CLI Vercel está fixada em `65.5.0`. O candidato é preparado por `--prod --skip-domain` e
promovido sem rebuild; o alvo production é do projeto de STAGING `ketris-web-x9bk`, não da
produção do Ketris. Nome, IDs, Root Directory, domínio e destino PostgreSQL são conferidos.
O header `X-Ketris-Release-Sha` permite confirmar o commit do candidato e do domínio público.
Ver [deploy pela CLI](https://vercel.com/docs/cli/deploying-from-cli).

O arquivo `apps/web/vercel.json` desabilita deployments diretos por Git da `dev`. Ao integrar
esta branch, o CI aprovado da `dev` aciona diretamente a release. Configurar os acessos antes
do merge e conferir os demais projetos do monorepo que usam `apps/web`. `.vercelignore` exclui
envs, credenciais locais, dumps e estados Terraform.

### Configuração e primeira publicação

1. Executar o [prompt de GitHub/Vercel](staging-console-setup.md) e configurar os secrets e
   variables da tabela abaixo. Usar a mesma URL PostgreSQL e a mesma chave de contratos da
   aplicação; não substituir a chave que protege os dados existentes.
2. Conferir CI verde nesta branch e o alcance da configuração da Vercel. O environment deve
   permitir a `dev` sem aprovação humana a cada execução. Preparar os acessos antes do merge.
3. Integrar na `dev`: o CI completo precede a primeira publicação, acionada diretamente após
   `quality` e `auth-e2e` aprovados. Não há flags de ativação ou de snapshot para cadastrar.
4. Conferir o resumo do Actions, o SHA do domínio e o login. Os próximos pushes/merges na `dev`
   repetem a sequência automaticamente. Se algum acesso estiver incorreto, corrigir a
   configuração e reexecutar o CI do commit atual. A recuperação manual opcional requer a
   definição do workflow também na branch padrão; o fluxo automático não requer.

| Configuração no environment staging  | Tipo / finalidade                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | Variables com os IDs confirmados do projeto/time                               |
| `VERCEL_TOKEN`                       | Secret com acesso ao projeto Vercel correto                                    |
| `STAGING_DATABASE_URL`               | Secret para o RDS declarado em `infra/deploy/staging.json`                     |
| `CONTRACTS_DATA_ENCRYPTION_KEY`      | Secret existente, idêntico ao da aplicação                                     |
| `VERCEL_AUTOMATION_BYPASS_SECRET`    | Override opcional; o pipeline resolve o acesso de automação pela API da Vercel |

O pipeline cria/reconcilia somente a fixture reservada `staging-ci-smoke-tenant` /
`staging-ci-smoke-user`, com papel AGENT e senha aleatória de 256 bits gerada em memória a
cada execução, sem secrets adicionais no GitHub. Colisões com outras contas impedem a publicação.
O teste faz CSRF → callback Credentials do NextAuth → sessão autenticada, verifica o ID do
usuário no RDS esperado e revoga o refresh token gerado. Não executa o seed completo nem reset.
Se o projeto tiver proteção, reutiliza um bypass de automação existente ou o cria pela API
com o token autorizado, antes de preparar o candidato. A proteção do projeto permanece ativa;
o valor fica em memória, sem ser escrito nos logs.

### Novas migrations e falhas

Cada migration pendente deve declarar sua compatibilidade em `infra/deploy/staging.json`:

```json
{
  "compatibleMigrations": {
    "20261105090000_add_optional_field": "Adds a nullable field; existing readers and writers remain compatible."
  }
}
```

Preservar os demais campos do arquivo. A declaração é feita no mesmo PR, sem aprovação manual
na execução. Revisar leitores/escritores anteriores e usar expansão/contração em entregas
separadas. A checagem bloqueia SQL com DROP, TRUNCATE, RENAME, DELETE ou ALTER COLUMN; é uma
barreira conservadora, não um parser ou prova de compatibilidade. DDL incompatível permanece
bloqueado até existir um caminho de manutenção/drenagem efetivamente implementado e testado.

O ledger é conferido por checksum e migrations falhas/desconhecidas são recusadas. Depois da
aplicação, `migrate diff --exit-code` deve ficar vazio. Falha de build, migration ou
login do candidato impede a promoção. Falha após promover marca a release como falha; não
reseta dados nem reverte o schema automaticamente. Reexecutar o CI para retomar após corrigir
a causa. O teste de sessão anônima 200 não substitui o login real.

O usuário confirmou que os dados atuais de staging são fictícios e descartáveis e dispensou
as flags propostas. O pipeline não cria snapshots extras por publicação e não depende de
credenciais IAM ou configuração OIDC. A política de backups existente do RDS permanece
independente. Os registros históricos da recuperação e os procedimentos de produção abaixo
preservam as evidências e requisitos daqueles contextos.

### Verificação desta implementação

- 25 testes de sequência, falhas, alvo e autenticação com respostas simuladas.
- Ensaio em database temporário local com as 53 migrations reais: checksums conferidos;
  criação/repetição da fixture e conflitos com outras contas/tenants testados.
- 31 testes do proxy, incluindo o SHA da release; tipos e lint dos arquivos alterados.
- `actionlint` nos três workflows e `terraform validate` aprovados, sem apply.
- CLI oficial conferida para os argumentos deploy/promote. Publicação e autenticação reais
  aprovadas na execução `40897148130`; a entrega posterior do PR #166 aguarda corrigir o CI.

## Recuperação do staging em 28/10/2026

O commit `e76d31099fb2d89849d004cf6dc3430615c54c4c` chegou à `dev` com
[CI aprovado](https://github.com/done-Think/ketris/actions/runs/40722453727) e
[deploy da aplicação na Vercel](https://vercel.com/maaxsiqs-projects/ketris-web-x9bk/BzYMvTTnzvQL9USaGjwWP4sRoF59).
O RDS `ketris-staging` ainda tinha 49 migrations e tabelas em português. A aplicação nova
consultava `public.users`, causando a indisponibilidade da sessão. O build da Vercel não
executa migrations; o CI usa outro banco, efêmero.

Antes da alteração, o usuário confirmou o snapshot manual
`ketris-staging-pre-english-20261028` como **Available** no RDS. Uma cópia lógica recente do
staging foi restaurada em banco descartável no Docker e recebeu as quatro migrations pendentes.
O ensaio preservou as contagens das 44 tabelas (745 linhas) e os hashes das 17 colunas de
JSON/arrays inventariadas; a repetição do deploy não aplicou novas alterações. A execução das
migrations na cópia levou 1,642 s; isso não mede contenção sob carga no RDS. A restauração lógica
foi testada; a restauração do snapshot físico do RDS não foi executada.

Depois do ensaio, `prisma migrate deploy` aplicou no RDS, sem seed ou reset:

1. `20261101000000_rename_schema_to_english`
2. `20261102090000_tenant_scoped_children_and_required_metadata`
3. `20261103090000_incremental_mutation_authorship`
4. `20261104090000_remaining_aggregate_mutation_authorship`

O banco passou a registrar **53 migrations concluídas**, sem pendentes ou falhas, e
`prisma migrate diff` não detectou diferença para o schema da aplicação. As contagens antes e
depois permaneceram em **21 usuários, 25 imóveis e 12 tenants**. Em
`https://ketris-web-x9bk.vercel.app`, sessão anônima, estatísticas e listagem de imóveis
responderam **200**; a listagem informou 18 imóveis públicos. O usuário confirmou que o login
funcionou no navegador após a recuperação. Esses testes não encerram o aceite funcional completo.

A recuperação foi executada pelo Prisma local contra o RDS confirmado, com TLS e senha
mantida em arquivo local ignorado, pois a definição manual do workflow ainda não estava na
branch padrão `main`. Não houve execução do workflow de staging nem nova promoção na Vercel:
a aplicação compatível já estava publicada. O incidente comprova a necessidade de coordenar
essas etapas antes da próxima mudança incompatível.

O dump e os inventários privados do ensaio ficaram em
`/private/tmp/ketris-staging-rehearsal-52FM1J/`, fora do Git. São artefatos temporários locais;
o snapshot identificado acima é o ponto de recuperação registrado na AWS.

## Antes da janela

1. CI verde para o SHA exato, incluindo tipos OpenAPI, testes, build e navegador.
2. Ensaio em cópia autorizada do banco de staging: inventário de mídia, históricos mistos,
   chave de CPFs preservada, duração e locks medidos. O ensaio local não substitui esse passo.
3. Snapshot com restauração verificada e referência registrada; aplicação anterior e nova
   disponíveis como artefatos imutáveis. Confirmar quem promove/reverte o hosting.
4. Credenciais válidas no ambiente da aplicação, conexão PostgreSQL, bucket privado e CORS das
   origens exatas. Validar autorização → PUT com checksum → confirmação → leitura assinada.
5. SES com remetente/domínio verificado, permissões e restrições do sandbox conhecidas;
   validar cadastro, recuperação, convite e troca de e-mail com destinatários autorizados.

O botão **Run workflow** requer `workflow_dispatch` na branch padrão do repositório.
Conferir essa disponibilidade antes da janela: a definição manual somente na `dev` não
habilita o botão se a `main` ainda contém a definição antiga acionada por push.

## Durante a janela

1. Ativar manutenção no ingresso/hosting, interromper novas escritas e drenar todas as instâncias
   antigas e workers. Confirmar isso antes de executar o workflow.
2. Para DDL incompatível, preparar um procedimento específico com CI, snapshot e artefato
   compatível. O fluxo automático atual bloqueia essas migrations; não declará-las compatíveis
   para contornar o bloqueio. Seed completo e reset continuam fora da publicação automática.
3. Promover o artefato compatível no hosting, conferir cadeia de migrations e saúde do banco,
   login e permissões; conferir perfis, CRM, contrato, financeiro, agenda e uploads.
4. Testar chamada antiga (409), contrato v2 e recarregamento de uma aba antiga. Liberar tráfego
   somente depois dos smokes e monitorar erros, latência de banco e dos contadores compartilhados.

A release automática de mudanças compatíveis inclui a promoção e os testes de autenticação.
O caminho de manutenção/drenagem para DDL incompatível ainda precisa ser implementado e
exercitado; o procedimento acima permanece referência para essa etapa.

## Recuperação

Falha transacional: conferir catálogo e `_prisma_migrations`, reconciliar a execução falha e repetir
somente após corrigir a causa. Migration concluída: preferir correção compatível ou restauração
coordenada do snapshot e da aplicação. O `english-rename/down.sql` inverte apenas o renome congelado;
não é rollback das migrations de modelagem posteriores. Não apagar histórico do Prisma e não
executar esse down sobre o schema posterior sem compensações específicas e ensaiadas.

## Dependências externas em aberto

Assinatura eletrônica exige provedor, fluxo e sandbox; boleto exige gateway/convênio. Os registros
manuais atuais não passam a representar integrações oficiais. Termos/privacidade precisam de URLs
e versões aprovadas. Juros, multa, carência, renovação e aditivos precisam das regras do time
responsável. O código não presume aprovação dessas condições nem fabrica comprovantes.

O acesso PostgreSQL ao RDS e a compatibilidade do schema foram comprovados na recuperação
acima. A AWS CLI local continua sem credenciais; CORS, uploads S3 e fluxos SES publicados não
foram revalidados. Produção não foi alterada.

S3 e SES usam a cadeia padrão do SDK instalado: variáveis de credenciais temporárias
(incluindo `AWS_SESSION_TOKEN`), profile local ou role do workload. Para testar com um profile,
renovar sua sessão e iniciar o processo com `AWS_PROFILE` definido; uma sessão expirada continua
sendo erro de acesso. Sem credenciais/profile em desenvolvimento, uploads conservam o storage
local. Não é necessário criar chaves permanentes para executar esses testes locais.

## Verificação anterior, somente de leitura em 28/10/2026

A URL de staging registrada no Terraform, `https://ketris-web-x9bk.vercel.app`, respondeu 200 em
`/pt` e `/api/marketplace/stats`. Esses retornos não anunciaram o cabeçalho de contrato v2.
`/api/docs/openapi.json` respondeu 200 e informou API `0.1.0`, com os campos antigos em português
nas propriedades. A entrega do renome gerou OpenAPI `2.0.0`. Isso confirmou que aquela aplicação
não está promovida ali; não comprova o schema atual do RDS. Não houve escrita nem implantação
nessa verificação. A AWS continuou recusando STS com sessão expirada. Este é o registro anterior
ao merge e à recuperação descritos acima; não representa o estado atual do staging.
