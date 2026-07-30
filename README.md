# Ketris

A infraestrutura digital do mercado imobiliário — plataforma SaaS multi-tenant que conecta proprietários, corretores, imobiliárias, construtoras e locatários.

Ver `docs/` na raiz deste repositório para o inventário completo do produto, requisitos, design system e stack.

## Stack

**Frontend (`apps/web`):** Next.js 14+ (App Router) · TypeScript · Material UI v6 · Zustand · TanStack Query · React Hook Form + Zod · Axios · NextAuth.js · MapLibre GL · Day.js · react-imask · MUI X DataGrid/Charts · react-dropzone · Notistack · Sentry · Vitest + Testing Library · Cypress.

**Backend:** ainda não definido — ver `docs/stack.md`.

## Estrutura

```
apps/
  web/     → aplicação Next.js (App Router), organizada por módulos em src/modules/
docs/      → documentação do produto (planejamento, requisitos, design system, stack, figma)
```

## Desenvolvimento

```bash
npm install
npm run dev
```

Web: http://localhost:3000

Copie `apps/web/.env.example` para `apps/web/.env.local` antes de rodar.

## Scripts úteis

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
npm run e2e         # Cypress
npm run format      # Prettier
```
