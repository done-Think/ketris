# Ketris — Requisitos: Telas, Funcionalidades e Tarefas

Levantamento de telas e funcionalidades da plataforma, dividido em tarefas acionáveis. Organizado por módulo. Sem definição de fase (v1/v2 fica a critério do time) — cada bloco traz complexidade estimada (🟢 baixa · 🟡 média · 🔴 alta).

Legenda de tarefas: `[ ]` a fazer. Cada tarefa é pensada como um card de backlog.

Convenção: telas públicas → route group `(public)`; autenticadas → `(dashboard)`; login/cadastro → `(auth)`.

---

## 0. Fundação transversal (usada por vários módulos)

Componentes e infraestrutura de UI compartilhados (`src/shared`), pré-requisito de quase tudo.

### Tarefas
- [ ] 🟡 Shell autenticado: sidebar + topbar responsivos (drawer no mobile, mini-variant no desktop)
- [ ] 🟡 Sistema de navegação por perfil (menu muda conforme proprietário/corretor/imobiliária/locatário)
- [ ] 🟢 Componente de breadcrumb
- [ ] 🟢 Estados de UI reutilizáveis: loading (skeletons), empty state, error state
- [ ] 🟢 Wrapper de página (título, ações, breadcrumb)
- [ ] 🟢 Componentes de formulário integrados a RHF + Zod (TextField, Select, DatePicker, campos com máscara react-imask: CPF, CNPJ, telefone, CEP, moeda)
- [ ] 🟢 Componente de upload (react-dropzone) com preview e progresso
- [ ] 🟢 Feedback de ações via Notistack (helper padronizado de sucesso/erro)
- [ ] 🟡 Guarda de rota por autenticação e por perfil/permissão
- [ ] 🟡 Tratamento global de erros de API no HttpClient (401 → refresh/logout, 403, 5xx)
- [ ] 🟢 Tabela padrão reutilizável sobre MUI X DataGrid (paginação, ordenação, busca)
- [ ] 🟢 Formatação BR (moeda, data via Day.js) — já iniciado em `shared/lib/utils`

---

## 1. Autenticação e Onboarding

### Telas
- Login `(auth)/login`
- Cadastro (escolha de perfil: proprietário, corretor, imobiliária, construtora, locatário) `(auth)/cadastro`
- Recuperação de senha `(auth)/recuperar-senha`
- Redefinição de senha `(auth)/redefinir-senha`
- Verificação de e-mail
- Onboarding pós-cadastro (wizard inicial por perfil)
- Seletor de tenant (para usuário com acesso a mais de um ambiente)

### Requisitos funcionais
- Login com e-mail/senha (NextAuth + backend JWT)
- Cadastro com seleção de tipo de conta, que define o ambiente/tenant criado
- Fluxo de recuperação e redefinição de senha
- Verificação de e-mail
- Multi-tenant: usuário pode pertencer a mais de um tenant e alternar entre eles

### Tarefas
- [ ] 🟢 Tela de login com RHF + Zod, integrada ao NextAuth
- [ ] 🟡 Tela de cadastro com seleção de perfil
- [ ] 🟢 Recuperação de senha (solicitar link)
- [ ] 🟢 Redefinição de senha (via token)
- [ ] 🟢 Verificação de e-mail
- [ ] 🟡 Wizard de onboarding por perfil (dados básicos, primeiro imóvel/cliente)
- [ ] 🟡 Seletor de tenant (integra com `useTenantStore` e header `X-Tenant-Id`)
- [ ] 🟢 Logout e limpeza de sessão/estado

---

## 2. Marketplace Público (SEO)

### Telas
- Home `(public)/` — hero, busca, imóveis em destaque
- Listagem/busca de imóveis `(public)/imoveis` — filtros + mapa
- Detalhe do imóvel `(public)/imoveis/[id]` — galeria, dados, mapa, contato/proposta
- Página pública do corretor/imobiliária `(public)/[slug]` (white-label / site do profissional)
- Resultado de busca com mapa interativo (MapLibre GL)

### Requisitos funcionais
- Renderização no servidor (SSR/ISR) para indexação
- Busca com filtros: tipo, preço, localização, quartos, área, finalidade (aluguel/venda)
- Mapa interativo com pins e clusterização
- Favoritar imóveis (persistência local para anônimo; conta para logado)
- Comparação entre imóveis
- Alertas por busca salva (novo imóvel compatível)
- Recomendação por IA (fase posterior — depende de dados)
- Envio de proposta / contato a partir do detalhe

### Tarefas
- [ ] 🟡 Home pública com hero + busca (SSR)
- [ ] 🔴 Página de busca: filtros + resultados + mapa MapLibre com clusterização
- [ ] 🟡 Componente de card de imóvel (usado em listagem, destaques, favoritos)
- [ ] 🟡 Detalhe do imóvel: galeria de fotos/vídeos, dados, mapa, CTA de proposta/contato
- [ ] 🟢 Metadados dinâmicos (title/description/OpenGraph) por imóvel para SEO
- [ ] 🟢 `sitemap.xml` e `robots.txt` dinâmicos
- [ ] 🟡 Favoritos (anônimo via storage + sincronização ao logar)
- [ ] 🟡 Comparação entre imóveis (seleção + tela comparativa)
- [ ] 🟡 Busca salva + alertas
- [ ] 🟡 Página pública do profissional (site white-label por slug/domínio)

---

## 3. Gestão de Imóveis

### Telas
- Lista de imóveis do tenant `(dashboard)/imoveis`
- Cadastro/edição de imóvel (formulário multi-etapa) `(dashboard)/imoveis/novo` · `/[id]/editar`
- Detalhe/gestão do imóvel (status, participantes, histórico) `(dashboard)/imoveis/[id]`
- Gestão de mídia do imóvel (fotos, vídeos, ordenação)
- Gestão de participantes do imóvel (proprietário, corretor, imobiliária, advogado)

### Requisitos funcionais
- CRUD de imóvel (módulo `properties` já tem service/hook de referência)
- Formulário multi-etapa: dados, endereço/mapa, características, mídia, valores, publicação
- Upload de mídia (via backend → S3), reordenação, capa
- Publicar/despublicar no marketplace
- Compartilhamento inteligente: múltiplos participantes com permissões distintas
- Status do imóvel (rascunho, publicado, alugado, vendido, inativo)

### Tarefas
- [ ] 🟡 Listagem de imóveis (DataGrid com filtros e status)
- [ ] 🔴 Formulário multi-etapa de cadastro/edição (RHF + Zod)
- [ ] 🟡 Seletor de localização no mapa (MapLibre) + geocoding do endereço
- [ ] 🟡 Upload e gestão de mídia (react-dropzone, reordenar, definir capa)
- [ ] 🟢 Ação publicar/despublicar
- [ ] 🔴 Gestão de participantes do imóvel + permissões por participante
- [ ] 🟢 Histórico/timeline do imóvel

---

## 4. CRM

### Telas
- Pipeline (Kanban) `(dashboard)/crm`
- Lista de leads/clientes `(dashboard)/crm/contatos`
- Detalhe do lead/cliente (histórico, interações, imóveis de interesse)
- Agenda de visitas `(dashboard)/agenda`
- Registro de interação (nota, ligação, mensagem)

### Requisitos funcionais
- Pipeline: Lead → Contato → Visita → Negociação → Proposta → Contrato → Cliente
- Movimentação entre estágios (no mobile, evitar drag-and-drop puro — usar ação por toque)
- Ficha do cliente com histórico completo de interações
- Agenda de visitas integrada (agendar, confirmar, lembrar)
- Distribuição automática de leads (imobiliária — regras) [fase posterior]
- Classificação automática de leads por IA [fase posterior]

### Tarefas
- [ ] 🔴 Board de pipeline (Kanban) com movimentação mobile-friendly
- [ ] 🟡 Lista de contatos (DataGrid + filtros)
- [ ] 🟡 Detalhe do contato com timeline de interações
- [ ] 🟢 Registro de interações (notas, tipos de contato)
- [ ] 🟡 Agenda de visitas (calendário + agendamento)
- [ ] 🟡 Vínculo lead ↔ imóveis de interesse
- [ ] 🔴 Regras de distribuição automática de leads (imobiliária)

---

## 5. Contratos e Assinatura

### Telas
- Lista de contratos `(dashboard)/contratos`
- Gerador de contrato (formulário guiado) `(dashboard)/contratos/novo`
- Detalhe do contrato (versões, partes, status, documentos)
- Fluxo de assinatura (acompanhamento de assinantes)
- Aditivos / distratos / renovações

### Requisitos funcionais
- Geração automática a partir de respostas (residencial primeiro; comercial, aditivo, distrato, renovação depois)
- Versionamento de documentos
- Assinatura digital (integração com provedor: Clicksign/D4Sign/DocuSign)
- Trilha de auditoria e status por assinante
- Armazenamento do PDF final + notificações

### Tarefas
- [ ] 🟡 Listagem de contratos (status, partes, vigência)
- [ ] 🔴 Gerador guiado de contrato residencial (formulário → documento)
- [ ] 🟡 Visualização do contrato + versões
- [ ] 🟡 Integração de assinatura digital (envio, acompanhamento, webhook de status)
- [ ] 🟢 Trilha de auditoria da assinatura
- [ ] 🟡 Aditivos, distratos e renovações (reuso do gerador)
- [ ] 🟢 Notificações de assinatura (Notistack + e-mail)

---

## 6. Financeiro

### Telas
- Painel financeiro `(dashboard)/financeiro`
- Cobranças/faturas (a receber / a pagar)
- Detalhe da cobrança (status, comprovante, histórico)
- Repasses e comissões
- Extratos e conciliação
- Inadimplência

### Requisitos funcionais
- Cobrança via PIX, boleto e cartão
- Split de pagamentos e comissão automática (idealmente via gateway com split nativo)
- Reajuste anual (cálculo de índice + aplicação)
- Gestão de inadimplência (avisos, status)
- Extratos e conciliação
- Dashboards financeiros (MUI X Charts)

### Tarefas
- [ ] 🟡 Painel financeiro com indicadores + gráficos (MUI X Charts)
- [ ] 🟡 Lista de cobranças (a receber/a pagar) com status
- [ ] 🟡 Detalhe da cobrança (comprovante, histórico, ações)
- [ ] 🔴 Integração de pagamento (PIX/boleto/cartão) — depende do gateway escolhido
- [ ] 🔴 Split de pagamentos e comissão automática
- [ ] 🟡 Reajuste anual (cálculo + aplicação + aviso)
- [ ] 🟡 Controle de inadimplência
- [ ] 🟡 Extratos e conciliação

---

## 7. Manutenção

### Telas
- Lista de chamados `(dashboard)/manutencao`
- Abertura de chamado (locatário)
- Detalhe do chamado (fotos/vídeos, orçamento, status, histórico)

### Requisitos funcionais
- Abertura de chamado pelo locatário com categoria (elétrica, hidráulica, pintura, reparos)
- Upload de fotos/vídeos no chamado
- Orçamento vinculado
- Acompanhamento pelo proprietário
- Histórico por imóvel

### Tarefas
- [ ] 🟢 Lista de chamados (status, categoria, imóvel)
- [ ] 🟢 Formulário de abertura de chamado com upload de mídia
- [ ] 🟡 Detalhe do chamado (timeline, orçamento, mudança de status)
- [ ] 🟢 Visão do proprietário (acompanhamento)

---

## 8. Dashboards por Perfil

### Telas
- Dashboard do Proprietário — imóveis, recebimentos, manutenções, contratos ativos
- Dashboard do Corretor — desempenho, pipeline, imóveis ativos, comissões
- Dashboard da Imobiliária — visão de equipe, leads, financeiro consolidado
- Dashboard do Locatário — contrato ativo, próximas cobranças, chamados
- Dashboard da Construtora — lançamentos, reservas, vendas

### Tarefas
- [ ] 🟡 Dashboard do proprietário
- [ ] 🟡 Dashboard do corretor (métricas de conversão, MUI X Charts)
- [ ] 🔴 Dashboard da imobiliária (agregado por equipe/corretor)
- [ ] 🟢 Dashboard do locatário
- [ ] 🟡 Dashboard da construtora

---

## 9. Área Corporativa (Imobiliária)

### Telas
- Gestão de usuários e equipes `(dashboard)/equipe`
- Controle de permissões/papéis
- Configurações do tenant
- Relatórios
- Auditoria (trilha de ações)

### Requisitos funcionais
- Múltiplos usuários por tenant
- Hierarquia e equipes
- Permissões granulares por papel
- Relatórios e auditoria

### Tarefas
- [ ] 🔴 Gestão de usuários (convite, papéis, status)
- [ ] 🔴 Gestão de equipes/hierarquia
- [ ] 🔴 Editor de permissões por papel
- [ ] 🟡 Relatórios
- [ ] 🔴 Tela de auditoria

---

## 10. Construtoras

### Telas
- Lista de lançamentos `(dashboard)/lancamentos`
- Cadastro de empreendimento (unidades, plantas, tabela de preços)
- Gestão de reservas
- Funil de vendas (distinto de locação)

### Tarefas
- [ ] 🟡 CRUD de lançamento/empreendimento
- [ ] 🟡 Gestão de unidades (grid de disponibilidade)
- [ ] 🟡 Reservas
- [ ] 🟡 Documentação do empreendimento (memorial, plantas)

---

## 11. Configurações e White-Label

### Telas
- Perfil do usuário `(dashboard)/perfil`
- Configurações da conta/tenant `(dashboard)/configuracoes`
- Identidade visual (logo, cores) — white-label
- Domínio próprio
- Planos e assinatura (billing)
- Notificações (preferências)

### Requisitos funcionais
- Edição de perfil e conta
- Configuração de identidade visual do tenant (alimenta o `buildTheme`)
- Domínio próprio (resolução por domínio no SSR)
- Gestão de plano/assinatura (recursos por tier)
- Preferências de notificação

### Tarefas
- [ ] 🟢 Tela de perfil do usuário
- [ ] 🟡 Configurações do tenant
- [ ] 🟡 Editor de identidade visual (cores/logo) → integra com theming por tenant
- [ ] 🔴 Configuração de domínio próprio
- [ ] 🟡 Tela de planos e assinatura (billing)
- [ ] 🟢 Preferências de notificação

---

## 12. Notificações

### Telas
- Central de notificações (in-app)
- Preferências (canais: in-app, e-mail, push)

### Tarefas
- [ ] 🟡 Central de notificações in-app (lista, marcar como lida)
- [ ] 🟡 Integração de push/tempo real (a definir: WebSocket/SSE)
- [ ] 🟢 Toasts de eventos importantes (Notistack)

---

## 13. IA (transversal, fase posterior na maioria)

Cada item é independente. Vários dependem de volume de dados — sequenciar após ter uso real.

### Tarefas
- [ ] 🟢 Geração automática de descrição de anúncio (no cadastro de imóvel)
- [ ] 🟢 Resumo de contrato
- [ ] 🟡 Chatbot de atendimento
- [ ] 🟡 Melhoria de imagens
- [ ] 🔴 Sugestão de preço (depende de dados de mercado)
- [ ] 🔴 Classificação automática de leads (depende de histórico)
- [ ] 🔴 Recomendação de imóveis (depende de dados de uso)

---

## 14. Qualidade (contínuo)

- [ ] 🟢 Testes unitários/componente (Vitest) acompanhando cada módulo
- [ ] 🟡 Testes E2E (Cypress) dos fluxos críticos: login, cadastro de imóvel, proposta, contrato, pagamento
- [ ] 🟢 Acessibilidade básica (labels, contraste, navegação por teclado)
- [ ] 🟡 Performance mobile (imagens otimizadas, lazy loading de mapa/galeria)
- [ ] 🟢 Monitoramento de erros (Sentry) validado em produção

---

## Resumo por complexidade

| Complexidade | Exemplos de itens |
|---|---|
| 🔴 Alta | busca com mapa, pipeline Kanban mobile, gerador de contrato, integrações de pagamento/split, participantes+permissões do imóvel, área corporativa, domínio próprio, IA dependente de dados |
| 🟡 Média | formulários multi-etapa, dashboards, agenda, manutenção, upload de mídia, billing |
| 🟢 Baixa | telas de perfil, empty/error states, notas de CRM, componentes de formulário, formatação BR |

## Como priorizar (sugestão de critérios)

1. Definir o **perfil-alvo inicial** (proprietário? corretor?) — isso filtra quais telas entram primeiro.
2. Fechar o **loop mínimo de valor** end-to-end para esse perfil (ex.: cadastrar imóvel → publicar → receber proposta → contrato → 1º pagamento).
3. Deixar itens 🔴 que dependem de terceiros (pagamento, assinatura, IA com dados) sequenciados conforme parcerias/dados existam.
4. Adiar área corporativa e construtoras até o público justificar.
