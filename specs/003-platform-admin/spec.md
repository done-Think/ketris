# Feature Specification: Administração da Plataforma (Platform Admin)

**Feature Branch**: `003-platform-admin`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "eu como dono e sócio do ketris preciso conseguir entrar como admin e ter uma
visualização geral do sistema e conseguir controlar tudo. Preciso conseguir criar a conta do meu sócio
também, por isso pedi uma rota de admin que não dependa de outro admin logado — mas a criação em si deve
exigir login (a rota de bootstrap é só pro primeiro admin, quando ainda não existe nenhum). O admin
registrado junto com um tenant é outra coisa: esse sim faz sentido ter tenant relacionado, é o admin de uma
imobiliária convidando um funcionário."

## Contexto

`specs/002-fundacao-bff-banco` implementou um único conceito de "administrador": o `ADMIN` de um tenant
(papel do enum `PapelUsuario`, sempre com `tenantId`). Essa spec cobre um segundo conceito, que não existia
ainda: o **platform admin** — o dono/sócio da Ketris como empresa, que não pertence a nenhum tenant e precisa
enxergar/operar a plataforma inteira (todos os tenants, todos os usuários). São papéis com escopos
mutuamente exclusivos: um `ADMIN` de tenant nunca vê outro tenant; um platform admin nunca é "de" um tenant
específico.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Bootstrap do primeiro platform admin (Priority: P1)

No dia zero, não existe nenhum platform admin no sistema — ninguém pode logar pra criar o primeiro. Uma rota
sem autenticação cria exatamente um platform admin, e só funciona enquanto nenhum existir; a partir do
primeiro criado, essa rota nunca mais funciona, pra sempre.

**Why this priority**: sem isso, o dono da Ketris não tem como entrar no próprio sistema — é o problema mais
básico que esta spec resolve.

**Independent Test**: com o banco vazio de platform admins, chamar a rota de bootstrap uma vez (sucesso) e
uma segunda vez (falha, 409) — sem precisar de nenhuma sessão em nenhuma das duas chamadas.

**Acceptance Scenarios**:

1. **Given** nenhum platform admin existe, **When** a rota de bootstrap é chamada com nome/e-mail/senha,
   **Then** o platform admin é criado, sem exigir nenhum header de autenticação.
2. **Given** um platform admin já existe (bootstrap já usado uma vez, em qualquer momento anterior),
   **When** a rota de bootstrap é chamada de novo, **Then** o sistema recusa (409) e nenhum novo registro é
   criado — essa rota não é reutilizável nunca mais.
3. **Given** duas requisições de bootstrap chegam ao mesmo tempo, **When** ambas tentam criar o primeiro
   platform admin, **Then** no máximo uma cria com sucesso — garantido por um claim atômico no banco, não
   por checagem em duas etapas na aplicação.

---

### User Story 2 - Login e sessão do platform admin (Priority: P1)

Um platform admin autentica numa área própria (`/platform/login`), com sessão e token completamente
separados da sessão de um `ADMIN` de tenant — as duas áreas (`/platform/*` e `/backoffice/*`) rejeitam a
sessão uma da outra.

**Why this priority**: sem login funcional, o bootstrap da User Story 1 não serve pra nada — é a segunda
metade indissociável do mesmo problema.

**Independent Test**: logar em `/platform/login` com um platform admin bootstrapado e confirmar acesso a
`/platform`; confirmar que a mesma sessão não abre `/backoffice/admins/new`, e que uma sessão de `ADMIN` de
tenant não abre `/platform`.

**Acceptance Scenarios**:

1. **Given** um platform admin válido, **When** ele faz login em `/platform/login`, **Then** a sessão criada
   tem um escopo (`platform`) distinto de uma sessão de tenant, sem `tenantId` nenhum.
2. **Given** uma sessão de `ADMIN` de tenant já autenticada, **When** essa sessão tenta acessar `/platform`,
   **Then** o acesso é negado e a sessão é encerrada, mesmo com credenciais originalmente corretas.
3. **Given** uma sessão de platform admin já autenticada, **When** essa sessão tenta acessar
   `/backoffice/admins/new`, **Then** o acesso é negado do mesmo jeito — as duas áreas nunca se misturam.

---

### User Story 3 - Platform admin convida outro platform admin (Priority: P2)

Com o primeiro platform admin já logado, ele cria a conta de outros platform admins (ex.: o sócio) por uma
rota que exige estar autenticado como platform admin — o mesmo padrão de "admin convida admin" já usado
entre admins de um tenant, agora no nível da plataforma.

**Why this priority**: resolve o caso real que motivou a spec — o dono precisa dar acesso ao sócio sem
depender de acesso direto ao banco.

**Independent Test**: logado como platform admin, criar um segundo platform admin via
`/platform/admins/new`; confirmar que ele consegue logar; confirmar que a mesma rota falha (401) sem sessão.

**Acceptance Scenarios**:

1. **Given** um platform admin autenticado, **When** ele cria outro platform admin (nome/e-mail/senha),
   **Then** a nova conta é criada e consegue logar normalmente em `/platform/login`.
2. **Given** nenhuma sessão de platform admin, **When** a mesma rota é chamada, **Then** o sistema recusa
   (401) — diferente da rota de bootstrap (US1), esta exige autenticação sempre.
3. **Given** um platform admin autenticado, **When** ele lista (`GET /api/platform/admins`), consulta ou
   desativa outro platform admin, **Then** as operações funcionam normalmente — CRUD completo, espelhando o
   já existente para usuários de tenant.

---

### User Story 4 - Visão e controle cross-tenant (Priority: P2)

Um platform admin lista todos os tenants da plataforma, cria um tenant novo, e lista todos os usuários
(inclusive contas `ADMIN`, que ficam ocultas do CRUD normal de um tenant) de qualquer tenant específico — a
"visualização geral do sistema" pedida.

**Why this priority**: é o valor central do papel — sem isso, o platform admin só serve pra logar, sem
conseguir de fato enxergar/operar a plataforma.

**Independent Test**: logado como platform admin, criar um tenant novo via `/platform/tenants/new`,
confirmar que ele aparece em `GET /api/platform/tenants`, e listar os usuários desse tenant (vazio, recém
criado).

**Acceptance Scenarios**:

1. **Given** um platform admin autenticado, **When** ele lista tenants (`GET /api/platform/tenants`),
   **Then** recebe todos os tenants da plataforma, não só um.
2. **Given** um platform admin autenticado, **When** ele cria um tenant novo (`POST /api/platform/tenants`,
   nome + slug), **Then** o tenant passa a existir e pode receber um admin próprio.
3. **Given** um tenant existente com usuários, **When** o platform admin lista os usuários desse tenant
   (`GET /api/platform/tenants/{id}/users`), **Then** recebe todos, inclusive contas `ADMIN` — diferente do
   CRUD de um `ADMIN` de tenant (spec 002), que nunca revela contas `ADMIN`.
4. **Given** um tenant sem nenhum admin (recém-criado), **When** o platform admin cria o admin desse tenant
   (`POST /api/platform/tenants/{id}/admins`), **Then** a conta é criada com papel `ADMIN` naquele tenant —
   esta é a via correta para dar a um tenant seu primeiro admin, substituindo qualquer mecanismo anônimo.

---

### Edge Cases

- E se alguém tentar chamar a rota de bootstrap depois que o primeiro platform admin já existe, mas antes de
  qualquer login acontecer (ex.: script automatizado testando o endpoint)? Mesmo resultado do cenário 2 da
  US1 — 409, porque o claim já foi feito, independentemente de alguém ter logado ou não.
- E se o e-mail de um novo platform admin já pertencer a um `Usuario` de algum tenant? Permitido — são
  tabelas e identidades completamente separadas; não há checagem cruzada entre `PlatformAdmin` e `Usuario`
  nesta spec (ver Assumptions).
- E se um platform admin tentar criar um segundo admin para um tenant que já tem um? Permitido — diferente
  do mecanismo anônimo removido, aqui não existe restrição de "só o primeiro"; o platform admin é confiável
  por definição (já está autenticado como tal), então pode adicionar quantos admins quiser a qualquer
  tenant, a qualquer momento.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST tratar platform admin como uma identidade completamente separada de `Usuario`
  — sem `tenantId`, sem relação com nenhum tenant específico.
- **FR-002**: O sistema MUST expor uma rota de bootstrap que cria o primeiro platform admin sem exigir
  autenticação, e que MUST parar de funcionar (409) permanentemente assim que o primeiro for criado — em
  todo o sistema, não por tenant. A checagem MUST ser atômica sob requisições concorrentes.
- **FR-003**: O sistema MUST emitir, no login de platform admin, um access token e um refresh token
  (mesmo padrão de rotação/revogação já usado para `Usuario`) assinados com uma chave própria, distinta da
  usada para tokens de tenant.
- **FR-004**: O sistema MUST expor CRUD completo de platform admin (criar, listar, consultar, editar,
  desativar) exigindo em toda operação um ator já autenticado como platform admin — a única exceção é a
  rota de bootstrap do FR-002.
- **FR-005**: As rotas de criação de admin (bootstrap de platform admin, criação de outro platform admin, e
  criação do admin de um tenant específico) MUST NOT aparecer na documentação pública da API
  (Swagger/OpenAPI) — mesma regra já aplicada à criação de `ADMIN` de tenant na spec 002.
- **FR-006**: O sistema MUST permitir que um platform admin autenticado liste todos os tenants da plataforma
  e crie um tenant novo (nome + slug).
- **FR-007**: O sistema MUST permitir que um platform admin autenticado liste todos os usuários de qualquer
  tenant, incluindo contas `ADMIN` — ao contrário do CRUD de usuário de um `ADMIN` de tenant (spec 002), que
  nunca revela contas `ADMIN`.
- **FR-008**: O sistema MUST permitir que um platform admin autenticado crie o admin (`papel: ADMIN`) de
  qualquer tenant específico, sem restrição de o tenant já ter ou não um admin.
- **FR-009**: A sessão de um platform admin e a sessão de um `ADMIN` de tenant MUST ser mutuamente
  exclusivas — uma área nunca aceita a sessão da outra, mesmo que ambas usem o mesmo mecanismo de sessão
  (NextAuth) por baixo.

### Key Entities

- **PlatformAdmin**: identidade de quem opera a plataforma inteira — nome, e-mail (único globalmente, não
  por tenant), hash de senha, `ativo` (soft-delete, mesmo padrão de `Usuario`). Sem `tenantId`.
- **PlatformAdminRefreshToken**: token opaco de renovação de sessão do platform admin — mesmo desenho de
  `RefreshToken` (spec 002), vinculado a `PlatformAdmin` em vez de `Usuario`.
- **PlatformSettings**: linha única (singleton) usada só para o claim atômico do bootstrap (FR-002) — marca
  se o primeiro platform admin já foi criado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A rota de bootstrap funciona exatamente uma vez em toda a vida do sistema — verificado por
  teste automatizado (segunda chamada sempre 409, mesmo em cenário concorrente).
- **SC-002**: O dono da Ketris consegue, sem tocar em `prisma/seed.ts` nem no banco diretamente, logar em
  `/platform/login` e dar acesso ao sócio via `/platform/admins/new`, usando só a UI.
- **SC-003**: Nenhuma rota de criação de admin (platform ou tenant) aparece em `GET /api/docs/openapi.json`
  — verificado por teste automatizado, mesmo padrão já usado nas rotas equivalentes de tenant.
- **SC-004**: Um platform admin consegue, via UI, criar um tenant novo e criar o admin desse tenant, sem
  depender de nenhum admin desse tenant já existir ou estar logado.
- **SC-005**: Uma sessão de `ADMIN` de tenant nunca acessa `/platform/*`, e uma sessão de platform admin
  nunca acessa `/backoffice/*` — verificado por teste E2E nas duas direções.

## Assumptions

- Não há checagem cruzada de e-mail entre `PlatformAdmin` e `Usuario` — o mesmo e-mail pode, em tese,
  existir como platform admin e como usuário de algum tenant, sem conflito. Se isso vier a ser um problema
  de UX/segurança no futuro, é uma revisão separada.
- Não existe hierarquia entre platform admins — todos têm o mesmo nível de acesso; não há um "super platform
  admin" acima dos demais nesta spec.
- Gestão cross-tenant de outros domínios (imóveis, contratos, cobranças de qualquer tenant) fica fora do
  escopo desta spec — cobre apenas identidade (platform admin) e o mínimo de visão/controle sobre tenants e
  seus usuários (FR-006 a FR-008). Telas de operação profunda sobre dados de um tenant específico ficam para
  uma spec futura.
- `POST /api/platform/tenants` não valida se o `slug` corresponde a um domínio/subdomínio real — só garante
  unicidade, mesmo tratamento que `Tenant.slug` já recebe hoje.
