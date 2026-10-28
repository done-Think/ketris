# Infraestrutura — limite distribuído da API

Status: implementado em 27/10/2026 nesta refatoração; validação de staging pendente.

O limite geral de 300 requisições por minuto usa `PostgresRateLimitStore`, compartilhando a tabela
`auth_rate_limit_buckets` com políticas separadas para API, autenticação e propostas. Reinícios
do processo não descartam contadores. Falhas no armazenamento retornam 503 e `Retry-After`.

A autorização posterior para resolver as pendências incluiu essa infraestrutura compartilhada.
Concorrência, expiração e indisponibilidade são verificadas nos testes do store e do proxy.
Consulte [as políticas e configurações](../security-policies.md), incluindo a identificação confiável
do IP fora da Vercel. A distribuição foi validada com PostgreSQL local; o ambiente publicado ainda
precisa confirmar conexão, permissões, latência e configuração do proxy.
