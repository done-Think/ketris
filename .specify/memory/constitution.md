<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- List of modified principles: N/A (ratificação inicial)
- Added sections: Core Principles (I-V), Stack e Padrões Técnicos, Fluxo de Desenvolvimento, Governance
- Removed sections: none
- Follow-up TODOs: TODO(BACKEND_STACK) — stack de backend ainda não definida (ver docs/stack.md);
  TODO(RATIFICATION_DATE) — data de ratificação original desconhecida, usando a data desta formalização.
-->

# Ketris Constitution

## Core Principles

### I. Arquitetura Modular por Domínio
Todo código de produto vive em `src/modules/<dominio>/{components,hooks,services,stores,schemas,types}`.
Módulos de domínio (properties, auth, marketplace, crm, contracts, financial, maintenance) NÃO importam
diretamente uns dos outros — dependências compartilhadas ficam em `src/shared`. O módulo `properties` é a
referência de padrão para todos os demais. Nenhum módulo novo é criado sem seguir essa estrutura.
Racional: mantém o código navegável e testável à medida que o número de domínios cresce (a plataforma
cobre 7+ domínios de negócio), evitando acoplamento cruzado.

### II. Multi-tenant Desde a Fundação
Toda entidade e toda chamada de API deve carregar o contexto de tenant (`useTenantStore`, header
`X-Tenant-Id`). Nenhuma feature é implementada assumindo um único tenant "global". Modelagem de dados que
não suporte isolamento por tenant é bloqueante e deve ser corrigida antes de merge.
Racional: Ketris é uma plataforma SaaS multi-tenant por definição — retrofit de multi-tenancy depois é
caro e arriscado (ver `docs/planejamento-produto.md`, seção 4).

### III. Qualidade Verificável (NON-NEGOTIABLE)
Todo módulo novo inclui testes unitários/componente (Vitest + Testing Library) desde o commit inicial;
fluxos críticos (login, cadastro de imóvel, proposta, contrato, pagamento) têm cobertura E2E via Cypress.
`npm run lint`, `npm run typecheck` e `npm run test:run` devem passar antes de qualquer merge — nenhuma
exceção "vou arrumar depois". Erros de produção são monitorados via Sentry desde o início.
Racional: a plataforma cresce por módulos incrementais (ver `docs/requisitos.md`); sem esse piso de
qualidade, regressões em um módulo silenciosamente quebram outro.

### IV. Consistência de Design System
Toda UI usa os tokens definidos em `src/shared/theme/tokens.ts` (paleta magenta `#F30274` + grafite
`#212631`, ver `docs/design-system.md`) — cores "chumbadas" no código são proibidas. Componentes MUI são
customizados via `theme.ts`/`buildTheme`, nunca com overrides ad-hoc espalhados pelas telas. White-label
(cores por tenant) é resolvido no servidor e aplicado no SSR para evitar flash de cores erradas.
Racional: a identidade visual é um diferencial de marca explícito e o tema precisa ser trocável por tenant
sem reescrever componentes.

### V. Simplicidade e API First
O frontend consome a API através de uma camada única (`HttpClient` baseado em Axios, `BaseService` por
módulo) — nenhuma chamada HTTP direta espalhada em componentes. Novas dependências só entram no projeto
se resolverem um problema real e já não coberto pela stack definida (`docs/stack.md`); preferir a solução
mais simples e coerente com o posicionamento "infraestrutura tech" quando algo não estiver especificado.
Racional: mantém a base de código extensível para as integrações futuras (pagamento, assinatura digital,
IA) sem exigir retrabalho de acesso a dados.

## Stack e Padrões Técnicos

Frontend: Next.js 14+ (App Router) + TypeScript, Material UI v6, Zustand (estado global), TanStack Query
(estado de servidor), React Hook Form + Zod (formulários/validação), MapLibre GL (mapas), Day.js (datas),
react-imask (máscaras BR), MUI X DataGrid/Charts, react-dropzone (upload sempre via backend, nunca direto
ao S3), Notistack (toasts), NextAuth.js (autenticação client-side). Backend: TODO(BACKEND_STACK) — ainda
não definido, ver `docs/stack.md`. Estilo de código: 2 espaços, sem ponto e vírgula, aspas simples
(ESLint + Prettier + Husky/lint-staged + Commitlint, Conventional Commits). Monorepo com npm workspaces
(`apps/web`); scripts, hooks de git e configuração de lint-staged vivem na raiz do repositório.

## Fluxo de Desenvolvimento

Toda feature nova segue o fluxo Spec Kit: `/speckit-specify` (o quê e por quê) → `/speckit-plan` (stack e
arquitetura da feature) → `/speckit-tasks` (quebra em tarefas) → `/speckit-implement`. Specs e planos vivem
em `specs/<branch>/`. Documentação de produto (inventário de módulos, requisitos, design system) é fonte de
verdade em `docs/` e deve ser consultada antes de escrever uma spec nova — não duplicar decisões já
tomadas lá. Branches de feature partem de `dev`; `main` recebe apenas releases estáveis.

## Governance

Esta constituição tem precedência sobre convenções pessoais ou de ferramentas em qualquer conflito. Toda
mudança de princípio (adição, remoção ou redefinição) exige: (1) registro do racional na própria seção,
(2) atualização do "Sync Impact Report" no topo deste arquivo, (3) incremento de versão semântica —
MAJOR para remoção/redefinição incompatível de princípio, MINOR para princípio novo ou expansão material,
PATCH para redação/clarificação. Revisões de código devem verificar aderência aos Core Principles antes de
aprovar merge; complexidade que viole o Princípio V precisa de justificativa explícita no PR.

**Version**: 1.0.0 | **Ratified**: 2026-07-29 | **Last Amended**: 2026-07-29
