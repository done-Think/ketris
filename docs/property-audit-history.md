# Histórico de alterações de imóveis

Em contas de imobiliária (`AGENCY`), corretores (`AGENT`) não podem despublicar imóveis, inclusive quando são os responsáveis principais. O detalhe e o menu da lista ocultam essa ação. A API rejeita a operação e também a inativação de imóveis publicados para impedir a retirada do anúncio por uma ação equivalente. A gestão conserva suas permissões. Corretores de contas independentes conservam o fluxo existente.

## Persistência e organização

O módulo `server/properties` mantém o domínio da comparação, schemas, types, porta, caso de uso e repositório de leitura. `property_audit_events` registra eventos com o imóvel e tenant, autor autenticado, nome e papel preservados, data e diferenças anteriores/novas. O corpo HTTP não escolhe o autor.

A criação, edição e mudança de status gravam o evento dentro da mesma transação do imóvel. A edição bloqueia a linha antes de ler o estado anterior, evitando comparações com dados ultrapassados em escritas concorrentes. Gravações sem diferença de negócio não produzem eventos de alteração. Timestamps e identificadores técnicos de mídia não são tratados como alterações do imóvel.

Transferências de carteira, regularização de proprietário pela manutenção e transições de contrato também registram suas mudanças no imóvel, reutilizando a mesma escrita de auditoria transacional. Esses eventos não mudam as permissões dos módulos de origem.

O nome e o papel do autor permanecem no evento se sua conta for removida; somente a referência opcional ao usuário é anulada. A exclusão do tenant ou do imóvel segue o ciclo de retenção do agregado e remove seus eventos. Não há API para editar ou excluir eventos individualmente. O caráter append-only é responsabilidade da aplicação, conforme o ADR-0006.

## Consulta e interface

- `GET /properties/{id}/history`: lista paginada com ação, autor, data e campos alterados.
- `GET /properties/{id}/history/{eventId}`: detalhes com os valores anteriores e posteriores.

As duas rotas reutilizam a autorização de acesso ao imóvel, filtram tenant e imóvel, e não expõem histórico a locatários. Corretores sem acesso, eventos de outros imóveis ou outras imobiliárias recebem resposta opaca. O frontend guarda o cache separado por tenant, usuário e papel.

`modules/properties` concentra componentes, services, hooks, types, estilos e traduções. Os eventos são clicáveis na aba de histórico. Cada clique abre somente a comparação do evento selecionado, com validação do identificador recebido e cache separado por evento. A comparação inclui valores, textos, endereço completo, referências com nomes e galeria ordenada com a capa. Os registros são paginados para conservar todo o histórico sem carregar todas as comparações na lista.

Os eventos detalhados e as datas anteriores do cadastro aparecem na mesma lista, seguindo o padrão visual do histórico. Nos registros interativos, ação e autor aparecem em destaque na primeira linha, com data e horário menores na linha abaixo; o conjunto abre somente a comparação daquele evento. O mesmo formato em duas linhas é usado no resumo informativo e na linha do tempo. Datas de referência sem auditoria permanecem informativas, sem autoria inventada nem um bloco separado; referências já representadas pelos eventos não são repetidas. Na lista paginada, as referências antigas aparecem ao final, e o quadro lateral “Atualizações recentes” mostra os três itens mais recentes apenas como texto, sem abrir detalhes por clique, com o botão “Exibir todo histórico” separado do quadro, logo abaixo e visível somente na aba Histórico. Esse botão abre uma consulta paginada com as comparações agrupadas por atualização, seus autores e datas. A linha do tempo lateral permite navegar até cada grupo de alterações e acompanha automaticamente o grupo alcançado pela rolagem das comparações. Não é possível reconstruir alterações que não foram registradas antes da ativação da auditoria.

## Migration e verificação

As condições de negociação selecionadas são auditadas separadamente da observação livre e exibidas com as mesmas traduções usadas no cadastro e na apresentação do imóvel.

`20261120090000_property_audit_history` adiciona uma tabela inicialmente vazia e índices, sem reescrever imóveis ou usuários. A compatibilidade está declarada em `infra/deploy/staging.json`. Sua aplicação em banco existente exige autorização específica. Retenha a tabela em rollback; versões antigas não acrescentam eventos.

Os testes unitários cobrem autorização, diferenças, preservação dos valores anteriores e o diálogo de consulta. Os testes de integração preparados cobrem persistência, isolamento, concorrência, rollback e conservação do nome do autor. Eles precisam de um banco local de testes com a migration aplicada.

O compartilhamento de imóveis da DTK-177 está integrado ao histórico. Corretores com vínculo adicional ativo podem consultar os eventos e suas próprias edições preservam a autoria. A gestão de vínculos, as transferências de carteira e as remoções por desativação ou mudança de papel registram os corretores com nomes preservados. Transferir apenas um vínculo adicional não inventa uma troca de responsável principal. As gravações revalidam o acesso dentro da transação; remover o vínculo também revoga a consulta ao histórico, e reativar a conta não restaura vínculos removidos. O fluxo de solicitações e aprovação mantido em stash é independente desta auditoria.
