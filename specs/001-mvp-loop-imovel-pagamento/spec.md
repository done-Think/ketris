# Feature Specification: Loop Mínimo de Valor — Cadastro a Primeiro Pagamento

**Feature Branch**: `001-mvp-loop-imovel-pagamento`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "Loop mínimo de valor da Ketris: proprietário ou corretor cadastra um imóvel,
publica no marketplace, recebe e aceita uma proposta de um locatário ou comprador, o sistema gera um
contrato residencial, as partes assinam digitalmente, e a primeira cobrança é registrada e paga."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cadastrar e publicar um imóvel (Priority: P1)

Um proprietário ou corretor autenticado cadastra um imóvel (dados, endereço, características, fotos e
valores) e o publica no marketplace público para que fique visível a interessados.

**Why this priority**: Sem um imóvel publicado não existe nenhum outro passo do loop — é o ponto de
entrada de valor de toda a plataforma.

**Independent Test**: Pode ser testado sozinho fazendo login como corretor, cadastrando um imóvel completo
e verificando que ele aparece na busca pública do marketplace com status "Disponível".

**Acceptance Scenarios**:

1. **Given** um corretor autenticado sem imóveis cadastrados, **When** ele preenche o cadastro (dados,
   endereço, características, ao menos uma foto, valores) e confirma a publicação, **Then** o imóvel passa
   a existir com status "Publicado" e aparece na busca pública do marketplace.
2. **Given** um imóvel em rascunho (dados incompletos), **When** o usuário tenta publicar, **Then** o
   sistema impede a publicação e indica quais campos obrigatórios faltam.
3. **Given** um imóvel já publicado, **When** o proprietário/corretor o despublica, **Then** ele deixa de
   aparecer na busca pública mas permanece acessível na área autenticada.

---

### User Story 2 - Descobrir o imóvel e enviar uma proposta (Priority: P2)

Um interessado (locatário ou comprador) encontra o imóvel publicado no marketplace público e envia uma
proposta de interesse, que chega ao proprietário/corretor como um novo lead no CRM.

**Why this priority**: É a primeira validação de que o imóvel publicado gera demanda real; sem uma
proposta não há o que negociar ou contratar.

**Independent Test**: Pode ser testado sozinho acessando o marketplace público sem login, abrindo o
detalhe de um imóvel publicado, enviando uma proposta com dados de contato, e conferindo que ela aparece
como um novo lead/oportunidade na área do corretor/proprietário.

**Acceptance Scenarios**:

1. **Given** um imóvel publicado, **When** um visitante abre o detalhe do imóvel e envia uma proposta com
   seus dados de contato, **Then** uma nova oportunidade é criada e associada ao imóvel, visível para o
   proprietário/corretor.
2. **Given** uma proposta recebida, **When** o proprietário/corretor a visualiza, **Then** ele consegue ver
   os dados do interessado e o imóvel de interesse, e registrar uma interação (aceitar, recusar, ou pedir
   mais informações).
3. **Given** um imóvel despublicado, **When** um visitante tenta acessar sua página de detalhe, **Then** o
   sistema informa que o imóvel não está mais disponível e não permite envio de proposta.

---

### User Story 3 - Aceitar a proposta e gerar o contrato (Priority: P3)

O proprietário/corretor aceita uma proposta recebida e o sistema gera um contrato residencial a partir dos
dados já conhecidos (imóvel, partes, valores), pronto para assinatura.

**Why this priority**: Formaliza a negociação em um documento — sem isso a proposta aceita não vira uma
relação contratual válida.

**Independent Test**: Pode ser testado sozinho a partir de uma proposta já aceita, gerando o contrato pelo
formulário guiado e conferindo que o documento resultante contém corretamente as partes, o imóvel e os
valores acordados.

**Acceptance Scenarios**:

1. **Given** uma proposta aceita pelo proprietário/corretor, **When** ele inicia a geração do contrato,
   **Then** o sistema pré-preenche o contrato com os dados do imóvel, das partes e do valor acordado.
2. **Given** um contrato gerado, **When** o proprietário/corretor revisa e confirma, **Then** o contrato
   fica com status "Aguardando assinatura" e as partes são notificadas.
3. **Given** dados obrigatórios ausentes (ex.: documento de uma das partes), **When** o usuário tenta
   confirmar o contrato, **Then** o sistema impede a confirmação e indica o que falta.

---

### User Story 4 - Assinar o contrato e registrar o primeiro pagamento (Priority: P4)

As partes assinam o contrato digitalmente e, uma vez assinado, a primeira cobrança prevista no contrato é
registrada e seu pagamento é confirmado.

**Why this priority**: Fecha o loop mínimo de valor — é o momento em que a negociação se torna receita
real, o objetivo final de todo o funil.

**Independent Test**: Pode ser testado sozinho a partir de um contrato "Aguardando assinatura", simulando a
assinatura de cada parte e conferindo que, ao completar todas as assinaturas, uma cobrança é criada e pode
ser marcada como paga.

**Acceptance Scenarios**:

1. **Given** um contrato aguardando assinatura, **When** todas as partes assinam digitalmente, **Then** o
   contrato passa para status "Ativo" e a primeira cobrança prevista é criada automaticamente.
2. **Given** uma cobrança criada, **When** o pagamento é confirmado, **Then** a cobrança passa para status
   "Paga" e o proprietário/corretor consegue ver esse registro no painel financeiro.
3. **Given** um contrato com apenas parte das assinaturas coletadas, **When** uma das partes consulta o
   status, **Then** o sistema mostra claramente quem já assinou e quem está pendente.

---

### Edge Cases

- O que acontece quando duas propostas são enviadas para o mesmo imóvel ao mesmo tempo? Ambas devem ser
  registradas como oportunidades distintas; a aceitação de uma não exclui a outra automaticamente — o
  proprietário/corretor decide o que fazer com as demais.
- Como o sistema trata um imóvel despublicado enquanto há uma proposta em negociação? A negociação em
  andamento continua válida; apenas novas propostas via marketplace público deixam de ser possíveis.
- O que acontece se uma das partes não assinar o contrato dentro do prazo esperado? O contrato permanece
  em "Aguardando assinatura" indefinidamente nesta versão; lembretes automáticos e expiração de prazo estão
  fora do escopo deste loop mínimo (ver Assumptions).
- Como o sistema lida com falha no pagamento da primeira cobrança? A cobrança permanece com status
  diferente de "Paga" e fica visível como pendente/inadimplente no painel financeiro; nova tentativa de
  pagamento é responsabilidade do usuário nesta versão.
- O que acontece se o proprietário/corretor tentar gerar um contrato sem nenhuma proposta aceita? O sistema
  impede a criação de um contrato sem uma proposta/oportunidade de origem associada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um proprietário ou corretor autenticado cadastre um imóvel com
  dados básicos, endereço, características, ao menos uma foto e valores.
- **FR-002**: O sistema MUST impedir a publicação de um imóvel com campos obrigatórios ausentes.
- **FR-003**: O sistema MUST exibir, na busca pública do marketplace, apenas imóveis com status
  "Publicado".
- **FR-004**: O sistema MUST permitir publicar e despublicar um imóvel a qualquer momento pelo
  proprietário/corretor responsável.
- **FR-005**: O sistema MUST permitir que qualquer visitante (sem necessidade de login) envie uma proposta
  de interesse a partir do detalhe de um imóvel publicado.
- **FR-006**: O sistema MUST criar uma oportunidade/lead vinculada ao imóvel e ao interessado sempre que
  uma proposta for enviada.
- **FR-007**: O sistema MUST permitir ao proprietário/corretor visualizar e responder (aceitar, recusar ou
  solicitar mais informações) a cada proposta recebida.
- **FR-008**: O sistema MUST permitir gerar um contrato residencial a partir de uma proposta aceita,
  pré-preenchido com imóvel, partes e valor acordado.
- **FR-009**: O sistema MUST impedir a confirmação de um contrato quando dados obrigatórios das partes
  estiverem ausentes.
- **FR-010**: O sistema MUST permitir que cada parte do contrato realize sua assinatura digital de forma
  independente e MUST mostrar o status de assinatura por parte (pendente/assinado).
- **FR-011**: O sistema MUST alterar o status do contrato para "Ativo" somente quando todas as partes
  tiverem assinado.
- **FR-012**: O sistema MUST criar automaticamente a primeira cobrança prevista assim que o contrato ficar
  "Ativo".
- **FR-013**: O sistema MUST permitir registrar a confirmação de pagamento de uma cobrança e refletir esse
  status no painel financeiro do proprietário/corretor.
- **FR-014**: O sistema MUST impedir a criação de um contrato que não esteja associado a uma proposta ou
  oportunidade previamente aceita.

### Key Entities

- **Imóvel**: representa uma propriedade anunciável — dados básicos, endereço, características, mídia,
  valores e status (rascunho, publicado, despublicado). Pertence a um proprietário/corretor responsável.
- **Oportunidade/Proposta**: representa o interesse de uma pessoa em um imóvel — dados de contato do
  interessado, imóvel relacionado, status (nova, em negociação, aceita, recusada).
- **Contrato**: representa o acordo formal entre as partes sobre um imóvel — partes envolvidas, valor,
  status (rascunho, aguardando assinatura, ativo), origem (a oportunidade/proposta que o gerou).
- **Assinatura**: representa o compromisso de uma parte específica com o contrato — quem assina, quando, e
  se está pendente ou concluída.
- **Cobrança**: representa um valor a receber previsto pelo contrato — valor, vencimento, status
  (pendente, paga, atrasada), contrato de origem.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um proprietário ou corretor consegue cadastrar e publicar um imóvel em menos de 10 minutos
  na primeira tentativa.
- **SC-002**: Um visitante consegue encontrar um imóvel publicado e enviar uma proposta em menos de 3
  minutos, sem precisar criar conta previamente.
- **SC-003**: 100% das propostas enviadas geram uma oportunidade visível ao proprietário/corretor em até
  1 minuto.
- **SC-004**: Um contrato gerado a partir de uma proposta aceita reflete corretamente as partes, o imóvel e
  o valor acordado em 100% dos casos, sem necessidade de reentrada manual desses dados.
- **SC-005**: O tempo entre a conclusão da última assinatura e a criação automática da primeira cobrança é
  imediato (sem intervenção manual).
- **SC-006**: Um usuário completa o loop inteiro — do cadastro do imóvel à confirmação do primeiro
  pagamento — sem sair da plataforma em nenhum momento.

## Assumptions

- O interessado que envia uma proposta não precisa necessariamente ter conta na plataforma; a criação de
  conta formal (com seleção de perfil) pode acontecer em um momento posterior do fluxo, fora deste loop
  mínimo.
- Este loop cobre apenas o fluxo de locação/venda residencial com uma única parte proprietária e um único
  interessado — compartilhamento de imóvel com múltiplos participantes (seção 5 do planejamento de
  produto) está fora de escopo aqui.
- A assinatura digital é tratada como uma ação de confirmação por parte (sem detalhar aqui qual provedor de
  assinatura eletrônica é usado — isso é uma decisão de implementação, não de especificação).
- O pagamento da primeira cobrança é tratado como um evento de confirmação (sem detalhar aqui o meio de
  pagamento específico — PIX, boleto ou cartão — isso é uma decisão de implementação).
- Lembretes automáticos, expiração de prazo de assinatura e cobrança recorrente (reajustes, parcelas
  futuras) estão fora do escopo deste loop mínimo — o foco é validar a primeira cobrança apenas.
- Distribuição automática de leads e classificação por IA (recursos de fase posterior, ver
  `docs/planejamento-produto.md`) não fazem parte deste loop.
