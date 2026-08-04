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
│   ├── http/                 # parseJsonBody (Zod) + handleRouteError — usados por todo Route Handler
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
    └── container.ts            # composition root — único lugar que instancia infra e monta use-cases
```

## Convenções (resumo — detalhe e racional em ADR-0002)

- Route Handler fino: parseia com Zod (`parseJsonBody`), chama `container.<x>UseCase.execute(...)`, traduz
  o resultado em `NextResponse`. Nenhuma regra de negócio nem `prisma.*` direto num `route.ts`.
- `application/` nunca importa `infrastructure/` nem `@prisma/client` — só os `ports/` do próprio domínio.
  Isso é a injeção/inversão de dependência do projeto: manual, via construtor, sem framework de DI.
- Toda query/mutação que toca uma tabela com `tenantId` **deve** filtrar por tenant explicitamente — ver
  Princípio II da constituição. (Exceção documentada: login por e-mail ainda não filtra tenant — ver nota
  em ADR-0002.)
- Todo use-case novo entra com teste unitário (ports mockados, sem banco). Todo endpoint novo entra com
  teste de integração (banco real via Docker Compose) e, quando fizer sentido, um teste E2E em
  `cypress/e2e/`.
- O schema Prisma (`apps/web/prisma/schema.prisma`) é a fonte de verdade do modelo de dados; os
  `data-model.md` de cada spec descrevem as entidades em nível conceitual e devem ser lidos junto com ele.
- Sem comentários no código: nomes autoexplicativos + testes; contexto e racional vão em ADRs e no
  `tasks.md` da spec, não em comentários inline.
- Endpoint protegido: extrai e valida o access token (Bearer) com `requireBearerAuth` antes de qualquer
  outra coisa no handler; regra de autorização (quem pode fazer o quê) mora no use-case, não no Route
  Handler nem num middleware genérico — ver `CreateUserUseCase` (só `ADMIN` cria usuário, sempre no
  próprio tenant do ator). Guard de sessão genérico e reutilizável por outros domínios ainda é T015
  (`specs/002-fundacao-bff-banco/tasks.md`), pendente.

Módulos implementados até agora: `auth` (login, refresh token, criação de usuário). Os demais
(`properties`, `crm`, `contracts`, `financial`) seguem incrementalmente junto das tarefas de
`specs/002-fundacao-bff-banco/tasks.md`.

## Autenticação: access token + refresh token

`POST /auth/login` retorna um access token (JWT, 1h, `jose`) e um refresh token (opaco, alta entropia,
30 dias, só o hash SHA-256 fica no banco — model `RefreshToken`). `POST /auth/refresh` troca um refresh
token válido por um par novo (access + refresh), revogando o antigo (rotação — reuso de um token já
revogado é tratado como inválido). Detalhe completo e racional das decisões em ADR-0002, seção "Nota:
refresh token".

## Documentação (Swagger/OpenAPI)

`GET /api/docs` serve o Swagger UI (self-hosted, assets de `swagger-ui-dist` via
`/api/docs/assets/[...path]`, sem CDN). `GET /api/docs/openapi.json` serve o documento gerado a partir do
`registry` — cada domínio registra seus paths em `src/server/<dominio>/openapi.ts`, chamado explicitamente
por `src/server/openapi/registry.ts` (recebe o `registry` por parâmetro, não como singleton importado, pra
evitar import circular).
