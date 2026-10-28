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

**Imagens/vídeos usados dentro da UI** (logos, ícones de tela, ilustrações) ficam versionados junto do
código, não em `public/`:

- Usada por um único módulo → `apps/web/src/modules/<dominio>/assets/`
- Usada por mais de um módulo (ou por `shared/components/`) → `apps/web/src/shared/assets/`
- Importe como módulo (`import logo from '@shared/assets/logo.png'`) e passe pro componente — nunca uma
  string de URL fixa tipo `"/logo.png"`

`public/` fica reservado para o que precisa de uma URL fixa conhecida por fora do bundle (favicon,
apple-icon, manifest) ou que o Next não suporta importar como módulo hoje (vídeo — `.webm`/`.mp4` não têm
loader de asset configurado, então continuam em `public/`).

## Desenvolvimento

Use Node.js 24 (`.nvmrc`/`.node-version` apontam para `24.18.0`).

Copie `apps/web/.env.example` para `apps/web/.env` (**não** `.env.local` — o CLI do Prisma só lê `.env`,
não `.env.local`) e ajuste se necessário.

```bash
nvm use
npm install
docker compose up -d          # sobe o Postgres local (postgres:16-alpine, porta 55532 no host)
npm run db:deploy             # aplica as migrations versionadas; preserva o banco existente
npm run db:generate           # atualiza o Prisma Client
npm run db:seed               # demonstração: contas e perfis públicos; redefine usuários/senhas das fixtures
npm run dev
```

Web: http://localhost:3000

Usamos a porta 55532 no host (em vez da 5432 padrão) porque é comum ter outros projetos locais com
Postgres/PgBouncer já ocupando 5432/5433. Se mesmo assim colidir,
troque o mapeamento em `docker-compose.yml` e ajuste `DATABASE_URL` no `.env` de acordo.

Para parar o banco: `docker compose down` (mantém os dados) ou `docker compose down -v` (apaga tudo).

## Scripts úteis

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
npm run e2e         # Cypress
npm run format      # Prettier

npm run db:deploy   # aplica migrations versionadas em banco existente
npm run db:migrate  # cria/aplica migrations durante desenvolvimento de schema
npm run db:seed     # dados de demonstração, incluindo corretores e imobiliárias públicos
npm run db:studio   # abre o Prisma Studio (inspeção visual do banco)
npm run api:generate # atualiza OpenAPI e os tipos HTTP do front
npm run api:check    # falha quando o contrato gerado está desatualizado
```

O seed cria 11 perfis de corretores elegíveis e 3 imobiliárias de demonstração. Perfis públicos
existentes conservam conteúdo, status de rascunho e equipe selecionada. As contas do dataset
continuam usando a senha de desenvolvimento indicada no seed; não rodar esse dataset em produção.

Sem credenciais AWS em desenvolvimento, imagens de imóveis e perfis públicos usam o storage
local em `apps/web/.local/uploads`, fora do Git. Avatares, documentos e comprovantes que usam S3
exigem configuração desse serviço. S3/SES também aceitam
credenciais temporárias, profile local e role em produção pela cadeia padrão do SDK. O envio real
de e-mails exige SES configurado. As [políticas de segurança](docs/security-policies.md), o
[ensaio de migrations](apps/web/prisma/english-rename/README.md) e a
[publicação coordenada](docs/staging-release.md) detalham as validações de ambiente.

Com `GEOCODING_SEARCH_URL` configurada, o servidor busca coordenadas pelo endereço completo ao
cadastrar ou editar um imóvel sem posição manual. Imóveis antigos sem coordenadas também são
localizados ao abrir o detalhe público; essa leitura usa cache e não altera o cadastro. Para
persistir a posição de um imóvel antigo, salve sua edição. Sem resultado compatível com rua,
cidade e UF, a página informa que o mapa está indisponível. A posição retornada pode ser
aproximada quando o número não está mapeado; coordenadas manuais completas têm preferência.

O endpoint deve ser compatível com o `/search` do Nominatim. Seu serviço público exige uma
decisão explícita de uso e o cumprimento da [política do Nominatim](https://operations.osmfoundation.org/policies/nominatim/):
até 1 consulta por segundo para a aplicação inteira, cache, identificação e atribuição OSM,
sem autocomplete. O adaptador usa um contador compartilhado no PostgreSQL, cache de resultados,
deduplicação de consultas simultâneas e timeout. O endpoint público fica desativado por padrão;
para testes locais, defina-o em `.env.local`. Para maior volume, use provedor contratado ou
instância própria compatível e ajuste a configuração do servidor.

No cadastro e na edição, informe o CEP e saia do campo para consultar o [ViaCEP](https://viacep.com.br/).
A consulta preenche rua, bairro, cidade e UF, preservando número, complemento e alterações feitas
durante a busca. CEP inexistente ou serviço indisponível mantém o preenchimento manual disponível.
Essa consulta não fornece coordenadas nem confirma a posição exata do imóvel.
