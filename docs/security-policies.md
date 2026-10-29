# Políticas de administração, visibilidade pública e limites

Estas regras concretizam as recomendações da revisão na entrega de refatoração autorizada em
27/10/2026.

## Administração da plataforma

A plataforma mantém pelo menos um `ADMIN` ativo. Um administrador pode reduzir seu próprio papel
somente quando outro `ADMIN` ativo permanece. A proibição de autodesativação continua valendo.

Criação, edição e desativação passam pelo mesmo advisory lock transacional do PostgreSQL. A
autorização do ator é consultada novamente após o lock; a checagem HTTP anterior não autoriza uma
mutação se o papel ou a atividade do ator tiver mudado. Rebaixamento/desativação e revogação dos
refresh tokens ficam na mesma transação. O seed inicial continua responsável pelo bootstrap.

## Perfis públicos

Perfis de imobiliária aparecem somente com publicação `PUBLISHED` e tenant `ACTIVE` ou `TRIAL`.
Perfis de corretor exigem também usuário ativo, vínculo aprovado e papel `OWNER` ou `AGENT`.
Os mesmos predicados são usados nas listas, nos detalhes, na busca por slug, nas estatísticas de
corretores e no sitemap. Destaques da equipe excluem usuários inelegíveis na leitura pública;
o editor privado preserva a seleção existente.

Desativar/suspender esconde o perfil sem mudar seu estado de publicação. Reativar um perfil que
continuava publicado restaura sua visibilidade. Um rascunho não é publicado pela reativação.

Listas, detalhes e estatísticas públicas devolvem `Cache-Control: no-store`. Conteúdo já aberto em
uma aba muda no próximo refetch/recarregamento; essa política não afirma remoção instantânea do
estado já carregado pelo navegador.

## Limites compartilhados

Todos os contadores da API usam a tabela `auth_rate_limit_buckets` existente. Os nomes das políticas
separam os orçamentos geral, autenticação, propostas por cliente e propostas por imóvel/contato.
A atualização por UPSERT é atômica entre instâncias e a expiração usa o relógio do PostgreSQL.

| Configuração                                                                      | Padrão                                  |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| `API_RATE_LIMIT_MAX` / `API_RATE_LIMIT_WINDOW_MS`                                 | 300 por 60.000 ms                       |
| `AUTH_RATE_LIMIT_MAX` / `AUTH_RATE_LIMIT_WINDOW_MS`                               | 10 por 900.000 ms                       |
| `MARKETPLACE_INQUIRY_RATE_LIMIT_MAX` / `MARKETPLACE_INQUIRY_RATE_LIMIT_WINDOW_MS` | 5 por 600.000 ms por cliente            |
| `MARKETPLACE_CONTACT_INQUIRY_LIMIT` / `MARKETPLACE_CONTACT_INQUIRY_WINDOW_MS`     | 3 por 86.400.000 ms por imóvel e e-mail |

O proxy mantém os cabeçalhos `RateLimit-*` e `Retry-After`. Quando o armazenamento está indisponível,
recusa a operação com 503 e `Retry-After: 60`; autenticação conserva o código
`AUTH_RATE_LIMIT_UNAVAILABLE`, e as demais políticas retornam `API_RATE_LIMIT_UNAVAILABLE`.
Não há fallback para contadores locais que permitiriam contornar a cota entre instâncias.

Na Vercel, a identidade de rede usa `x-vercel-forwarded-for`. Em outro hosting, configure
`TRUSTED_CLIENT_IP_HEADER` apenas para um cabeçalho sobrescrito pelo proxy confiável, como
`CloudFront-Viewer-Address`. Cabeçalhos encaminhados não confiáveis não geram novas cotas.
Sem a configuração, todos compartilham o identificador `local`, adequado ao desenvolvimento.
Endereços IPv4/IPv6, inclusive com porta, são reconhecidos. As chaves persistidas usam HMAC com
`AUTH_TOKEN_SECRET`, sem registrar o IP ou o e-mail em texto nos contadores.

## Propostas públicas

O campo opcional `website` é um honeypot: o formulário o mantém vazio, fora da navegação e dos
leitores de tela. Preenchê-lo rejeita o envio antes de consultar o imóvel ou gravar uma proposta.

O orçamento adicional normaliza o e-mail com trim/lowercase e o associa ao imóvel. A reserva da
cota e a criação da oportunidade compartilham uma transação: falhas na criação não consomem uma
tentativa válida. Repetições acima do orçamento retornam 429 com `Retry-After`; não criam novas
oportunidades. Uma nova janela permite novos envios. Indisponibilidade da verificação impede a
criação da proposta com `INQUIRY_RATE_LIMIT_UNAVAILABLE`.
