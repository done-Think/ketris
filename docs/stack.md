# Ketris — Stack do Projeto

Documento de decisões técnicas, definido incrementalmente.

Documentos relacionados: `ketris-design-system.md` (identidade visual e tokens), `ketris-planejamento-completo.md` (inventário de módulos do produto).

## Frontend

> **Status:** stack definida e projeto scaffoldado (ver `ketris-web.zip`). Estrutura, configs e o módulo `properties` (referência do padrão modular) já criados. Falta implementar as telas/módulos de domínio.

- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **UI Kit:** Material UI (MUI v6)
- **Abordagem de layout:** Mobile-first
- **Gerenciamento de estado global:** Zustand
- **Cache/estado de servidor:** TanStack Query (React Query)
- **Organização do código:** estrutura por módulos (feature-based)
- **Notificações/toasts:** Notistack
- **Formulários:** React Hook Form
- **Validação:** Zod (integrado ao React Hook Form via resolver; evitar `useState` para estado de inputs — o estado dos formulários fica no React Hook Form)
- **Cliente HTTP:** Axios, instanciado como classe (extensível e reutilizável em qualquer lugar da aplicação)
- **Autenticação (client-side):** NextAuth.js (Auth.js)
- **Mapas:** MapLibre GL (open-source, sem custo de licença)
- **Datas:** Day.js (integra bem com os date-pickers do MUI)
- **Máscaras de input:** react-imask (CPF, CNPJ, telefone, CEP etc.)
- **Tabelas de dados:** MUI X DataGrid (versão gratuita/MIT)
- **Gráficos/dashboards:** MUI X Charts (versão gratuita/MIT)
- **Upload de arquivos:** react-dropzone (UI de upload); arquivos passam sempre pelo backend antes de serem enviados ao S3 (sem upload direto do navegador para o storage)
- **Testes (unit/componente):** Vitest + React Testing Library (desde o início do projeto)
- **Testes (E2E):** Cypress (inclui cobertura de Server Components assíncronos do App Router, que não são totalmente suportados em testes unitários)
- **Qualidade de código:**
  - ESLint + Prettier
  - Husky + lint-staged (hooks de pré-commit)
  - Commitlint + Conventional Commits
  - **Regras de estilo:** indentação de 2 espaços (1 tab), sem ponto e vírgula, aspas simples
- **Observabilidade (front):** Sentry (captura de erros em produção, desde o início do projeto)
- **Identidade visual / design system:** ver `ketris-design-system.md`. Cores da marca (extraídas da logo): Navy `#052063` + Ciano `#01B1DA`. Fontes: Inter (corpo) + Space Grotesk (display, a confirmar). Implementado em código em `src/shared/theme`.
- **Theming / white-label:** sistema nativo de temas do MUI (`createTheme`/`buildTheme`), sem biblioteca extra. As cores de cada tenant vêm do backend e sobrescrevem `primary`/`secondary` em runtime. O tenant é resolvido no servidor (pelo domínio/subdomínio) e o tema é aplicado já no SSR, evitando "flash" de cores erradas. Design tokens centralizados desde o início (`src/shared/theme/tokens.ts`) para evitar cores "chumbadas" no código.

### Decisões em aberto (front)
- Fonte display: Space Grotesk vs Sora
- Dark mode: entra no MVP ou fase posterior? (base já preparada no tema)
- Cores semânticas (success/warning/error): valores atuais são propostos, a validar

## Backend

_A definir_

## Banco de Dados

_A definir_

## Infraestrutura / Deploy

_A definir_

## Integrações

_A definir_
