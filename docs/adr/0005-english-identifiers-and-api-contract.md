# ADR-0005 — Identificadores em inglês e transição do contrato HTTP

Status: integrado à `dev`; schema e publicação coordenada validados no staging em 29/10/2026.

Data: 27/10/2026.

## Contexto

O schema, os repositórios e parte da API misturavam nomes em português e inglês. O escopo solicitado inclui renome físico e código, além dos schemas e consumidores do front. O schema de destino fornecido preserva os tipos e relações sob renome. Históricos guardam nomes e enums em arrays/JSON; abas e tokens anteriores podem continuar existindo após a publicação.

## Decisão

Usar os nomes do [glossário](../naming-glossary.md), com migration transacional de renome e atualização conjunta de Prisma Client, SQL cru, DTOs, Zod, OpenAPI, front, fixtures e seed. Preservar migrations aplicadas e todo conteúdo histórico. Interpretar nomes/status legados na apresentação dos históricos e ler os JWTs anteriores; novos tokens usam `role`.

O contrato HTTP em inglês é a versão 2, declarada por `X-Ketris-Api-Version: 2`. O proxy rejeita chamadas anteriores com `409 CLIENT_UPDATE_REQUIRED` antes do handler. O cliente não repete mutações rejeitadas. Os protocolos inalterados de NextAuth, mídia, documentação e saúde ficam fora dessa exigência. A aplicação anterior pode mostrar seu erro genérico; é necessário orientar o recarregamento durante a janela. Não se promete atualização automática de uma aba com código antigo.

O refinamento de respostas de oportunidades publica `ACCEPT`, `REJECT` e
`REQUEST_INFORMATION` no OpenAPI. A borda HTTP ainda aceita os três códigos anteriores,
normalizando apenas o campo `action`. Novos eventos usam os códigos atuais; o frontend
atualizado interpreta ambos os formatos de `systemAction`. Textos humanos e atividades
persistidas não são reescritos. As exceções da guarda ficam limitadas ao normalizador e aos
testes de compatibilidade. Sua remoção exige inventário dos consumidores; uma aba antiga
pode precisar de recarregamento para apresentar os novos rótulos da timeline.

Renome físico exige janela de publicação com instâncias anteriores drenadas, migration aplicada e promoção da aplicação compatível. A guarda HTTP não resolve divergência entre instância antiga e schema novo.

## Alternativas e consequências

Manter `@map` preservaria nomes físicos antigos, contrariando o escopo solicitado. Adaptar todos os DTOs e enums em duas direções sustentaria clientes antigos, com mais código temporário e risco de traduzir auditoria/texto livre. A atualização obrigatória limita essa manutenção e bloqueia a execução de operações incompatíveis, ao custo de exigir recarregamento e coordenação operacional.

Uma migration concluída é desfeita por nova migration compensatória e aplicação compatível; uma migration falha é conferida e reconciliada antes da nova execução. Ambos os caminhos são ensaiados, incluindo o próximo deploy. O [procedimento](../../apps/web/prisma/english-rename/README.md) contém os comandos para databases descartáveis e cópia do database local. Staging/produção continuam exigindo validação e janela próprias.

## Retirada da compatibilidade JWT

Reavaliado em 29/10/2026 (TD-39). A retirada depende de um inventário dos emissores e
consumidores de staging, incluindo deployments antigos ainda acessíveis e cookies NextAuth.
O access token emitido por `JoseTokenService` dura uma hora e a verificação não configura
tolerância de relógio. Isso não determina sozinho a validade dos cookies do NextAuth: a
sessão JWT usa o padrão de 30 dias da configuração instalada (`next-auth/core/init.js`) e pode ser renovada.

O responsável pela publicação deve registrar a última emissão possível do claim `papel`
por cada emissor e confirmar a retirada dos deployments anteriores. O primeiro instante
seguro para retirar o leitor de access tokens é a última emissão comprovada mais uma hora,
acrescida de qualquer tolerância futura. O leitor dos cookies só sai após expiração ou
migração comprovada de todas as sessões correspondentes. Refresh tokens opacos devem
continuar emitindo access tokens com `role`.

Ainda não existe evidência suficiente para fixar uma data de remoção. O parser continua
restrito às bordas documentadas, rejeita conflitos no access token e não amplia permissões.
O PR que o retirar deve atualizar a guarda e substituir os testes de aceitação legada por
testes de rejeição, preservando os leitores de auditoria, que têm outra finalidade.
