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
