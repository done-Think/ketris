# Ketris — Planejamento Completo do Produto

Este documento mapeia **toda** a ideia da Ketris em módulos, funcionalidades e dependências técnicas, sem definir fases. A priorização (v1, v2, v3...) fica a seu critério — aqui você tem o inventário completo para decidir com base em esforço, dependência técnica e valor de negócio.

Cada item traz uma marcação de complexidade estimada (🟢 baixa · 🟡 média · 🔴 alta) e dependências, para facilitar sua decisão.

---

## 1. Fundação Técnica (pré-requisito de tudo)

Independente da ordem de funcionalidades, alguns elementos de arquitetura precisam existir desde o início porque tudo depende deles.

| Item | Complexidade | Observação |
|---|---|---|
| Modelo de dados multi-tenant (isolamento por tenant) | 🔴 | Decide se isolamento é por schema, por linha (row-level) ou por banco. Afeta todo o resto. |
| Autenticação e autorização (usuários, papéis, permissões) | 🟡 | Base para proprietário, corretor, imobiliária, locatário |
| Estrutura de "imóvel" como entidade central | 🟡 | Precisa suportar múltiplos participantes desde o início (ver seção 5) |
| Infraestrutura de arquivos (fotos, vídeos, documentos) | 🟢 | Upload, storage, CDN |
| Sistema de notificações (email, push, in-app) | 🟡 | Usado por quase todos os módulos |
| Arquitetura API First (mesmo que a API não seja pública ainda) | 🟡 | Facilita integrações futuras sem retrabalho |

---

## 2. Perfis de Usuário e Áreas

### 2.1 Proprietário
- 🟢 Cadastro de imóveis
- 🟢 Publicação de anúncios
- 🟡 Controle de visitas (agenda simples)
- 🟢 Recebimento de propostas
- 🟡 Geração automática de contrato
- 🟡 Assinatura digital (integração com provedor)
- 🔴 Recebimento de pagamentos
- 🟡 Acompanhamento de reajustes (cálculo de índices, alertas)
- 🟡 Controle de manutenções
- 🟢 Contratação de corretor via plataforma

### 2.2 Corretor Independente
- 🟡 CRM completo (ver seção 6)
- 🟢 Gestão de clientes
- 🟡 Pipeline de negociação
- 🟢 Agenda integrada
- 🟡 Painel financeiro (comissões, recebimentos)
- 🟡 Geração automática de contratos
- 🔴 Módulo de IA (ver seção 9)
- 🟡 Site público personalizado (subdomínio ou domínio próprio)
- 🟡 Dashboard de desempenho (métricas de conversão, imóveis ativos etc.)

### 2.3 Imobiliárias (corporativo)
- 🔴 Múltiplos usuários por tenant
- 🔴 Gestão de equipes e hierarquia
- 🔴 Controle de permissões granular
- 🟡 Dashboards agregados (por equipe, por corretor)
- 🔴 Distribuição automática de leads (regras de roteamento)
- 🟡 APIs corporativas (acesso programático aos dados do tenant)
- 🟡 Financeiro consolidado
- 🟡 Relatórios
- 🔴 Auditoria (trilha de ações por usuário)

### 2.4 Construtoras
- 🟡 Gestão de lançamentos (empreendimentos com múltiplas unidades)
- 🟡 Reservas de unidades
- 🟡 Equipes comerciais
- 🟡 Gestão de vendas (funil próprio, diferente de locação)
- 🟢 Documentação (memorial, plantas, especificações)

### 2.5 Locatário
- 🟢 Busca de imóveis
- 🟢 Envio de propostas
- 🟢 Acompanhamento de negociações
- 🟡 Assinatura de contratos
- 🔴 Pagamentos
- 🟡 Abertura de chamados de manutenção
- 🟢 Histórico da locação

**Dependência importante:** os perfis 2.1–2.5 compartilham componentes (imóvel, contrato, pagamento, manutenção). Recomendo pensar nesses componentes como módulos horizontais (seções 5–8) reutilizados por cada perfil, em vez de construir tudo verticalmente por perfil.

---

## 3. Marketplace

| Item | Complexidade |
|---|---|
| Listagem básica de imóveis | 🟢 |
| Filtros avançados (preço, localização, tipo, quartos etc.) | 🟢 |
| Mapa interativo | 🟡 |
| Favoritos | 🟢 |
| Comparação entre imóveis | 🟡 |
| Alertas automáticos (novo imóvel compatível com busca salva) | 🟡 |
| Recomendação por IA | 🔴 (depende do módulo de IA, seção 9) |

---

## 4. Plataforma Multi-Tenant (aprofundamento)

- 🔴 Isolamento de dados por tenant (usuários, imóveis, clientes, contratos, financeiro)
- 🟡 Identidade visual por tenant (cores, logo)
- 🔴 White-label completo (domínio próprio, páginas públicas customizadas, temas)

O multi-tenant básico (isolamento de dados) é fundação (seção 1). White-label completo é uma camada avançada que pode vir bem depois.

---

## 5. Compartilhamento Inteligente de Imóveis

- 🔴 Modelo de dados que permite múltiplos participantes por imóvel (proprietário, corretor, imobiliária, administrador, advogado)
- 🔴 Sistema de permissões por participante (quem vê o quê, quem edita o quê)
- 🟡 Eliminação de anúncios duplicados (deduplicação/vínculo entre anúncios do mesmo imóvel)

**Nota:** isso é estruturalmente importante. Se a entidade "imóvel" for modelada desde o início como algo com um único dono, adicionar múltiplos participantes depois é uma migração cara. Vale decidir isso antes de codar, mesmo que a funcionalidade de compartilhamento em si venha em fase posterior.

---

## 6. CRM Imobiliário

Pipeline: Lead → Contato → Visita → Negociação → Proposta → Contrato → Cliente

| Item | Complexidade |
|---|---|
| Estrutura de pipeline (estágios, movimentação) | 🟡 |
| Histórico completo por lead/cliente | 🟢 |
| Distribuição automática de leads (regras) | 🔴 |
| Classificação automática de leads (IA) | 🔴 |

---

## 7. Contratos e Assinatura

| Item | Complexidade |
|---|---|
| Contrato residencial (modelo único, geração via formulário) | 🟡 |
| Contrato comercial | 🟡 |
| Aditivos | 🟡 |
| Distratos | 🟡 |
| Renovações | 🟡 |
| Versionamento de documentos | 🟢 |
| Assinatura digital (integração com provedor: Clicksign, D4Sign, DocuSign) | 🟡 |
| Trilha de auditoria da assinatura | 🟢 |
| Notificações automáticas de assinatura | 🟢 |

**Recomendação de arquitetura:** comece com 1 modelo de contrato (residencial) parametrizável, e só depois generalize para comercial/aditivo/distrato/renovação — a lógica de versionamento e assinatura é a mesma, muda o template.

---

## 8. Financeiro

| Item | Complexidade |
|---|---|
| Pagamento via PIX | 🟡 |
| Pagamento via boleto | 🟡 |
| Pagamento via cartão | 🟡 |
| Split de pagamentos (múltiplos recebedores em uma transação) | 🔴 |
| Comissão automática | 🟡 |
| Reajustes anuais (cálculo de índice, aplicação automática) | 🟡 |
| Gestão de inadimplência | 🟡 |
| Extratos | 🟢 |
| Conciliação bancária | 🔴 |

**Dependência crítica:** split de pagamentos e comissão automática são bem mais fáceis se você escolher um gateway que já suporte split nativamente (ex: alguns gateways brasileiros oferecem isso pronto). Vale pesquisar antes de implementar do zero.

---

## 9. Manutenção

| Item | Complexidade |
|---|---|
| Abertura de chamados pelo locatário | 🟢 |
| Categorização (elétrica, hidráulica, pintura etc.) | 🟢 |
| Upload de fotos/vídeos no chamado | 🟢 |
| Orçamento vinculado ao chamado | 🟡 |
| Histórico de manutenções por imóvel | 🟢 |
| Acompanhamento pelo proprietário | 🟢 |

---

## 10. Inteligência Artificial

Cada item aqui é independente dos outros — não é um módulo monolítico, e cada um tem custo/benefício próprio.

| Item | Complexidade | Observação |
|---|---|---|
| Geração automática de descrições de anúncio | 🟢 | LLM simples, baixo risco |
| Melhoria de imagens | 🟡 | Pode usar serviço terceirizado |
| Sugestão de preço | 🔴 | Precisa de dados históricos de mercado — difícil sem volume |
| Análise documental | 🔴 | Extração de dados de documentos (contratos, comprovantes) |
| Resumo de contratos | 🟢 | LLM sobre texto já estruturado |
| Chatbot inteligente | 🟡 | Depende de que base de conhecimento |
| Classificação automática de leads | 🟡 | Precisa de dados de treino/histórico |
| Atendimento automatizado | 🟡 | Sobrepõe com chatbot |
| Assistente para corretores | 🔴 | Feature ampla, mal definida — precisa de escopo próprio |
| Recomendações para proprietários | 🔴 | Precisa de dados de uso acumulados |

**Nota honesta:** vários itens de IA (sugestão de preço, classificação de leads, recomendações) dependem de volume de dados que a plataforma ainda não tem no início. Faz mais sentido sequenciar isso depois de ter usuários reais gerando dados — construir esses recursos cedo demais significa ou usar heurísticas simples disfarçadas de "IA", ou investir em algo que não vai funcionar bem sem dados.

---

## 11. API First e Integrações

| Item | Complexidade |
|---|---|
| API interna (usada pelo próprio frontend) | 🟡 |
| API pública documentada | 🔴 |
| Integração com ERPs | 🔴 |
| Integração com CRMs externos | 🔴 |
| Integração com bancos | 🔴 |
| Integração com gateways de pagamento | 🟡 |
| Integração com seguradoras | 🔴 |
| Integração com plataformas de assinatura eletrônica | 🟡 |

---

## 12. White Label

| Item | Complexidade |
|---|---|
| Domínio próprio por tenant | 🟡 |
| Identidade visual (logo, cores) | 🟢 |
| Páginas públicas customizadas | 🟡 |
| Temas personalizados | 🟡 |

---

## 13. Modelo de Receita — Requisitos de Produto

Cada linha de receita implica funcionalidades específicas de produto, não só modelo de negócio:

| Fonte de receita | O que precisa existir no produto |
|---|---|
| Planos para corretores/imobiliárias/enterprise | Sistema de billing, cobrança recorrente, controle de limites por plano |
| Seguro-fiança / garantia locatícia | Parceria com seguradora + fluxo de contratação dentro do contrato |
| Análise de crédito | Integração com bureau de crédito (Serasa, Boa Vista etc.) |
| Processamento de pagamentos | Módulo financeiro (seção 8) |
| IA avançada como upsell | Feature flags por plano |
| Anúncios patrocinados | Sistema de destaque/ranking pago no marketplace |
| Geração de leads (venda de leads) | Sistema de distribuição/venda de leads entre tenants |
| White-label | Seção 12 |
| APIs corporativas | Seção 11, com controle de acesso e possivelmente billing por uso |

---

## 14. Mapa de Dependências (visão geral)

Alguns encadeamentos que valem considerar na hora de sequenciar:

1. **Multi-tenant + Autenticação** → tudo mais depende disso
2. **Entidade "imóvel" com múltiplos participantes** → decidir a modelagem cedo evita retrabalho, mesmo que a feature de compartilhamento venha depois
3. **CRM (pipeline)** → alimenta Contratos (proposta aceita vira contrato)
4. **Contratos** → alimenta Financeiro (contrato define valores e datas de cobrança) e Assinatura
5. **Financeiro** → pré-requisito para Split/Comissão automática e para Seguro-fiança
6. **Volume de uso real** → pré-requisito para os recursos de IA que dependem de dados históricos (preço, recomendação, classificação de leads)
7. **Multi-tenant corporativo (permissões, equipes)** → só é urgente quando o público for imobiliárias, não proprietários/corretores individuais
8. **White-label** → normalmente uma feature de retenção/upsell para tenants maiores, não um diferencial de aquisição inicial

---

## Como usar este documento

Para cada seção, você pode marcar prioridade (ex: v1/v2/v3/backlog) considerando:
- **Valor para o segmento que você quer atacar primeiro** (proprietário? corretor? imobiliária?)
- **Complexidade técnica** (🟢/🟡/🔴 acima)
- **Dependências** (seção 14)
- **Se a receita associada é viável antes de ter escala** (seção 13)

Posso ajudar a transformar isso num roadmap com fases específicas assim que você definir os critérios de priorização — ou já posso sugerir um agrupamento se quiser um ponto de partida.
