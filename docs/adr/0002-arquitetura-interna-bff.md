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
HTML estática que carrega o Swagger UI via CDN (`swagger-ui-dist`) apontando para esse JSON — sem instalar
`swagger-ui-react` (evita ~2MB de bundle numa rota que só o time usa em dev).

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
