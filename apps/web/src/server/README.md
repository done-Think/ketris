# `src/server`

Lógica de domínio do lado servidor (BFF), consumida pelos Route Handlers em `src/app/api/**/route.ts`. Ver
ADR-0001 (`docs/adr/0001-bff-banco-orm.md`) para o racional de manter o BFF dentro do próprio Next.js.

## Estrutura

```text
src/server/
├── db/
│   └── prisma.ts         # client singleton do Prisma (ver docs/adr/0001-bff-banco-orm.md)
└── <dominio>/             # ex.: properties, crm, contracts, financial — espelha src/modules/<dominio>
    ├── <dominio>.service.ts   # regras de negócio, sempre recebe tenantId explícito
    └── <dominio>.repository.ts  # (opcional) acesso a dados via Prisma, quando o service crescer muito
```

## Convenções

- Cada domínio de negócio (`properties`, `crm`, `contracts`, `financial`, ...) ganha sua própria pasta
  aqui, espelhando o módulo client-side equivalente em `src/modules/<dominio>` — mesma fronteira do
  Princípio I (Arquitetura Modular por Domínio) da constituição, agora do lado servidor.
- Nenhuma query Prisma é feita direto de dentro de um `route.ts` — sempre passa por um service em
  `src/server/<dominio>/`. Os Route Handlers ficam finos: parsear request, checar sessão/tenant, chamar o
  service, devolver resposta.
- Toda query/mutação que toca uma tabela com `tenantId` **deve** filtrar por tenant explicitamente (nunca
  confiar em um "tenant global") — ver Princípio II da constituição.
- O schema Prisma (`apps/web/prisma/schema.prisma`) é a fonte de verdade do modelo de dados; os
  `data-model.md` de cada spec descrevem as entidades em nível conceitual e devem ser lidos junto com ele.

Esta pasta é criada como parte da fundação do BFF (`specs/002-fundacao-bff-banco/`); os services de cada
domínio são implementados incrementalmente junto com as tarefas de cada spec de feature.
