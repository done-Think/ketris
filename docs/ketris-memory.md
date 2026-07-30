# Ketris — Memória do Projeto

## Sobre
Documentos relacionados (podem não estar sincronizados ainda): `ketris-design-system.md` (identidade visual e tokens), `ketris-planejamento-completo.md` (inventário de módulos do produto).

## Stack — Frontend (definida, projeto scaffoldado)
Status: stack definida e projeto scaffoldado (`ketris-web.zip`). Estrutura, configs e o módulo `properties` (referência do padrão modular) já criados. Falta implementar as telas/módulos de domínio.

- Framework: Next.js 14+ (App Router)
- Linguagem: TypeScript
- UI Kit: Material UI (MUI v6)
- Layout: mobile-first
- Estado global: Zustand
- Cache/estado de servidor: TanStack Query (React Query)
- Organização: por módulos (feature-based)
- Notificações/toasts: Notistack
- Formulários: React Hook Form
- Validação: Zod (via resolver do RHF; evitar `useState` para estado de inputs — estado de formulário fica no RHF)
- Cliente HTTP: Axios, instanciado como classe (extensível, reutilizável)
- Autenticação (client-side): NextAuth.js (Auth.js)
- Mapas: MapLibre GL (open-source)
- Datas: Day.js
- Máscaras de input: react-imask (CPF, CNPJ, telefone, CEP etc.)
- Tabelas: MUI X DataGrid (free/MIT)
- Gráficos/dashboards: MUI X Charts (free/MIT)
- Upload de arquivos: react-dropzone; arquivos sempre passam pelo backend antes do S3 (sem upload direto do navegador)
- Testes unit/componente: Vitest + React Testing Library (desde o início)
- Testes E2E: Cypress (cobre Server Components assíncronos do App Router)
- Qualidade de código: ESLint + Prettier; Husky + lint-staged; Commitlint + Conventional Commits
  - Estilo: indentação 2 espaços, sem ponto e vírgula, aspas simples
- Observabilidade (front): Sentry, desde o início
- Identidade visual: cores da marca Navy `#052063` + Ciano `#01B1DA`. Fontes: Inter (corpo) + Space Grotesk (display, a confirmar). Implementado em `src/shared/theme`
- Theming/white-label: sistema nativo do MUI (`createTheme`/`buildTheme`), sem lib extra. Cores por tenant vêm do backend, sobrescrevem `primary`/`secondary` em runtime. Tenant resolvido no servidor (domínio/subdomínio), tema aplicado no SSR (evita flash). Tokens centralizados desde o início em `src/shared/theme/tokens.ts`

### Decisões em aberto (front)
- Fonte display: Space Grotesk vs Sora
- Dark mode: MVP ou fase posterior? (base já preparada no tema)
- Cores semânticas (success/warning/error): valores atuais são propostos, a validar

## Backend
A definir

## Banco de Dados
A definir

## Infraestrutura / Deploy
A definir

## Integrações
A definir
