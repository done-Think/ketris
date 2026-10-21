# Eventos internos e destinatários da agenda

A imobiliária pode criar eventos com cliente ou internos, destinados a todos os corretores ou a um corretor ativo e aprovado do mesmo tenant. Eventos internos dispensam imóvel, cliente e telefone; ficam visíveis apenas para a imobiliária e os corretores destinatários. A gestão de eventos internos e coletivos é exclusiva da imobiliária.

O responsável existente identifica o corretor em eventos direcionados. A opção coletiva usa o papel AGENT no momento da consulta, incluindo novos corretores sem duplicar eventos nem gravar uma cópia por usuário.

A migration `20261020170000_add_agenda_event_audience` adiciona destino e indicador de evento interno. O valor `LEGACY_TEAM` preserva a visibilidade dos registros anteriores. A migration deve ser aplicada antes de executar o código atualizado; não é aplicada pelo build ou pelo Prisma generate.

Leitura e alterações são protegidas na API. A imobiliária permanece limitada ao próprio tenant. Corretores não podem redirecionar eventos ou modificar eventos internos/coletivos. Proprietários e renters não recebem eventos internos, mesmo quando houver vínculo antigo. Para eventos novos com cliente, proprietários consultam os vinculados a eles ou aos seus imóveis; renters continuam dependentes de vínculo explícito.

Edição de dados, destinatários e horário usa uma única atualização transacional. As verificações de conflito continuam por responsável, como nos eventos anteriores; um evento coletivo não reserva individualmente a disponibilidade de cada corretor.

Visitas têm duração mínima de 30 minutos. Para imóveis vinculados pelo ID, a reserva do imóvel é exclusiva durante toda a visita, entre todos os corretores do tenant. O fim libera imediatamente a próxima visita, sem intervalo adicional. Outros tipos de evento não recebem esse bloqueio por imóvel. Referências livres não identificam um imóvel de forma confiável e não participam desse bloqueio. A conferência usa uma trava transacional por tenant e imóvel, incluindo criação, edição, mudança de tipo e reagendamento, para impedir reservas simultâneas.

O período comercial de referência é 08h–18h em America/Sao_Paulo. Um período fora desse intervalo, inclusive quando começa dentro e termina fora ou atravessa a meia-noite, exige confirmação no toast antes de salvar. Continuar envia `outsideBusinessHoursConfirmed: true`; Voltar preserva o formulário sem gravação. Criação e alteração do período sem confirmação retornam 409 com `AGENDA_OUTSIDE_BUSINESS_HOURS`. Alterar apenas os dados de um período já salvo não exige nova confirmação. A antecedência mínima de três horas continua obrigatória para um novo início.

O calendário divide eventos que atravessam a meia-noite entre os dias correspondentes e amplia a grade aos horários visíveis. Cards que se sobrepõem recebem deslocamentos laterais; hover e foco pelo teclado destacam o card e expandem o texto sobre um fundo opaco. A lista mobile permanece separada por evento.
