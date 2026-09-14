# Feature Specification: Fundação do BFF e Banco de Dados

**Feature Branch**: `002-fundacao-bff-banco`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Preparar o desenvolvimento do BFF, escolher o banco de dados e modelar o
banco, para que os módulos do loop mínimo de valor (`specs/001-mvp-loop-imovel-pagamento`) parem de
depender de mocks e passem a persistir dados reais." Decisão de stack registrada em
`docs/adr/0001-bff-banco-orm.md` (ADR-0001): BFF via Route Handlers do Next.js, PostgreSQL, Prisma.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Banco de dados local pronto para desenvolvimento (Priority: P1)

Um desenvolvedor consegue subir um Postgres local (Docker Compose), aplicar as migrations do schema Prisma
e rodar um seed mínimo, ficando com um ambiente de dados completo para desenvolver qualquer módulo.

**Why this priority**: sem banco funcionando, nenhuma outra parte do BFF pode ser implementada ou testada
localmente — é o alicerce de todo o resto.

**Independent Test**: `docker compose up -d`, `npm run db:migrate`, `npm run db:seed` — conferir que as
tabelas existem e o seed criou um tenant e um usuário admin.

**Acceptance Scenarios**:

1. **Given** o repositório clonado e Docker instalado, **When** o dev roda `docker compose up -d` seguido
   de `npm run db:migrate`, **Then** todas as tabelas do schema Prisma são criadas no Postgres local sem
   erro.
2. **Given** as migrations aplicadas, **When** o dev roda `npm run db:seed`, **Then** existe um tenant e um
   usuário admin válidos no banco.
3. **Given** o Prisma Client gerado, **When** qualquer código do servidor importa `prisma` de
   `src/server/db/prisma.ts`, **Then** os tipos de todas as entidades do domínio (Imóvel, Oportunidade,
   Contrato, Cobrança etc.) ficam disponíveis com autocomplete completo.

---

### User Story 2 - Autenticação real via BFF (Priority: P2)

O login do NextAuth (`CredentialsProvider`) passa a validar e-mail/senha direto contra o Postgres via
Prisma, em vez de chamar um serviço externo que não existe mais.

**Why this priority**: hoje `authorize()` em `auth-options.ts` chama `httpClient.post('/auth/login', ...)`
contra um backend inexistente — o login está quebrado até essa etapa ser implementada.

**Independent Test**: com um usuário seedado, fazer login pela tela `/login` e confirmar que a sessão
NextAuth contém `accessToken`/`tenantId` válidos.

**Acceptance Scenarios**:

1. **Given** um usuário existente no banco com senha hasheada, **When** ele faz login com a senha correta,
   **Then** a sessão é criada com sucesso e carrega o `tenantId` do usuário.
2. **Given** uma senha incorreta, **When** o login é tentado, **Then** o sistema recusa e nenhuma sessão é
   criada.
3. **Given** um e-mail inexistente, **When** o login é tentado, **Then** o sistema recusa com a mesma
   mensagem genérica (não revela se o e-mail existe, evitando enumeração de contas).

---

### User Story 3 - Endpoints REST dos domínios do loop mínimo de valor (Priority: P3)

Os quatro domínios do loop mínimo de valor (`specs/001-mvp-loop-imovel-pagamento`) — Imóvel, Oportunidade,
Contrato, Cobrança — ganham Route Handlers REST no BFF, respeitando os contratos que os `Service`s do
frontend (`PropertyService`, `OpportunityService`, `ContractService`, `FinancialService`) já esperam.

**Why this priority**: sem esses endpoints, os módulos de frontend da spec 001 continuam presos a mocks —
esta story é o que efetivamente liga o loop mínimo de valor a dados reais.

**Independent Test**: com o servidor Next.js rodando, chamar cada endpoint via `curl`/Postman e confirmar
CRUD básico e as transições de status descritas em `specs/001-mvp-loop-imovel-pagamento/spec.md`.

**Acceptance Scenarios**:

1. **Given** um usuário autenticado, **When** ele cria um imóvel via `POST /api/properties`, **Then** o
   registro aparece no banco com o `tenantId` da sessão.
2. **Given** uma oportunidade aceita, **When** o contrato é gerado via `POST /api/contracts`, **Then** o
   contrato nasce com as partes e o valor herdados da oportunidade (FR-008 da spec 001).
3. **Given** todas as assinaturas de um contrato concluídas, **When** a última assinatura é registrada,
   **Then** o contrato muda para "ativo", o imóvel muda para "alugado"/"vendido" e a primeira cobrança é
   criada automaticamente (FR-011/FR-012/FR-016 da spec 001) — tudo na mesma transação de banco.

---

### User Story 4 - Gestão administrativa de usuários e criação de administradores (Priority: P2)

Um administrador autenticado gerencia as contas `OWNER`/`AGENT` do próprio tenant (criar, listar, consultar,
editar, desativar) e, por uma via separada e não documentada publicamente, cria outros administradores. Uma
tela própria de sign in/sign up dá acesso a esse fluxo sem depender do Swagger nem de um cliente HTTP manual.

**Why this priority**: sem isso, o único usuário existente em cada tenant é o admin gerado pelo seed — não
há como a plataforma operar com múltiplos proprietários/corretores nem crescer o time administrativo. É
infraestrutura tão essencial quanto o login (User Story 2), por isso compartilha a prioridade P2.

**Independent Test**: logar como o admin do seed, criar um usuário `OWNER`/`AGENT` via
`POST /api/auth/users`, confirmar que ele aparece em `GET /api/auth/users`, editá-lo via `PATCH`,
desativá-lo via `DELETE` e confirmar que o login dele passa a falhar; separadamente, acessar
`/backoffice/login`, autenticar como admin e criar um segundo administrador em
`/backoffice/admins/new`.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado, **When** ele cria um usuário via `POST /api/auth/users`
   informando papel `OWNER` ou `AGENT`, **Then** o usuário é criado no tenant do administrador; **When** o
   corpo da requisição informa papel `ADMIN`, **Then** o sistema rejeita a requisição (400) — este endpoint
   nunca cria administradores.
2. **Given** um usuário `OWNER`/`AGENT` existente, **When** um administrador o desativa via
   `DELETE /api/auth/users/{id}`, **Then** o registro não é removido do banco (`ativo: false`), todos os
   refresh tokens dele são revogados, e uma nova tentativa de login com essa conta é recusada.
3. **Given** uma conta `ADMIN`, **When** qualquer requisição de consulta/edição/desativação do CRUD geral
   (`GET/PATCH/DELETE /api/auth/users/{id}`) referencia o id dessa conta, **Then** o sistema responde como
   se o id não existisse (404) — contas administrativas nunca são expostas por esse CRUD.
4. **Given** um administrador autenticado, **When** ele acessa `/backoffice/admins/new` e cria um
   novo administrador, **Then** a nova conta é criada com papel `ADMIN`; **Given** um usuário `OWNER`/`AGENT`
   autenticado, **When** ele tenta entrar em `/backoffice/login`, **Then** o acesso é negado e a sessão é
   encerrada, mesmo com credenciais corretas.
5. **Given** um visitante sem sessão, **When** ele acessa diretamente `/backoffice/admins/new`,
   **Then** é redirecionado para `/backoffice/login`.

---

### Edge Cases

- O que acontece se duas requisições tentarem registrar a última assinatura de um contrato ao mesmo tempo
  (dupla criação da cobrança inicial)? A criação da primeira cobrança deve ser idempotente por contrato
  (nenhuma cobrança duplicada), garantida por transação de banco, não por lógica no cliente.
- Como o sistema impede que uma query vaze dados de outro tenant por engano? Todo service em
  `src/server/<dominio>/` recebe `tenantId` explicitamente e todo `where` do Prisma inclui esse filtro —
  não existe um "modo sem tenant" no código de acesso a dados.
- O que acontece se `DATABASE_URL` não estiver configurado? O app falha rápido e de forma clara na
  inicialização, em vez de falhar silenciosamente em cada request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST expor um schema de banco de dados versionado (migrations Prisma) cobrindo
  todas as entidades de `specs/001-mvp-loop-imovel-pagamento/data-model.md` (Imóvel, Oportunidade,
  Contrato, Assinatura, Cobrança), além de Tenant e Usuário.
- **FR-002**: O sistema MUST isolar dados por tenant em nível de linha (coluna `tenantId`) em toda tabela
  de domínio, e todo acesso a dados MUST filtrar por tenant explicitamente.
- **FR-003**: O sistema MUST armazenar senhas apenas como hash (nunca texto puro).
- **FR-004**: O sistema MUST validar login (e-mail/senha) direto contra o banco via Prisma, dentro do
  próprio `CredentialsProvider` do NextAuth — sem chamada a um serviço externo.
- **FR-005**: O sistema MUST expor endpoints REST no BFF (Route Handlers) para os quatro domínios do loop
  mínimo de valor, com o mesmo formato de payload que os `Service`s do frontend já implementados esperam.
- **FR-006**: O sistema MUST aplicar a transição automática de status descrita na spec 001 (contrato →
  ativo quando 100% assinado; imóvel → alugado/vendido; cobrança inicial criada) dentro de uma única
  transação de banco (`prisma.$transaction`), nunca como passos separados sem atomicidade.
- **FR-007**: O sistema MUST permitir rodar banco, migrations e seed inteiramente em ambiente local (Docker
  Compose), sem depender de nenhum serviço externo pago para desenvolvimento.
- **FR-008**: O sistema MUST emitir, junto com o access token do login, um refresh token opaco (não-JWT) de
  alta entropia, válido por 30 dias, persistindo apenas o hash SHA-256 dele; MUST rotacionar (revogar o
  antigo, emitir um novo) a cada uso em `POST /auth/refresh`, e MUST tratar o reuso de um refresh token já
  revogado como inválido.
- **FR-009**: O sistema MUST permitir que um usuário com papel `ADMIN` crie, liste, consulte, edite e
  desative usuários `OWNER`/`AGENT` do próprio tenant; o papel atribuído por esses endpoints MUST ser
  restrito a `OWNER`/`AGENT` — nunca `ADMIN`.
- **FR-010**: O sistema MUST expor a criação de administradores (`ADMIN`) por um endpoint e um fluxo de
  autorização totalmente separados da criação de usuários comuns, e esse endpoint MUST NOT ser listado na
  documentação pública da API (Swagger/OpenAPI).
- **FR-011**: Desativar um usuário (`DELETE /api/auth/users/{id}`) MUST ser um soft-delete (o registro nunca
  é removido do banco) e MUST revogar imediatamente todos os refresh tokens ativos desse usuário; um usuário
  desativado MUST ser tratado como credencial/token inválido em qualquer tentativa de login ou refresh.
- **FR-012**: O sistema MUST expor uma tela de sign in e uma tela de sign up (criação de administrador) para
  o fluxo administrativo, ambas inacessíveis a usuários `OWNER`/`AGENT` (a tela de sign up MUST exigir uma
  sessão `ADMIN` já autenticada; a tela de sign in MUST recusar e encerrar a sessão de quem não for `ADMIN`).

### Key Entities

Esta spec não redefine entidades de negócio — `apps/web/prisma/schema.prisma` é a fonte de verdade do
modelo de dados, e `specs/001-mvp-loop-imovel-pagamento/data-model.md` continua sendo a referência
conceitual. Entidades novas introduzidas aqui, necessárias para autenticação e isolamento multi-tenant:

- **Tenant**: organização cliente da plataforma — nome, slug (usado para resolver o tenant por
  domínio/subdomínio), cores de white-label.
- **Usuário**: pessoa autenticada dentro de um tenant (papel: `ADMIN`, `OWNER` ou `AGENT` — nomes em inglês
  desde a revisão de 2026-08-04) — nome, e-mail, hash de senha, `ativo` (soft-delete). Interessados que só
  enviam proposta continuam sem conta, conforme já assumido na spec 001.
- **RefreshToken**: token opaco de renovação de sessão, vinculado a um usuário e tenant, com expiração e
  revogação — ver `data-model.md` para o detalhe de campos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um desenvolvedor novo consegue sair de um clone limpo do repositório para um banco local
  funcional (schema aplicado + seed) em menos de 5 minutos, seguindo apenas `docs/stack.md`.
- **SC-002**: 100% das tabelas de domínio têm `tenantId` e nenhuma query no código do servidor referencia
  uma entidade tenant-scoped sem filtrar por tenant.
- **SC-003**: O login via `/login` funciona de ponta a ponta contra dados reais (sem mocks) após o seed.
- **SC-004**: Os 4 endpoints REST do loop mínimo de valor implementam 100% das transições de status
  descritas nas Acceptance Scenarios da spec 001, verificado por teste automatizado.
- **SC-005**: Nenhuma conta com papel `ADMIN` é retornada, criada ou editada pelo CRUD geral de usuários
  (`/api/auth/users*`), e o endpoint de criação de administrador nunca aparece em
  `GET /api/docs/openapi.json` — ambos verificados por teste automatizado.
- **SC-006**: Um administrador consegue, sem usar Swagger/Postman/curl, entrar em `/backoffice/login` e
  criar um novo administrador em `/backoffice/admins/new` usando só a UI.

## Assumptions

- Hospedagem de produção do Postgres (Neon/Supabase/RDS) fica fora do escopo desta spec — cobre apenas o
  ambiente local (ver ADR-0001, seção "a decidir quando houver deploy real").
- Upload de mídia (fotos de imóvel) para um storage (S3 ou equivalente) é tratado como decisão futura; esta
  spec cobre apenas o campo `url` em `Midia`, assumindo que o arquivo já foi enviado a algum storage por um
  passo anterior (fora do escopo aqui).
- Autorização fina por papel (`PapelUsuario`: ADMIN/OWNER/AGENT) para os quatro domínios do loop mínimo de
  valor (Imóvel, Oportunidade, Contrato, Cobrança) continua fora do escopo desta spec — fica para quando
  esses endpoints forem implementados (User Story 3). A exceção é a gestão de usuários em si (User Story 4):
  ali a autorização por papel (só `ADMIN` gerencia usuários, e nunca outro `ADMIN`) já é parte do
  requisito, não uma decisão de autorização genérica adiada — é inerente a "quem pode criar/editar quem" no
  próprio recurso de usuário.
- Esta spec não substitui nem duplica `specs/001-mvp-loop-imovel-pagamento/` — ela é a contraparte de
  banco/BFF que a spec 001 já previa como `[NEEDS CLARIFICATION: stack de backend]` no seu `plan.md`.
