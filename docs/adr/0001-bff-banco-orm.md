# ADR-0001: BFF, Banco de Dados e ORM da Ketris

**Status:** Accepted
**Date:** 2026-07-31
**Deciders:** Alysson (produto/tech)

## Context

O scaffold inicial do repositório trazia um backend NestJS separado, que foi removido deliberadamente ao
reaproveitar o repositório (ver `docs/estado-do-projeto.md`) até que a stack de backend fosse decidida com
calma — a constituição do projeto (`.specify/memory/constitution.md`) ficou com um `TODO(BACKEND_STACK)`
em aberto desde então.

O frontend (`apps/web`) já está implementado em Next.js 14 (App Router) + TypeScript, com NextAuth.js para
sessão/autenticação client-side e uma camada única de acesso a dados (`HttpClient` sobre Axios,
`BaseService` por módulo) que hoje aponta para `NEXT_PUBLIC_API_URL` — ou seja, já está pronta para
consumir uma API REST, seja ela no mesmo processo do Next.js ou em um serviço externo.

O domínio de negócio do primeiro loop de valor (`specs/001-mvp-loop-imovel-pagamento/data-model.md`) é
fortemente relacional: Imóvel → Oportunidade/Proposta → Contrato → Assinatura (N por parte, incluindo
fiador opcional) → Cobrança, com regras de transição de status que dependem de integridade referencial e
transações (ex.: contrato só fica "ativo" quando 100% das assinaturas fecham; a cobrança correspondente é
criada automaticamente nesse momento). O produto é multi-tenant desde a fundação (Princípio II da
constituição): toda entidade carrega `tenantId` e toda chamada carrega o tenant ativo.

Restrições relevantes: time pequeno (essencialmente solo neste momento), pressão para validar o loop
mínimo de valor rápido, sem tráfego de produção ainda, e forte preferência por TypeScript de ponta a ponta
já estabelecida na stack do frontend.

## Decision

1. **BFF = Route Handlers do próprio Next.js**, dentro de `apps/web` (`src/app/api/**/route.ts`), sem um
   serviço backend separado por enquanto. A camada de service/domínio no servidor fica organizada em
   `src/server/<dominio>/` (paralelo aos módulos client-side em `src/modules/<dominio>/`), mantendo o
   Princípio I (Arquitetura Modular por Domínio) também no lado servidor.
2. **Banco de dados: PostgreSQL.**
3. **ORM: Prisma**, com um client singleton em `src/server/db/prisma.ts` e schema único em
   `apps/web/prisma/schema.prisma` como fonte de verdade do modelo de dados (substituindo a natureza
   apenas conceitual de `specs/*/data-model.md`, que passam a apontar para o schema Prisma real).
4. **Multi-tenancy: schema compartilhado com coluna `tenantId`** em toda tabela de domínio (não schema-per-
   tenant nem database-per-tenant), reforçado por um middleware/helper de query que sempre filtra por
   tenant — mantém o Princípio II sem a complexidade operacional de múltiplos schemas/bancos numa fase
   onde o número de tenants ainda é pequeno.

## Options Considered

### BFF — Option A: Route Handlers do Next.js (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa — um único app, um único deploy, zero CORS/bridging de auth |
| Custo | Baixo — nenhuma infraestrutura extra |
| Escalabilidade | Suficiente para o MVP; domínios pesados podem ser extraídos depois |
| Familiaridade do time | Alta — já é TypeScript/Next.js, mesma linguagem do frontend |

**Pros:** reaproveita NextAuth já configurado; `HttpClient` do frontend já assume uma API REST e pode
apontar para `/api` no mesmo domínio sem nenhuma mudança de contrato; um único pipeline de CI/deploy;
menor superfície para o estágio atual do produto.
**Cons:** acopla o ciclo de vida da API ao do frontend (mesmo deploy); menos isolamento de falhas/escala
entre UI e domínio de negócio.

### BFF — Option B: Serviço NestJS separado (`apps/bff`)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Média/alta — segundo serviço, segundo deploy, propagação de auth entre Next.js e Nest |
| Custo | Maior — infraestrutura e observabilidade duplicadas |
| Escalabilidade | Melhor isolamento a longo prazo, mas prematuro sem tráfego real |
| Familiaridade do time | Alta (era o scaffold original), porém dobra a superfície a manter agora |

**Pros:** separação clara de responsabilidades; escala independente; caminho natural se surgirem workers,
filas ou múltiplos frontends (app mobile nativo, por exemplo) consumindo a mesma API.
**Cons:** overhead de infraestrutura e autenticação cruzada não se paga ainda no estágio atual (loop mínimo
de valor, sem tráfego de produção).

### BFF — Option C: tRPC sobre Next.js (sem API REST)

**Pros:** tipagem ponta a ponta sem gerar contratos manualmente.
**Cons:** exigiria reescrever a camada `HttpClient`/`BaseService` já construída no frontend (baseada em
REST/Axios), sem ganho proporcional neste momento — descartada.

### Banco — Option A: PostgreSQL (escolhida)

| Dimensão | Avaliação |
|---|---|
| Complexidade | Baixa/média — SQL padrão, ecossistema maduro de migrations |
| Custo | Baixo, com boas opções gerenciadas (Neon, Supabase, RDS) inclusive com free tier |
| Escalabilidade | Alta para carga relacional; suporta JSONB para os poucos campos semi-estruturados |
| Familiaridade do time | Alta |

**Pros:** integridade referencial e transações ACID para o encadeamento Imóvel→Oportunidade→Contrato→
Assinatura→Cobrança; suporte a `PostGIS`/geoindexação futura para busca de imóveis por localização;
Row-Level Security nativo, caminho natural de evolução do isolamento multi-tenant se necessário depois.
**Cons:** nenhum relevante para este caso de uso.

### Banco — Option B: MySQL

**Pros:** também relacional e maduro.
**Cons:** suporte mais limitado a JSON/constraints avançadas e sem `PostGIS`; sem vantagem clara sobre
Postgres aqui — descartada.

### Banco — Option C: MongoDB

**Pros:** flexível para dados não estruturados.
**Cons:** o domínio é fortemente relacional com regras de integridade entre entidades (contrato só ativa
com 100% das assinaturas); modelar isso em um banco de documentos exigiria replicar por conta própria o
que um banco relacional já garante — descartada.

### ORM — Option A: Prisma (escolhida)

**Pros:** schema declarativo único como fonte de verdade, migrations automáticas, client 100% type-safe em
TypeScript, `prisma studio` para inspeção rápida de dados — melhor DX para o ritmo de iteração atual.
**Cons:** menos controle fino de SQL que Drizzle/query builders — aceitável neste estágio.

### ORM — Option B: Drizzle

**Pros:** mais leve, SQL mais explícito e controlável, também type-safe.
**Cons:** DX de migrations menos madura que a do Prisma hoje — descartada por ora.

### ORM — Option C: TypeORM

**Pros:** integração idiomática com NestJS (decorators), caso a Option B do BFF fosse escolhida.
**Cons:** não decorators-first sem NestJS; DX de migrations e type-safety geralmente considerada inferior à
do Prisma — descartada.

## Trade-off Analysis

A decisão central é "velocidade agora vs. isolamento depois". Rota A (Route Handlers no Next.js) otimiza
para velocidade de entrega do loop mínimo de valor com o menor número de peças móveis possível, aceitando
conscientemente um acoplamento de deploy que é barato de desfazer depois: a organização em `src/server/
<dominio>/` já isola a lógica de domínio da camada HTTP, então extrair para um serviço NestJS separado no
futuro é um refactor localizado, não uma reescrita. PostgreSQL + Prisma não têm trade-off relevante contra
as alternativas dado o formato do domínio (fortemente relacional, transacional, multi-tenant) — a escolha
é confortável mesmo se o BFF for extraído depois, já que Prisma funciona igualmente bem dentro do Next.js
ou dentro de um serviço Nest.

## Consequences

- Fica mais fácil: começar a persistir dados reais do loop mínimo de valor sem subir infraestrutura nova;
  manter TypeScript de ponta a ponta (schema Prisma → tipos → Zod → React Hook Form já é o padrão do
  frontend); rodar tudo localmente com um único `docker-compose` (Postgres) + `npm run dev`.
- Fica mais difícil: escalar API e frontend de forma independente (mitigado pela organização em `src/
  server/<dominio>/`, que mantém a extração futura barata); servir um segundo consumidor (app mobile
  nativo) sem duplicar lógica — quando isso vier a acontecer, é o gatilho natural para reavaliar a Option B
  do BFF.
- A revisitar: se o número de tenants/volume de dados justificar isolamento mais forte, avaliar Postgres
  Row-Level Security ou schema-per-tenant; se surgir processamento assíncrono pesado (webhooks de
  assinatura eletrônica, geração de PDF, notificações), avaliar extrair essas rotinas para um worker
  separado mesmo mantendo o BFF principal no Next.js.

## Action Items

1. [ ] Preencher `TODO(BACKEND_STACK)` na constituição do projeto e registrar esta decisão em
   `docs/stack.md`
2. [ ] Modelar o schema Prisma (`apps/web/prisma/schema.prisma`) a partir dos `data-model.md` já existentes
3. [ ] Instalar `prisma`/`@prisma/client`, configurar `DATABASE_URL` (`.env.example`) e o client singleton
   em `src/server/db/prisma.ts`
4. [ ] Registrar migration inicial (`prisma migrate dev`) e validar conexão local (Postgres via Docker)
5. [ ] Criar spec Spec Kit dedicada (`specs/002-...`) para as tarefas de implementação do BFF em si
   (endpoints REST, autenticação real via Prisma, etc.) — fora do escopo desta ADR
