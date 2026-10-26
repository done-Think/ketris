# `src/server`

Lógica de domínio do lado servidor (BFF), consumida pelos Route Handlers em `src/app/api/**/route.ts`. Ver
ADR-0001 (`docs/adr/0001-bff-banco-orm.md`, onde o BFF roda) e **ADR-0002**
(`docs/adr/0002-arquitetura-interna-bff.md`, como o código é organizado — leia antes de criar um domínio
novo).

## Estrutura de cada domínio

```text
src/server/
├── db/prisma.ts             # client singleton do Prisma
├── shared/
│   ├── errors/               # AppError e subclasses genéricas (NotFoundError, ConflictError,
│   │                          # UnauthorizedError, ForbiddenError...)
│   ├── http/                 # parseJsonBody/parseQuery/parseRouteParams (Zod) + handleRouteError — usados por todo Route Handler
│   └── schemas/               # Zod compartilhado entre domínios (ex.: errorResponseSchema)
├── openapi/
│   ├── registry.ts           # registry único do @asteasolutions/zod-to-openapi
│   ├── zod-extend.ts         # habilita .openapi() nos schemas Zod (side-effect, importar 1x)
│   └── swagger-ui-page.ts    # HTML do Swagger UI (usado por app/api/docs/route.ts)
└── <dominio>/                 # ex.: auth, properties, crm, contracts, financial
    ├── domain/                # entidades + erros de negócio — zero import de Prisma/Next/Zod
    ├── application/
    │   ├── ports/             # interfaces (contratos) — ex.: UserRepository, PasswordHasher
    │   └── use-cases/         # regra de negócio, depende só de ports/
    ├── infrastructure/        # implementações concretas dos ports (Prisma, bcrypt, jose...)
    ├── schemas/                # Zod — valida request E gera a doc OpenAPI (.openapi() + registry)
    ├── types/                  # contratos HTTP, DTOs e entradas/saídas de use-cases
    └── container.ts            # composition root — único lugar que instancia infra e monta use-cases
```

## Convenções (resumo — detalhe e racional em ADR-0002)

- Route Handler fino: parseia com Zod (`parseJsonBody`, `parseQuery` e `parseRouteParams`), chama
  `container.<x>UseCase.execute(...)` e traduz o resultado em `NextResponse`. Nenhuma regra de negócio nem `prisma.*` direto num `route.ts`.
- `application/` nunca importa `infrastructure/` nem `@prisma/client` — só os `ports/` do próprio domínio.
  Isso é a injeção/inversão de dependência do projeto: manual, via construtor, sem framework de DI.
- Toda query/mutação que toca uma tabela com `tenantId` **deve** filtrar por tenant explicitamente — ver
  Princípio II da constituição. A descoberta de contas no login pode consultar o e-mail em mais de um
  tenant; a sessão só é emitida depois de resolver a conta e validar seu contexto de tenant.
- Todo use-case novo entra com teste unitário (ports mockados, sem banco). Todo endpoint novo entra com
  teste de integração (banco real via Docker Compose) e, quando fizer sentido, um teste E2E em
  `cypress/e2e/`.
- O schema Prisma (`apps/web/prisma/schema.prisma`) é a fonte de verdade do modelo de dados; os
  `data-model.md` de cada spec descrevem as entidades em nível conceitual e devem ser lidos junto com ele.
- Sem comentários no código: nomes autoexplicativos + testes; contexto e racional vão em ADRs e no
  `tasks.md` da spec, não em comentários inline.
- Endpoint protegido: extrai e valida o access token (Bearer) com `requireBearerAuth` antes de qualquer
  outra coisa no handler; regra de autorização (quem pode fazer o quê) mora no use-case, não no Route
  Handler nem num middleware genérico — ver `CreateUserUseCase` (só `OWNER` cria usuário, sempre no
  próprio tenant do ator). O token service exposto pelo container valida o estado atual do usuário e tenant além da assinatura do JWT.

Módulos implementados até agora: `auth` (login, refresh token, perfil próprio e gestão dos usuários do
tenant), `platform` (identidade separada do dono/sócio da Ketris, sem tenant — ver seção
própria abaixo), `marketplace` (vitrine pública, sem autenticação — ver seção própria abaixo) e
`properties` (CRUD de imóveis do tenant, publicação/despublicação e transição de status por contrato ativo).
Os demais (`crm`, `contracts`, `financial`) seguem incrementalmente junto das tarefas de
`specs/001-mvp-loop-imovel-pagamento/tasks.md` e `specs/002-fundacao-bff-banco/tasks.md`.

## Rate limit

`src/proxy.ts` aplica rate limit em todas as rotas `/api/**` antes dos Route Handlers. Os endpoints
sensíveis de autenticação e cadastro usam uma política mais restrita que a API geral, conforme a seleção centralizada em `src/proxy.ts`. Defaults:

- `API_RATE_LIMIT_MAX=300` em `API_RATE_LIMIT_WINDOW_MS=60000`.
- `AUTH_RATE_LIMIT_MAX=10` em `AUTH_RATE_LIMIT_WINDOW_MS=900000`.

Respostas bloqueadas retornam 429 (`RATE_LIMIT_EXCEEDED`) com headers `RateLimit-Limit`,
`RateLimit-Remaining`, `RateLimit-Reset` e `Retry-After`. Os contadores de Auth ficam no PostgreSQL e são compartilhados entre instâncias, com incremento
atômico e limpeza limitada de janelas expiradas. Na Vercel, a identidade usa apenas o cabeçalho de IP
controlado pela plataforma; fora dela, ignora cabeçalhos forjáveis e usa o agrupamento local. Uma falha
do contador de Auth retorna 503 sem liberar a tentativa. A política geral da API mantém armazenamento
em memória; sua substituição foi reservada para uma [branch de infraestrutura](../../../../docs/technical-debt/api-distributed-rate-limit.md)
por decisão do produto na revisão de Agenda (T23). Nenhum serviço Redis/Upstash é necessário.

## Autenticação: access token + refresh token

Quando a autenticação é concluída, `POST /auth/login` retorna um access token (JWT, 1h, `jose`) e um refresh token (opaco, alta entropia,
30 dias, só o hash SHA-256 fica no banco — model `RefreshToken`). `POST /auth/refresh` troca um refresh
token válido por um par novo (access + refresh), revogando o antigo (rotação — reuso de um token já
revogado é tratado como inválido). Detalhe completo e racional das decisões em ADR-0002, seção "Nota:
refresh token".

## Recuperação de senha e contas por tenant

- `POST /auth/password-reset-codes` recebe e-mail e locale, envia uma prova para a caixa de e-mail e
  retorna 204 também quando a conta não existe ou o intervalo de reenvio ainda não terminou.
- `POST /auth/password-reset-codes/verify` valida o código antes de mostrar qualquer conta. Quando há
  mais de um tenant e nenhum foi escolhido, retorna `SELECT_TENANT` sem consumir a prova. Reenviar o
  mesmo e-mail/código com `tenantId` emite o `resetToken` para a conta escolhida.
- `POST /auth/reset-password` exige a prova emitida para aquela conta e valida seu e-mail, tenant quando
  informado e versão da sessão. A atualização de senha e a revogação dos refresh tokens ocorrem na
  mesma transação; a versão da sessão é incrementada para invalidar os access tokens e a prova anterior.
- A unicidade do e-mail é por tenant. O reset token identifica o usuário escolhido; e-mail sozinho não
  identifica qual conta deve ter a senha alterada.

## Usuários: perfil próprio e gestão do tenant

`POST/GET /auth/users` e `GET/PATCH/DELETE /auth/users/{id}` usam a identidade autenticada como
origem do contexto de tenant. Os papéis atuais são `OWNER`, `AGENT`, `PROPERTY_OWNER` e `RENTER`;
`ADMIN` não é um papel de usuário de tenant.

- Criar, listar, desativar e aprovar usuários exige papel `OWNER`, conforme a política de gestão em
  `auth/domain/roles.ts`.
- `GET /auth/users/{id}` permite consultar o próprio perfil; consultar outros usuários exige gestão.
- `PATCH /auth/users/{id}` permite editar o próprio perfil. A gestão pode editar outros usuários do
  tenant; o próprio usuário não pode trocar seu papel. O avatar só pode ser alterado pelo próprio usuário.
- Criação e alteração de papel aceitam `OWNER`, `AGENT` e `PROPERTY_OWNER`; `RENTER` tem fluxo de
  cadastro separado. Consultas de usuário sempre verificam se o alvo pertence ao tenant do ator.
- `PATCH /auth/users/{id}/approve` aprova um vínculo pendente. Repetir a aprovação retorna o usuário
  existente sem erro.
- `DELETE` desativa a conta (`Usuario.ativo = false`) e revoga seus refresh tokens. A gestão não pode
  desativar a própria conta por esta rota.
- As antigas rotas `/auth/admins` não existem. A identidade da operação Ketris pertence exclusivamente
  ao módulo `platform`; seu token não é aceito como identidade de tenant.
- Os schemas em `auth/schemas/` validam os dados HTTP e geram o OpenAPI. Tipos de DTO e contextos de rota
  ficam em `auth/types/`; a conversão da entidade para a resposta HTTP fica em
  `auth/application/user-response.ts`.

## Platform admin: identidade separada da gestão do tenant

`src/server/platform/` é um módulo irmão de `auth`, não uma extensão dele: `PlatformAdmin` não tem
`tenantId` e nunca é confundido com o gestor de um tenant (`Usuario.papel === 'OWNER'`). Racional
completo em `docs/adr/0003-platform-admin-identidade-separada.md` e `specs/003-platform-admin/`. Resumo:

- O primeiro platform admin é criado por `apps/web/prisma/seed.ts` (`npm run db:seed`), não por uma rota
  HTTP — ver ADR-0003, seção Atualização, para o racional (instância única operada pelo próprio time, sem
  necessidade de um endpoint público de "dia zero").
- `POST/GET /api/platform/admins` e `GET/PATCH/DELETE /api/platform/admins/{id}`: CRUD completo, sempre
  exigindo `requirePlatformBearerAuth` (ator já autenticado como platform admin) — é assim que o dono cria o
  acesso do sócio, depois do seed do primeiro.
- `GET/POST /api/platform/tenants`, `GET /api/platform/tenants/{id}/users` e
  `POST /api/platform/tenants/{id}/admins`: visão e controle cross-tenant — listar/criar tenants, listar
  todos os usuários de um tenant e criar seu gestor (`OWNER`), substituindo qualquer mecanismo anônimo
  de bootstrap por tenant.
- Token do platform admin assinado com `PLATFORM_TOKEN_SECRET` (não `AUTH_TOKEN_SECRET`) e payload sem
  `tenantId`/`papel` (`{ sub, scope: 'platform' }`) — separação estrutural, não só de convenção, entre as
  duas identidades.
- As rotas de criação de admin deste módulo (criar platform admin, criar admin de tenant) nunca são
  registradas em `src/server/openapi/registry.ts` — ver o contrato próprio de Platform.
- Sessão NextAuth: segundo `CredentialsProvider` (`id: 'platform-credentials'`), mesma estratégia JWT, com
  `session.scope` (`'tenant' | 'platform'`) como discriminador — `shared/lib/auth/require-platform-session.ts`
  e `shared/lib/auth/require-admin-session.ts` rejeitam a sessão uma da outra, mesmo com o mesmo mecanismo de
  sessão por baixo.

## Marketplace: vitrine pública (sem autenticação)

`src/server/marketplace/` expõe a vitrine pública da Ketris — todas as rotas são **públicas, sem
`requireBearerAuth`**, porque um visitante não precisa (nem deveria precisar) de conta para buscar imóveis
ou enviar uma proposta de interesse. Cobre a User Story 2 da spec
`001-mvp-loop-imovel-pagamento`. Resumo:

- `GET /api/marketplace/properties`: busca/listagem — retorna **apenas imóveis com `status = PUBLISHED`**,
  de **todos os tenants** (é a vitrine pública, não a área de um tenant). Isso é uma **exceção deliberada e
  documentada** ao isolamento por tenant do Princípio II: a query não filtra por `tenantId` de propósito.
  Aceita filtros opcionais (`finalidade`, `tipo`, `cidade`, `precoMin`, `precoMax`, `quartosMin`, `q` de
  busca textual em título/descrição). O `tenantId` do imóvel nunca é exposto no corpo da resposta.
- `GET /api/marketplace/properties/{id}`: detalhe de um imóvel — 200 só quando `PUBLISHED`; imóvel
  inexistente ou em rascunho responde 404 (`PROPERTY_NOT_FOUND`), sem revelar a existência de rascunhos.
- `POST /api/marketplace/properties/{id}/inquiries`: envio de proposta de interesse — **público** — cria uma
  `Oportunidade` (lead) no CRM **do tenant dono do imóvel** (o `tenantId` vem do imóvel, nunca do corpo),
  com `status = ENVIADA`, vinculada ao imóvel e aos dados de contato do interessado. Quando `valorProposto`
  é omitido, assume o valor anunciado do imóvel. Imóvel não publicado responde 404 e nada é criado. Retorna
  só um resumo (`id`/`imovelId`/`status`/`createdAt`) — nunca expõe os campos internos de CRM ao visitante.
- Rotas de imóvel/detalhe/criação de proposta são registradas no OpenAPI (leitura pública + criação de lead,
  não escalonamento de privilégio).

### CRUD de propostas (`Oportunidade`) — autenticado, tenant-scoped

A **criação** de proposta é pública (acima); o resto do ciclo de vida do lead é **protegido por
`requireBearerAuth`** e sempre restrito ao tenant do ator (uma proposta de outro tenant responde 404 opaco,
igual a id inexistente). Qualquer usuário autenticado do tenant gerencia os leads do
próprio tenant:

- `GET /api/marketplace/inquiries`: lista as propostas do tenant. Por padrão exclui as arquivadas; filtros
  opcionais `status` e `includeArchived=true`. 200 / 400 / 401.
- `GET /api/marketplace/inquiries/{id}`: consulta uma proposta do tenant. 200 / 401 / 404.
- `PUT /api/marketplace/inquiries/{id}`: substituição completa (campos-núcleo obrigatórios; opcionais
  omitidos voltam ao padrão). 200 / 400 / 401 / 404.
- `PATCH /api/marketplace/inquiries/{id}`: atualização parcial (ao menos um campo). 200 / 400 / 401 / 404.
- `DELETE /api/marketplace/inquiries/{id}`: **soft delete** por padrão (marca `arquivadaEm`, retorna a
  proposta arquivada, 200) e **exclusão permanente** com `?permanent=true` (remove a linha, 204). 401 / 404
  nos demais casos.

- O módulo é auto-contido: define ports próprios (`PublicPropertyRepository`, `InquiryRepository`) e lê
  `Imovel`/cria e gerencia `Oportunidade` via Prisma diretamente, sem depender ainda dos módulos
  `properties`/`crm` completos (que virão em tarefas próprias). O soft delete usa a coluna
  `Oportunidade.arquivadaEm` (migration `20260812130000_add_oportunidade_arquivada_em`).

## Documentação (Swagger/OpenAPI)

`GET /api/docs` serve o Swagger UI (self-hosted, assets de `swagger-ui-dist` via
`/api/docs/assets/[...path]`, sem CDN). `GET /api/docs/openapi.json` serve o documento gerado a partir do
`registry` — cada domínio registra seus paths em `src/server/<dominio>/openapi.ts`, chamado explicitamente
por `src/server/openapi/registry.ts` (recebe o `registry` por parâmetro, não como singleton importado, pra
evitar import circular).

## Limites de entrada e documentação

Auth mantém mensagens técnicas e Swagger em português por decisão do produto. A interface traduz
os códigos de erro para pt-BR, en-US e es-ES. Nome aceita até 200 caracteres; telefone e CRECI, 32;
e-mail, 254. Senhas novas, trocadas ou redefinidas aceitam no máximo 72 bytes UTF-8, sem truncamento.
O login e a conferência da senha atual preservam o comportamento de senhas legadas.

`GET /auth/users` recebe `page` (a partir de 1), `pageSize` (1–100, padrão 25) e `pendingApproval`
(`true`/`false`, opcional). Responde `users`, `total`, `page` e `pageSize`; filtro e contagem sempre
consideram somente o tenant autenticado. A tela de solicitações usa o filtro de pendentes no servidor
e carrega as páginas em sequência para preservar a lista completa sem alterar seu funcionamento.

Se a revalidação da sessão falhar por indisponibilidade de infraestrutura, o cookie mantém a identidade
privada para nova tentativa. A sessão exposta ao cliente sinaliza `authUnavailable`, sem tokens, papel,
contexto de tenant ou escopo utilizáveis. Os limites de acesso e a tela bloqueiam operações até revalidar.
Usuário revogado/inativo, claims inválidas e tenant bloqueado continuam sendo falhas de autenticação,
e não indisponibilidade transitória.

Mudanças de senha, e-mail ou papel e desativação invalidam sessões por versão e revogam refresh tokens na mesma transação. As mutações de gestão mantêm o tenant do ator no predicado de escrita.

O conteúdo e as versões dos termos de cadastro permanecem como [débito técnico aprovado pelo produto](../../../../docs/technical-debt/auth-terms-and-privacy.md).

## Histórico de alterações de usuários

A tabela `auth_user_audit_events` registra criação, edição, aprovação e inativação no mesmo commit
que a alteração de usuário. Os atores distinguem usuário de tenant, administrador da plataforma,
autocadastro e sistema (incluindo o seed). A autoria vem do contexto autenticado ou da origem
comprovada da operação, nunca do corpo HTTP. Não há backfill de autores desconhecidos.

O histórico armazena somente ação, autor, conta/tenant, data e nomes dos campos escritos; não guarda
valores de senhas, hashes ou tokens. Confirmação de e-mail e redefinição de senha também registram
suas escritas dentro da transação. Não existe endpoint para alterar eventos. As relações seguem o
ciclo de vida já adotado: inativar preserva usuários e histórico; exclusão física do tenant mantém o
comportamento de cascata existente, e referências a autores fisicamente removidos ficam nulas.

## Agenda

Agenda mantém seis operações de eventos (`GET/POST /agenda/events`, `GET/PATCH /agenda/events/{id}`,
`POST /agenda/events/{id}/reschedule` e `POST /agenda/events/{id}/cancel`) e o catálogo
`GET /agenda/properties`. Schemas e OpenAPI descrevem os contratos; os mapeadores ficam em
`agenda/application/`, e os tipos auxiliares em `agenda/types/`.

O catálogo recebe busca, página e tamanho de página (padrão 25, máximo 100). Retorna somente ID e
rótulo dos imóveis autorizados: tenant para gestores, responsável para corretores, proprietário para
proprietários e contratos ativos para locatários. A listagem de eventos inclui os rótulos autorizados,
sem exigir que o calendário carregue o cadastro completo de imóveis. O formulário consulta o catálogo
sob demanda. Locatários escolhem somente imóveis de seus contratos ativos.

A resposta completa inclui nome e papel reais do criador. A visão reduzida do locatário preserva a
omissão dos contatos, notas privadas e dados do criador. Ao resolver vínculos por e-mail, a conta
elegível do tenant do evento tem prioridade; fora dele, somente um locatário elegível único pode ser
vinculado. Ambiguidades são recusadas.

Novos cancelamentos exigem motivo, inclusive quando solicitados por edição de status. Autor e data
são obtidos no servidor. `agenda_event_audit` registra criação, edição, reagendamento e cancelamento
na mesma transação da alteração, com autor e nomes dos campos alterados. Os cancelamentos e eventos
antigos não recebem autoria ou motivos inventados. Reservas de horário usam bloqueio transacional
por tenant/responsável e conferência de sobreposição antes da escrita.

A migration `20261025010000_agenda_history_and_shared_team` renomeia `LEGACY_TEAM` para
`SHARED_TEAM`, preservando a visibilidade compartilhada anterior. Também impede excluir fisicamente
um responsável com eventos vinculados (`NO ACTION`); a inativação continua disponível e a exclusão
completa do tenant mantém o ciclo de vida em cascata. Referências a autores fisicamente removidos
ficam nulas.

## Validação de Auth, Agenda e Contracts em navegador

O job `auth-e2e` do CI aplica migrations em PostgreSQL efêmero, produz o build e executa
`cypress/e2e/auth/**/*.cy.ts`, `cypress/e2e/agenda/**/*.cy.ts` e `cypress/e2e/contracts/**/*.cy.ts`. O identificador do job permanece estável.
As fixtures de Agenda exigem banco local e `KETRIS_E2E_ISOLATED_DB=1`; criam e removem somente seus
tenants de teste. As mensagens são recebidas por um simulador SES local na porta 3101, com
credenciais fictícias; nenhuma credencial AWS de staging é usada. O simulador está disponível somente
no processo de testes quando `AUTH_E2E_MAILBOX_PORT` estiver configurado. A aplicação usa o endpoint
local através de `AWS_ENDPOINT_URL_SES`. Sem esse simulador, os cenários que precisariam de envio
real ficam desabilitados no Cypress local; o CI o habilita explicitamente.

O servidor Next de teste, `baseUrl` e `NEXTAUTH_URL` usam `localhost` de forma consistente. Com
Next 16.3.1, iniciar com `--hostname 127.0.0.1` faz a origem interna divergir da reescrita de idioma
normalizada para `localhost`, causando um ciclo de redirecionamentos nas páginas localizadas.

O limite de Auth é ampliado somente no ambiente E2E para os cenários não disputarem a mesma cota
por IP; o limite padrão e seus testes concorrentes permanecem os mesmos. Os controles
`KETRIS_BUILD_WORKERS=1` e `KETRIS_BUILD_LOW_MEMORY=1` permitem reduzir a concorrência e a memória
do build de validação, sem mudar os padrões de builds que não definem essas opções. Source maps não
são gerados nesse modo quando não há credencial de upload Sentry. Os processos de validação local
devem ser executados em sequência.

## Contracts

Os contratos podem ser editados antes da primeira assinatura, mantendo proposta de origem e imóvel fixos. A edição efetiva invalida o PDF anterior para novos registros de assinatura; o arquivo continua no histórico. Trocar o e-mail do locatário remove o vínculo de acesso até nova confirmação explícita da gestão.

O registro temporário de assinatura é manual e exige PDF comprobatório da revisão atual, com autoria e evidências técnicas. Cancelamento antes da ativação e encerramento de contrato ativo exigem motivo, usam o instante do servidor e preservam o financeiro. O histórico é gravado na mesma transação das alterações.

Listagem, busca, paginação, ordenação e indicadores usam todo o conjunto autorizado. O indicador considera 30 dias e a aba Vencendo, 90. Dados de seleção e resumo de imóvel vêm dos endpoints próprios de Contracts. O cache inclui tenant, usuário e papel; mutações invalidam os dados relacionados.

Consulte [operação de Contracts](../../../../docs/contracts-operations.md) para chave de criptografia, migrations/backfill, upload privado, CORS, recuperação e débitos aprovados. As fixtures de PDFs usam simulador local na porta 3102 quando CONTRACTS_E2E_STORAGE_PORT está configurada, com AWS_ENDPOINT_URL_S3 local e bucket fictício. Exigem banco isolado; nenhum teste usa S3 real.
