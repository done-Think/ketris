# Ketris

A infraestrutura digital do mercado imobiliário — plataforma SaaS multi-tenant que conecta proprietários, corretores, imobiliárias, construtoras e locatários.

Ver `docs/` na raiz deste repositório para o inventário completo do produto, requisitos, design system e stack.

## Stack

**Frontend (`apps/web`):** Next.js 14+ (App Router) · TypeScript · Material UI v6 · Zustand · TanStack Query · React Hook Form + Zod · Axios · NextAuth.js · MapLibre GL · Day.js · react-imask · MUI X DataGrid/Charts · react-dropzone · Notistack · Sentry · Vitest + Testing Library · Cypress.

**Backend (BFF):** Route Handlers do próprio Next.js (`apps/web/src/app/api`), sem serviço separado — ver
ADR-0001 (`docs/adr/0001-bff-banco-orm.md`) e `docs/stack.md`.

**Banco de dados:** PostgreSQL + Prisma (`apps/web/prisma/schema.prisma` é a fonte de verdade do modelo de
dados).

## Estrutura

```
apps/
  web/     → aplicação Next.js (App Router), organizada por módulos em src/modules/ (client) e
             src/server/ (BFF: services de domínio + client Prisma)
docs/      → documentação do produto (planejamento, requisitos, design system, stack, figma, ADRs)
docker-compose.yml → Postgres local
```

## Desenvolvimento

Copie `apps/web/.env.example` para `apps/web/.env` (**não** `.env.local` — o CLI do Prisma só lê `.env`,
não `.env.local`) e ajuste se necessário.

```bash
npm install
docker compose up -d          # sobe o Postgres local (postgres:16-alpine, porta 55432 no host)
npm run db:migrate            # aplica o schema Prisma no banco
npm run db:seed               # cria um tenant + usuário admin (admin@ketris.dev)
npm run dev
```

Web: http://localhost:3000

Usamos a porta 55432 no host (em vez da 5432 padrão) porque é comum ter outros projetos locais com
Postgres/PgBouncer já ocupando 5432/5433 — 55432 dificilmente colide com algo. Se mesmo assim colidir,
troque o mapeamento em `docker-compose.yml` e ajuste `DATABASE_URL` no `.env` de acordo.

Para parar o banco: `docker compose down` (mantém os dados) ou `docker compose down -v` (apaga tudo).

## Scripts úteis

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
npm run e2e         # Cypress
npm run format      # Prettier

npm run db:migrate  # aplica migrations do Prisma
npm run db:seed     # roda o seed (tenant + usuário admin)
npm run db:studio   # abre o Prisma Studio (inspeção visual do banco)
```
