# Infraestrutura — limite distribuído da API

Status: implementado em 27/10/2026; versão instrumentada publicada em 29/10 no SHA `4105c505`.
Amostra sequencial e exploração limitada concluídas. Carga representativa, critérios de aceite
e comprovação de múltiplas instâncias do hosting permanecem pendentes.

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

## Medições após a publicação — 29/10/2026

Às 21:04 (São Paulo), 20 respostas 200 em `/api/auth/session`, concorrência 1, no SHA `4105c505`:
HTTP p50 343,37 ms, p95 428,12 ms e máximo 2.532,43 ms; contador p50 113,27 ms,
p95 127,22 ms e máximo 1.162,26 ms. A amostra anterior tinha condições diferentes e não
permite atribuir ganho de desempenho à alteração.

O responsável informou que ainda não há estimativa de usuários simultâneos. Às 21:16, foi
executado um cenário exploratório no mesmo SHA, alternando GETs anônimos em
`/api/auth/session` e `/api/marketplace/stats`:

| Fase                   | Requisições | Pico de chamadas em voo |  HTTP p50 | HTTP p95/máximo | Contador p50 | Contador p95/máximo |
| ---------------------- | ----------: | ----------------------: | --------: | --------------: | -----------: | ------------------: |
| Aquecimento solicitado |           5 |                       1 | 391,94 ms |     4.544,80 ms |    117,66 ms |         1.288,73 ms |
| Sequencial             |          10 |                       1 | 331,91 ms |       452,00 ms |    117,58 ms |           135,87 ms |
| Paralelo 2             |          10 |                       2 | 427,88 ms |     1.958,27 ms |    117,85 ms |         1.193,06 ms |
| Paralelo 5             |          10 |                       5 | 492,76 ms |     2.426,25 ms |    117,70 ms |         1.291,95 ms |

As 35 respostas foram 200. O menor saldo observado foi de 265, para limite de 300 por minuto.
Nessas amostras pequenas, o p95 coincide com o máximo de cada fase. Os picos exigem investigação
correlacionada com telemetria do hosting/banco; não comprovam partidas frias nem sua causa.
Chamadas simultâneas no cliente não equivalem a usuários simultâneos, e não houve identificação
das instâncias atendentes. A fase de aquecimento também não garante reutilização das mesmas
instâncias nas fases seguintes. Capacidade e SLO permanecem sem avaliação.

Para repetir esse cenário:

```bash
node scripts/explore-staging-rate-limit.mjs > /tmp/ketris-staging-exploration.json
```

O script confere o destino de staging e o contrato do OpenAPI local, fixa o SHA da primeira
resposta e exige a telemetria do contador. Executa no máximo 35 GETs, em ondas de até cinco,
com 500 ms entre ondas e dois segundos entre fases. Para ao observar erro, mudança de SHA,
telemetria inválida ou menos de 60 requisições restantes. Até quatro chamadas da onda atual
podem já estar em voo; as demais são canceladas e nenhuma onda seguinte começa. Não há retries.
O JSON mantém observações parciais e o motivo da interrupção; o processo sai com código 1.

O CI valida o script com transporte simulado, sem disparar esse tráfego no staging. Restam
definir a demanda e critérios de aceite, ampliar a duração/amostragem conforme esse plano,
comprovar distribuição entre instâncias e verificar comportamento sob saturação, falha e
acúmulo/limpeza dos contadores no hosting.
