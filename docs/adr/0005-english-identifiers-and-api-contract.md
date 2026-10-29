# ADR-0005 — Identificadores em inglês e transição do contrato HTTP

Status: renome integrado à `dev` e validado em staging; retirada dos formatos legados preparada
na branch `fix/staging-readiness`, com contrato HTTP v3, ainda aguardando publicação.

Data: 27/10/2026.

## Contexto

O schema, os repositórios e parte da API misturavam nomes em português e inglês. O escopo solicitado inclui renome físico e código, além dos schemas e consumidores do front. O schema de destino fornecido preserva os tipos e relações sob renome. Históricos guardam nomes e enums em arrays/JSON; abas e tokens anteriores podem continuar existindo após a publicação.

## Decisão

Usar os nomes do [glossário](../naming-glossary.md), com migration transacional de renome e atualização conjunta de Prisma Client, SQL cru, DTOs, Zod, OpenAPI, front, fixtures e seed. Preservar migrations aplicadas e todo conteúdo histórico. Interpretar nomes/status legados na apresentação dos históricos. A leitura temporária dos JWTs anteriores termina pelo corte descrito abaixo; tokens canônicos usam `role`.

O contrato HTTP em inglês foi introduzido na versão 2. O corte dos formatos legados passa
a exigir `X-Ketris-Api-Version: 3`, com OpenAPI `3.0.0`, frontend e smoke de publicação
atualizados juntos. O proxy rejeita chamadas sem versão ou de versões anteriores com
`409 CLIENT_UPDATE_REQUIRED` antes do handler. O cliente exige recarregamento e não repete
mutações rejeitadas. NextAuth, mídia, documentação e saúde conservam as exceções documentadas.

O refinamento de respostas de oportunidades publica `ACCEPT`, `REJECT` e
`REQUEST_INFORMATION` no OpenAPI. Na versão 3, a borda HTTP aceita somente esses códigos.
Novos eventos usam os códigos atuais; a apresentação dos históricos continua interpretando
ambos os formatos de `systemAction`. Textos humanos e atividades persistidas permanecem
intactos. As exceções da guarda se limitam ao leitor histórico e aos testes de rejeição.

Renome físico exige janela de publicação com instâncias anteriores drenadas, migration aplicada e promoção da aplicação compatível. A guarda HTTP não resolve divergência entre instância antiga e schema novo.

## Alternativas e consequências

Manter `@map` preservaria nomes físicos antigos, contrariando o escopo solicitado. Adaptar todos os DTOs e enums em duas direções sustentaria clientes antigos, com mais código temporário e risco de traduzir auditoria/texto livre. A atualização obrigatória limita essa manutenção e bloqueia a execução de operações incompatíveis, ao custo de exigir recarregamento e coordenação operacional.

Uma migration concluída é desfeita por nova migration compensatória e aplicação compatível; uma migration falha é conferida e reconciliada antes da nova execução. Ambos os caminhos são ensaiados, incluindo o próximo deploy. O [procedimento](../../apps/web/prisma/english-rename/README.md) contém os comandos para databases descartáveis e cópia do database local. Staging/produção continuam exigindo validação e janela próprias.

## Retirada da compatibilidade JWT

Em 29/10/2026, o responsável confirmou que somente o site Ketris consome a API do staging.
Para esse ambiente de dados fictícios, a estratégia passa a ser um corte explícito, com
recarregamento de abas e novo login para sessões dependentes do claim aposentado.

Access tokens de tenant exigem `role`, `sub`, `tenantId` e `exp`; `sessionVersion` ausente continua
equivalendo a zero, e `iat` permanece opcional. O parser rejeita campos fora do formato emitido
pelo serviço, incluindo tokens mistos com `papel`. A assinatura HS256 e a expiração de uma
hora conservam suas verificações. Refresh tokens válidos continuam emitindo claims canônicos.

Cookies NextAuth de tenant sem `role` válido perdem o escopo e os tokens de acesso e exigem novo login.
Sessões canônicas continuam sujeitas à revalidação do usuário, vínculo e versão de sessão.
A expiração completa das sessões antigas deixa de ser um gate: o corte rejeita esses formatos
explicitamente. Esse comportamento substitui a proposta anterior de aguardar sua expiração;
o prazo padrão renovável de 30 dias do NextAuth não é usado como prova de encerramento.

A guarda permite o nome aposentado somente nas regressões de rejeição, incluindo a fixture
de cookie criptografado restrita à aplicação e ao banco locais isolados. Leitores de auditoria
e de históricos permanecem por sua finalidade própria. Nenhuma migration ou reescrita de dados
acompanha essa alteração. A aplicação publicada ainda anuncia a versão 2 até a integração,
o CI e a promoção do novo artefato.
