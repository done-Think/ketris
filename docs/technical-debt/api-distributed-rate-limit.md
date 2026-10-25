# Infraestrutura — limite distribuído da API

Status: débito técnico registrado por decisão do produto em 25/10/2026, durante a revisão de Agenda (T23).

O limite geral de 300 requisições por minuto ainda usa contadores em memória de cada processo.
Instâncias diferentes não compartilham essa cota e reinícios descartam os contadores. Os limites
sensíveis de Auth já usam PostgreSQL; essa proteção permanece ativa.

A correção do limite geral deve ter uma branch própria de infraestrutura, pois afeta todas as rotas
da API. Deve definir o armazenamento compartilhado e o comportamento em indisponibilidade,
preservar os cabeçalhos e as configurações públicas, e validar concorrência entre instâncias,
expiração e identificação confiável do cliente. A decisão de escopo não encerra T23 globalmente.
