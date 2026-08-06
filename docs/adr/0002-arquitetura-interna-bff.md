# ADR-0002: Arquitetura interna do BFF (Clean Architecture, DI manual, Zod, OpenAPI)

**Status:** Accepted
**Date:** 2026-08-03
**Deciders:** Alysson (produto/tech)

## Context

ADR-0001 decidiu **onde** o BFF roda (Route Handlers do Next.js, dentro de `apps/web`) e a base de dados
(PostgreSQL + Prisma). Esta ADR decide **como o código dentro de `src/server/` é organizado** — a
convenção que todo domínio novo (`auth`, depois `properties`, `crm`, `contracts`, `financial`) deve seguir,
para que múltiplos desenvolvedores (incluindo juniors) produzam código consistente sem precisar
reinventar a estrutura a cada módulo.

Motivadores explícitos: usar Zod para validação, documentar a API via OpenAPI/Swagger, aplicar injeção e
inversão de dependência, e seguir SOLID/Clean Architecture — sem framework de DI (Next.js não tem um
container como o Nest), o que exige uma convenção manual explícita para não virar "código espaguete com
Prisma importado direto em toda parte".

## Decision

Cada domínio em `src/server/<dominio>/` segue 4 camadas + 1 arquivo de composição:

```text
src/server/<dominio>/
├── domain/            # entidades e erros de negócio — zero import de Prisma/Next/Zod aqui
│   ├── <entidade>.entity.ts
│   └── errors.ts
├── application/        # regras de negócio (use-cases), depende só de PORTS (interfaces)
│   ├── ports/
│   │   └── *.port.ts   # interfaces — ex.: UserRepository, PasswordHasher, TokenService
│   └── use-cases/
│       └── *.use-case.ts
├── infrastructure/     # implementações concretas dos ports (Prisma, bcrypt, jose...)
│   └── *.ts
├── schemas/             # Zod — validação de entrada E fonte da documentação OpenAPI
│   └── *.schema.ts
└── container.ts         # composition root — único lugar que instancia infra e monta os use-cases
```

Os Route Handlers em `src/app/api/**/route.ts` ficam finos: parseiam a request com um schema Zod, chamam
`container.<algo>UseCase.execute(...)`, e traduzem o resultado (ou erro) em `NextResponse`. Nenhuma regra
de negócio nem chamada Prisma direta em um `route.ts`.

### SOLID aplicado

- **SRP**: cada use-case faz uma coisa (`LoginUseCase` só autentica). Route Handler só traduz HTTP ↔
  use-case.
- **OCP**: novos jeitos de autenticar (ex.: SSO depois) entram como novo use-case/port, sem alterar o
  existente.
- **LSP**: qualquer implementação de um port (`PrismaUserRepository` hoje, um cache/decorator depois) é
  substituível sem quebrar o use-case que a consome.
- **ISP**: ports pequenos e focados (`UserRepository.findByEmail`, não uma interface genérica "Repository"
  com 15 métodos que ninguém usa inteiro).
- **DIP**: `application/` depende só de `ports/` (abstrações). `infrastructure/` implementa essas
  abstrações. O `container.ts` é o único lugar que conhece as duas pontas e as conecta — é a nossa
  "injeção de dependência", só que manual (construtor recebendo as dependências), sem framework de DI.

### Zod como fonte única — validação e documentação

Cada schema Zod em `schemas/` serve dois propósitos: (1) validar o body da request no Route Handler, e (2)
gerar o OpenAPI via `@asteasolutions/zod-to-openapi` (`.openapi()` no schema + registro em
`src/server/openapi/registry.ts`). Isso evita o problema clássico de doc desatualizada — a doc é derivada
do mesmo schema que valida em runtime, não escrita à mão em paralelo.

### OpenAPI/Swagger sem dependência pesada

`GET /api/docs/openapi.json` serve o spec gerado a partir do registry. `GET /api/docs` serve uma página
HTML estática que carrega o Swagger UI self-hosted (assets de `swagger-ui-dist` via
`/api/docs/assets/[...path]`, sem CDN) apontando para esse JSON — sem instalar `swagger-ui-react` (evita
~2MB de bundle numa rota que só o time usa em dev).

### Erros e HTTP

`domain/errors.ts` de cada módulo define erros de negócio (ex.: `InvalidCredentialsError`). Um helper
compartilhado em `src/server/shared/http/` (`parseJsonBody` + `handleRouteError`) padroniza: erro de
validação Zod → 400 com detalhe por campo; erro de domínio conhecido → status mapeado (401, 404, 409...);
erro não mapeado → 500 genérico (nunca vaza stack trace pro cliente).

## Options Considered

### Option A: camadas manuais + DI manual via composition root (escolhida)

**Pros:** zero dependência de framework de DI; funciona igual dentro de Route Handlers (que não têm ciclo
de vida de "app" como o Nest); testável (use-case recebe mocks dos ports direto no construtor); mesma ideia
que já funciona bem em linguagens/frameworks diferentes (é o "Ports & Adapters"/Hexagonal clássico).
**Cons:** mais arquivos por feature do que um CRUD direto; exige disciplina do time pra não "furar" a
camada (importar Prisma direto num Route Handler por atalho).

### Option B: framework de DI em runtime (`tsyringe`, `inversify`)

**Pros:** decorators, resolução automática por container.
**Cons:** dependência extra, decorators exigem `experimentalDecorators` no `tsconfig` (fricção com o
restante do projeto, que não usa decorators em lugar nenhum), overhead de aprendizado sem ganho real no
tamanho atual do time — descartada por ora. Se o número de dependências por use-case crescer muito, é uma
opção pra reavaliar.

### Option C: services simples estendendo uma base, sem separar domain/application/infrastructure

**Pros:** menos arquivos, mais rápido de escrever no começo.
**Cons:** é basicamente o que já existia (`PropertiesService extends BaseService`) — funciona bem pro
client-side (services HTTP puros), mas no backend mistura regra de negócio com acesso a dados na mesma
classe, dificultando teste unitário sem banco e violando SRP/DIP conforme a lógica cresce (ex.: o caso da
ativação de contrato, que tem uma transação com 4 efeitos colaterais). Descartada para `src/server/`
especificamente — mantida como está para os `services/` do frontend, que são uma camada diferente
(HTTP client, não regra de negócio).

## Consequences

- Fica mais fácil: testar regra de negócio sem banco (unit test do use-case com ports mockados); trocar
  implementação de infraestrutura sem tocar a regra (ex.: trocar bcrypt por argon2 só muda
  `infrastructure/`); manter a doc da API sempre sincronizada com a validação real.
- Fica mais difícil: é mais verboso que um CRUD direto — para operações realmente triviais (ex.: um GET de
  listagem sem regra de negócio nenhuma), o time pode pular o use-case e o Route Handler chamar a
  infraestrutura direto, desde que ainda passe pelo `container.ts` (documentar isso quando aparecer o
  primeiro caso real, não especular agora).
- A revisitar: se `container.ts` de um domínio crescer demais (muitos use-cases, muitas dependências), gera
  o gatilho pra reconsiderar a Option B (DI runtime).

## Nota: resolução de tenant no login (simplificação assumida)

O schema Prisma tem `@@unique([tenantId, email])` — ou seja, e-mail só é único dentro de um tenant. A
resolução completa de tenant por subdomínio (`specs/002-fundacao-bff-banco/tasks.md`, T022) ainda não foi
implementada. Para o login funcionar agora, o `PrismaUserRepository.findByEmail` busca por e-mail
globalmente (`findFirst`, sem filtro de tenant) — assumindo, por ora, que e-mails são únicos na prática
entre os poucos tenants de desenvolvimento. Isso é uma simplificação deliberada, não um esquecimento:
documentada aqui e em `specs/002-fundacao-bff-banco/tasks.md` (T022), sem comentário correspondente no
código (ver convenção de não comentar código nesta seção, abaixo).

## Nota: refresh token (opaco + persistido, com rotação)

`POST /auth/login` retorna, além do access token (JWT, 1h), um refresh token (30 dias). Decisões:

- **Opaco, não JWT**: gerado com `crypto.randomBytes(64)` (`domain/refresh-token.ts`), não carrega payload
  algum. Só o banco sabe a quem pertence — dispensa qualquer lógica de decodificação/verificação de
  assinatura no cliente, que só precisa guardá-lo e devolvê-lo em `POST /auth/refresh`.
- **Nunca armazenado em texto puro**: só o hash SHA-256 (`hashRefreshToken`) vai para a tabela
  `refresh_tokens` (model `RefreshToken`, `prisma/schema.prisma`). Um vazamento do banco não expõe tokens
  utilizáveis diretamente — SHA-256 é suficiente aqui (diferente de senha) porque o valor original já tem
  alta entropia (512 bits), então não há necessidade de um hash lento/salgado como bcrypt.
- **Rotação a cada uso**: `RefreshAccessTokenUseCase` revoga (`revokedAt`) o token recebido e cria um novo
  antes de retornar. Reuso de um token já revogado é tratado como token inválido (401
  `INVALID_REFRESH_TOKEN`) — detecta roubo/replay de um token antigo, ainda que sem uma política de
  "revogar toda a família de tokens" (deixado como próximo passo, não implementado agora).
- **`UserRepository.findById`** foi adicionado ao port especificamente para este fluxo: o
  `RefreshAccessTokenUseCase` só tem o `userId` do registro de `RefreshToken`, precisa carregar o usuário
  completo para assinar um novo access token.
- **NextAuth**: `refreshToken` também é propagado pelo `authorize()`/`jwt`/`session` callbacks
  (`auth-options.ts`, `next-auth.d.ts`), disponível em `session.refreshToken`. **Não implementado ainda**:
  a troca automática do access token perto de expirar (o padrão "silent refresh" do próprio NextAuth,
  checando `token.accessTokenExpires` no callback `jwt`) — hoje o refresh só acontece se algo chamar
  `POST /api/auth/refresh` explicitamente. Próximo passo natural quando o frontend precisar de sessões
  realmente longas sem novo login.

## Nota: CRUD de usuários e separação da criação de ADMIN

O CRUD completo de usuários (`POST/GET /auth/users`, `GET/PATCH/DELETE /auth/users/{id}`) opera
exclusivamente sobre contas com papel `OWNER` ou `AGENT`. Decisões:

- **Enum de papel em inglês**: `PapelUsuario` no Prisma (e o tipo `Papel` em `domain/user.entity.ts`)
  passou de `ADMIN | PROPRIETARIO | CORRETOR` para `ADMIN | OWNER | AGENT` (migration
  `prisma/migrations/20260804160903_/migration.sql`, via `ALTER TYPE ... RENAME VALUE` — preserva os dados
  já persistidos, só relabela). O nome do campo (`papel`) e do tipo (`Papel`) seguem em português, por
  consistência com o restante do domínio (`Usuario`, `Imovel` etc.) — só os valores do enum foram traduzidos,
  a pedido explícito do produto.
- **Criação de usuário não-admin (`NonAdminPapel = 'OWNER' | 'AGENT'`)**: `createUserRequestSchema` usa
  `nonAdminPapelSchema`, que não inclui `'ADMIN'` como valor válido — a rejeição de um `papel: 'ADMIN'`
  nesse endpoint acontece na validação Zod (400), antes mesmo de chegar ao use-case. `CreateUserUseCase`
  também tipa `input.papel: NonAdminPapel`, então nem compila uma chamada que tente passar `'ADMIN'`. Dupla
  garantia (schema + tipo), não apenas checagem em runtime.
- **Criação de ADMIN é uma rota e um use-case totalmente separados**: `CreateAdminUseCase` não recebe
  `papel` como parâmetro — sempre cria com `papel: 'ADMIN'` fixo no código, então não existe um caminho para
  "esquecer" de restringir o valor. A rota `POST /api/auth/admins` nunca é registrada em
  `src/server/auth/openapi.ts`/`registry.ts` — não aparece em `GET /api/docs` nem em
  `GET /api/docs/openapi.json` (coberto por teste, `admins/route.integration.test.ts`). Continua exigindo
  `requireBearerAuth` + ator com papel `ADMIN`, igual às demais rotas protegidas — a ausência de
  documentação pública é uma camada a mais (reduz descoberta acidental por usuários não-admin), não
  substitui a autorização.
- **Contas ADMIN são invisíveis para o CRUD geral**: `ListUsersUseCase` filtra `papel !== 'ADMIN'` antes de
  retornar; `GetUserUseCase`/`UpdateUserUseCase`/`DeactivateUserUseCase` tratam um alvo com `papel === 'ADMIN'`
  exatamente como "não encontrado" (`UserNotFoundError`, 404) — a mesma resposta usada para um id
  inexistente ou de outro tenant, para não vazar a existência de contas admin por enumeração de ids.
- **Delete é soft-delete**: `DELETE /auth/users/{id}` não remove a linha — marca `ativo = false`
  (`Usuario.ativo`, `@default(true)`). Motivo prático: `Imovel.responsavelId` referencia `Usuario` com
  `onDelete: Restrict` — apagar de verdade um usuário com imóveis quebraria a integridade referencial (e
  perderia o histórico de quem criou o quê). Efeitos colaterais da desativação: `LoginUseCase` e
  `RefreshAccessTokenUseCase` passam a tratar `ativo: false` como se o usuário não existisse (mesma
  mensagem/erro genérico de credenciais inválidas), e `DeactivateUserUseCase` revoga
  (`refreshTokenRepository.revokeAllForUser`) todos os refresh tokens ativos do usuário na hora — uma sessão
  já aberta não sobrevive à desativação.
- **Um ADMIN não pode se autodesativar** por esta rota (`CannotDeactivateSelfError`, 400) — evita o caso de
  um admin acidentalmente se trancar para fora do próprio tenant.

## Nota: bootstrap do primeiro administrador de um tenant

`POST /api/auth/admins` (acima) exige um ator já autenticado com papel `ADMIN` — o que resolve a criação
do *segundo* admin em diante, mas deixa o *primeiro* admin de um tenant sem nenhum caminho de aplicação: só
`prisma/seed.ts` conseguia criar essa conta inicial. Isso deixava a inicialização de um tenant novo
inteiramente dependente de rodar o seed manualmente contra o banco, o que não é uma funcionalidade real do
produto. `POST /api/auth/admins/bootstrap` fecha essa lacuna sem reabrir o risco de escalonamento de
privilégio que a separação acima foi desenhada para evitar:

- **Único endpoint do sistema que cria um usuário sem exigir autenticação.** Isso só é seguro porque o
  efeito é estritamente limitado: cria exatamente um `ADMIN`, e só quando o tenant-alvo (`tenantSlug` no
  corpo) ainda não tem nenhum admin.
- **Claim atômico via `Tenant.adminBootstrappedAt` (nullable).** `PrismaBootstrapAdminRepository` roda tudo
  dentro de um único `prisma.$transaction`: busca o tenant pelo slug, tenta um `updateMany` condicional
  (`WHERE id = ? AND adminBootstrappedAt IS NULL`) e só cria o `Usuario` se esse update afetou exatamente
  uma linha. Sob duas requisições concorrentes para o mesmo tenant, o banco garante que só uma delas vence o
  `updateMany` — a perdedora recebe `admin_already_exists` sem nunca chegar a criar um segundo usuário. Essa
  é a razão de não ter sido implementado como "contar quantos ADMIN existem": contagem tem race condition,
  update condicional não.
- **Janela de bootstrap fecha para sempre por tenant.** Uma vez que `adminBootstrappedAt` é preenchido
  (bootstrap bem-sucedido), toda tentativa seguinte para aquele tenant retorna 409
  (`AdminAlreadyExistsError`) — o endpoint não vira uma porta permanente para criar admins sem autenticação,
  só resolve o problema do "primeiro admin".
- **Trade-off de segurança aceito conscientemente**: entre o momento em que um tenant é criado (hoje, só via
  seed ou acesso direto ao banco — não existe self-service de criação de tenant no produto) e o momento em
  que alguém chama o bootstrap, qualquer pessoa que descubra o `slug` do tenant pode reivindicar o papel de
  primeiro admin. Isso é aceitável no estado atual porque a criação de tenant já é uma operação
  controlada/operacional, não pública. Se o produto ganhar self-service de criação de tenant no futuro, essa
  janela precisa ser revisitada (ex.: token de setup de uso único emitido na criação do tenant).
- **Fora do OpenAPI**, mesma lógica de `/api/auth/admins` — não aparece em `GET /api/docs` nem em
  `GET /api/docs/openapi.json` (coberto por teste).
- **Frontend**: tela pública `/backoffice/setup` (`BootstrapAdminForm`), com link discreto a partir de
  `/backoffice/login` ("Tenant sem nenhum administrador?"). Ao concluir, redireciona para `/backoffice/login`
  — o bootstrap não faz login automático, só cria a conta.

## Convenção: sem comentários no código

Nomes de arquivos, classes, funções e variáveis devem ser autoexplicativos; contexto, racional e trade-offs
ficam em ADRs (como este) e no `specs/002.../tasks.md`, não em comentários inline. Nenhum arquivo de código
deste módulo (e dos próximos que seguirem esta convenção) deve ter comentários — nem em português nem em
inglês.

## Action Items

1. [x] Implementar o módulo `auth` (login) seguindo esta convenção
2. [ ] Aplicar a mesma convenção em `properties`, `crm`, `contracts`, `financial` conforme cada um for
   implementado (specs/002 tasks.md)
3. [ ] Implementar resolução de tenant por subdomínio (T022) — remove a simplificação descrita acima
