# Infraestrutura — limite distribuído da API

Status: implementado em 27/10/2026; conexão básica do ambiente publicado exercitada na release
de staging de 29/10. Ensaio controlado de carga/latência e múltiplas instâncias do hosting pendente.

O limite geral de 300 requisições por minuto usa `PostgresRateLimitStore`, compartilhando a tabela
`auth_rate_limit_buckets` com políticas separadas para API, autenticação e propostas. Reinícios
do processo não descartam contadores. Falhas no armazenamento retornam 503 e `Retry-After`.

A autorização posterior para resolver as pendências incluiu essa infraestrutura compartilhada.
Concorrência, expiração e indisponibilidade são verificadas nos testes do store e do proxy.
Consulte [as políticas e configurações](../security-policies.md), incluindo a identificação confiável
do IP fora da Vercel. Concorrência e distribuição foram validadas com PostgreSQL local. A
[release 40874916469](https://github.com/done-Think/ketris/actions/runs/40874916469) conferiu
banco, estatísticas e login no domínio publicado, exercitando os contadores. Isso não substitui
medição de latência, limitação sob carga ou prova de múltiplas instâncias do hosting.

## Refinamento TD-36 (29/10/2026)

A quota continua sendo uma escrita atômica compartilhada por requisição. A limpeza saiu de
`consume`: o proxy a agenda com `after`, sem aguardar sua conclusão para liberar a rota.
No ciclo do Proxy do Next.js, o callback pode começar enquanto a rota ainda produz a resposta.
Cada ciclo remove lotes de
100 linhas, com `FOR UPDATE SKIP LOCKED`, até dez lotes ou um segundo entre consultas. A
condição de expiração também é revalidada no DELETE para preservar contadores renovados.
Uma consulta em andamento pode ultrapassar esse orçamento; ele limita o início dos lotes.

Ciclos drenados aguardam 60 segundos; um lote cheio no limite permite nova tentativa em um
segundo; falhas de limpeza são registradas e tentadas novamente em cinco segundos. A quota
indisponível continua bloqueando a requisição com 503. O nome físico da tabela foi mantido
para evitar DDL sem benefício funcional. Sem tráfego não há crescimento por novas chaves;
o processamento é oportunista e sua capacidade agregada ainda exige medição no hosting.

O proxy publica `Server-Timing: rate-limit;dur=...`, medindo a consulta do contador e excluindo
a manutenção agendada. Use `node scripts/measure-staging-rate-limit.mjs 20` para uma
amostra anônima sequencial, com intervalo e limite de 60 requisições. O script retorna SHA,
p50/p95 HTTP e p50/p95 do contador quando o artefato instrumentado estiver publicado.

Referência anterior à alteração, SHA `87ead6ce`, 29/10/2026 às 13:26 (São Paulo): 20 respostas
200 em `/api/auth/session`, concorrência 1; HTTP p50 441,71 ms, p95 2.212,11 ms e máximo
7.750,96 ms. Essa amostra inclui rede, possíveis partidas frias e contenção no cliente durante validações locais; a versão não tinha a métrica
do contador. Não permite atribuir a latência ao PostgreSQL nem provar ganho deste refinamento.
Repetir após a publicação, separando aquecimento, carga e número de instâncias.
