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
│   ├── errors/               # AppError e subclasses genéricas (ValidationError, NotFoundError...)
│   └── http/                 # parseJsonBody (Zod) + handleRouteError — usados por todo Route Handler
├── openapi/
│   └── registry.ts           # registry único do @asteasolutions/zod-to-openapi
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

Módulos implementados até agora: `auth` (login). Os demais (`properties`, `crm`, `contracts`, `financial`)
seguem incrementalmente junto das tarefas de `specs/002-fundacao-bff-banco/tasks.md`.

## Documentação (Swagger/OpenAPI)

`GET /api/docs` serve o Swagger UI (self-hosted, assets de `swagger-ui-dist` via
`/api/docs/assets/[...path]`, sem CDN). `GET /api/docs/openapi.json` serve o documento gerado a partir do
`registry` — cada domínio registra seus paths em `src/server/<dominio>/openapi.ts`, chamado explicitamente
por `src/server/openapi/registry.ts` (recebe o `registry` por parâmetro, não como singleton importado, pra
evitar import circular).
