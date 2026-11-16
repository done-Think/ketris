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

Configure também `CONTRACTS_DATA_ENCRYPTION_KEY`: chave de 32 bytes em base64, própria para
este banco e compartilhada entre aplicação e seed. Se o banco já contém dados criptografados,
preserve a chave existente. As [operações de contratos](docs/contracts-operations.md)
explicam geração, armazenamento e recuperação da chave.

```bash
nvm use
npm install
docker compose up -d          # sobe o Postgres local (postgres:16-alpine, porta 55532 no host)
npm run db:deploy             # aplica as migrations versionadas; preserva o banco existente
npm run db:generate           # atualiza o Prisma Client
npm run db:seed               # cria só o platform admin (PLATFORM_ADMIN_* do .env)
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
npm run db:seed     # cria o platform admin do Ketris (sem dados de demonstração)
npm run db:studio   # abre o Prisma Studio (inspeção visual do banco)
npm run api:generate # atualiza OpenAPI e os tipos HTTP do front
npm run api:check    # falha quando o contrato gerado está desatualizado
```

O seed cria apenas o platform admin do Ketris, com `PLATFORM_ADMIN_NAME`, `PLATFORM_ADMIN_EMAIL`
e `PLATFORM_ADMIN_PASSWORD` do `.env` (a senha é obrigatória; o seed para com erro se faltar). Se já
existir um platform admin, nada é alterado. O platform admin não tem etapa de confirmação de
e-mail: a conta nasce ativa e já pode entrar. Imobiliárias, corretores e imóveis são criados pelo
próprio produto ou pelas fixtures dos testes.

## Validação local (Husky + commitlint)

Os testes rodam **na sua máquina antes do push**; se algum quebrar, o código não sobe. O CI só repete
a suíte quando não há prova de que ela passou localmente (ver "Como o CI usa isso"). Os hooks são
instalados pelo `npm install` (script `prepare`).

**No commit** (`.husky/pre-commit` e `.husky/commit-msg`):

- `lint-staged` formata e corrige os arquivos alterados.
- O `commit-msg` acrescenta `Refs: DTK-NNN` sozinho quando a branch é `dtk-NNN-...` ou
  `tipo/dtk-NNN-...`, e o `commitlint` valida a mensagem.

Padrão: `tipo(escopo): assunto` — assunto em inglês, no imperativo, em minúsculas, sem ponto final,
até 100 caracteres. O **escopo é obrigatório** e vem de uma lista fechada em
[commitlint.config.js](commitlint.config.js) (por exemplo `auth`, `marketplace`, `face-check`, `ci`).
Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`revert`.

```text
fix(face-check): reject expired invitations

O link vencido ainda abria a análise.

Refs: DTK-182
```

**No push** (`.husky/pre-push` → `scripts/pre-push-validate.mjs`), na mesma ordem do CI: nomes em
inglês e convenções, testes dos scripts, `api:check`, typecheck, lint, unitários, integração e Face
Check (e o motor Python, quando o diff toca `services/face_check_engine`). O **E2E (build + Cypress)
roda só quando o diff toca o app** (`apps/web`, exceto `.md`, ou `package*.json`).

Requisitos: `docker compose up -d` (os testes usam um banco descartável no Postgres local, nunca o
seu banco de desenvolvimento) e as portas 3000, 3101 e 3102 livres para o E2E. O push também exige
que o commit enviado seja o `HEAD` e que não haja alterações rastreadas sem commit.

**Como o CI usa isso:** quando tudo passa, o hook grava uma atestação (um _git note_
`refs/notes/lv/<sha>` com autor, data e checks) e a envia junto com o push. Se o conteúdo (_tree_)
do PR ou da `dev` for idêntico ao atestado, o CI pula `quality` e `auth-e2e`. Sem atestação, com
atestação de outro conteúdo, pulada, ou quando `.github/`, `.husky/` ou os scripts de validação
mudam, o CI roda a suíte completa, como antes.

**Pular a validação (excepcional) e auditoria:**

```bash
SKIP_PREPUSH="hotfix de produção, incidente 123" git push        # motivo: 8 a 200 caracteres
SKIP_PREPUSH="hotfix de produção" git commit -m "fix(auth): ..." # opcional: grava Tests-Skipped-By no commit
```

- Com `SKIP_PREPUSH`, o push sobe sem rodar os testes e fica registrado quem pulou, o motivo e a
  data no _git note_ do commit (`git log --show-notes='lv/*'`). Feito no commit, o trailer
  `Tests-Skipped-By: Nome <email> — motivo` também fica na mensagem.
- Force push em `dev` e `main` é **bloqueado** sem `SKIP_PREPUSH`; com ele, o note registra
  `forced`.
- `git push --no-verify`, `HUSKY=0` ou outro cliente Git não deixam registro local, mas o CI
  detecta a falta de atestação, roda a suíte completa e emite um aviso de auditoria com o autor do
  push no resumo da execução.

**Push que cai depois dos testes:** a suíte leva alguns minutos e, nesse tempo, a conexão SSH com o
GitHub fica parada; se ela cair (`Connection closed by remote host`, `Broken pipe`), basta rodar o
`git push` de novo: a atestação local do commit é reaproveitada e os testes não repetem. Para
evitar a queda, adicione ao `~/.ssh/config`:

```text
Host github.com
  ServerAliveInterval 30
  ServerAliveCountMax 20
```

**Limites:** o hook roda na máquina do desenvolvedor, então ele não é uma barreira inviolável. Para
garantir, proteja `dev` e `main` no GitHub (PR obrigatório e sem force push). O pre-push ainda não
cobre o ensaio de renome (`db:rehearse-english-rename`) nem `staging-release-db.test.mjs`; mudanças
que dependem deles devem ser conferidas no CI ou manualmente.

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
