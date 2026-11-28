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

## Sessão no navegador e refresh tokens

O refresh token (30 dias) fica apenas no cookie criptografado do NextAuth. `/api/auth/session`
devolve só o access token curto; a renovação roda no servidor (`update({ refresh: true })` no
callback `jwt`) e o logout revoga o token por `POST /api/session/logout`.

O refresh token é de uso único, mas aceita **reapresentação por 20 segundos** depois da rotação
(`REFRESH_TOKEN_ROTATION_GRACE_SECONDS`). Isso cobre a corrida em que outra aba reescreve o cookie
com o token anterior (o `GET /api/auth/session` regrava o cookie a partir do que o navegador enviou).
Dentro da janela, o token antigo é rotacionado de novo a partir do seu substituto, que é revogado,
então só há um token vivo. Fora da janela, o reuso é rejeitado como antes. O logout feito com um
token recém-rotacionado revoga o substituto. A rotação guarda `rotatedAt` e `replacedById` em
`refresh_tokens`. Limitação conhecida: os tokens de administradores da plataforma ainda não têm a
janela de tolerância (acompanhamento).

**Exceção conhecida e aceita:** as respostas de `POST /auth/login`, `POST /platform/login` e da
confirmação de e-mail do cadastro ainda devolvem o refresh token no corpo, e o cliente o passa uma
vez ao provider `token-session` do NextAuth durante o login. Ele não fica na sessão exposta ao
JavaScript depois disso, mas um XSS durante o login poderia observá-lo. Acompanhamento: emitir a
sessão inteiramente no servidor (login e confirmação via Route Handler que grava o cookie), sem
devolver o refresh token ao navegador.

## Limites compartilhados

Todos os contadores da API usam a tabela `auth_rate_limit_buckets` existente. Os nomes das políticas
separam os orçamentos geral, autenticação, propostas por cliente e propostas por imóvel/contato.
A atualização por UPSERT é atômica entre instâncias e a expiração usa o relógio do PostgreSQL.

A recuperação de senha tem um orçamento próprio por cliente (`auth-password-recovery`),
com o mesmo limite e janela configurados em `AUTH_RATE_LIMIT_*`. Solicitar o código,
validá-lo e concluir a redefinição compartilham essa quota, inclusive em caminhos
codificados ou com barra final. Login, callbacks e renovação de sessão não a consomem;
o esgotamento da recuperação também não bloqueia o login. As proteções adicionais por
e-mail, o intervalo de reenvio e o limite de tentativas do código continuam valendo.

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

## Tentativas de códigos de 6 dígitos

Os códigos de recuperação de senha, de confirmação de e-mail no cadastro e de troca de e-mail
têm 6 dígitos e até 5 tentativas por código. Como um novo código pode ser pedido a cada 60 segundos,
esse contador sozinho permitia cerca de 5 palpites por minuto por e-mail, com rotação de IP.

Cada **falha** de confirmação (código errado, expirado ou inexistente) consome também um orçamento
cumulativo por e-mail, que **não é reiniciado quando o código é substituído ou reenviado**: 10
falhas por hora e 30 por dia, por fluxo (`PASSWORD_RESET`, `SIGNUP_VERIFICATION`, `EMAIL_CHANGE`).
Antes de verificar o código, o use-case apenas consulta o orçamento (sem gastá-lo); com o orçamento
esgotado, a confirmação retorna 429 (`RATE_LIMIT_EXCEEDED`) mesmo com um código novo e correto,
até a janela expirar. Confirmações bem-sucedidas nunca gastam orçamento, e um código correto
continua funcionando depois de falhas abaixo do limite. Na troca de e-mail a chave é o endereço de
destino do código, não o valor enviado pelo cliente, para que variar o campo não gere orçamentos
novos. Verificações concorrentes podem ultrapassar o limite em no máximo o número de requisições
simultâneas.

Os contadores usam a tabela `auth_rate_limit_buckets` (políticas `auth-code-attempts-hour` e
`auth-code-attempts-day`), com chave HMAC do e-mail normalizado (`AUTH_TOKEN_SECRET`), sem e-mail em
texto. Os limites podem ser ajustados com `AUTH_CODE_ATTEMPTS_HOURLY_LIMIT` e
`AUTH_CODE_ATTEMPTS_DAILY_LIMIT`.

Trade-off conhecido: quem conhece o e-mail de outra pessoa pode gastar o orçamento de falhas dela
com palpites errados e adiar a confirmação até a janela expirar (até 10 falhas por hora; o limite
por IP do proxy restringe o ritmo de cada origem, mas não impede vários IPs). O dano é uma espera,
não o acesso à conta. Não há como distinguir o dono de um atacante antes de checar o código sem
reabrir a força bruta, então o bloqueio vale também para o código correto.

## Enumeração de contas e imobiliárias

Decisão do produto (F-11): mitigar apenas o que é barato e manter a experiência de cadastro.

- **Cadastro:** continua informando "e-mail já em uso". Exigir verificação de e-mail antes de
  revelar isso prejudicaria o cadastro; o risco aceito é a confirmação de que um e-mail tem conta,
  limitado pelo orçamento de autenticação por cliente (`AUTH_RATE_LIMIT_*`).
- **Busca pública de imobiliárias (`GET /tenants/search`):** exige `q` com pelo menos 2 caracteres
  não vazios. Com `q` ausente, vazio ou curto, responde 200 com `tenants: []` (e não 400, para não
  quebrar o autocomplete do cadastro), de modo que a rota deixa de listar as imobiliárias sem
  critério. Com 2 ou mais caracteres, o limite de 20 resultados e os filtros de elegibilidade
  continuam. O cliente só consulta a API a partir de 2 caracteres.
- **Recuperação de senha (`POST /auth/password-reset-codes`):** a resposta é sempre 204 neutra e é
  enviada antes de consultar contas, gravar o código ou enviar o e-mail (`after()` do Next). O
  tempo de resposta deixa de depender de o e-mail existir, de estar em cooldown ou da latência do
  SES. Falhas ocorridas depois da resposta são registradas no Sentry sem PII, com limitação de taxa.

## Propostas públicas

O campo opcional `website` é um honeypot: o formulário o mantém vazio, fora da navegação e dos
leitores de tela. Preenchê-lo rejeita o envio antes de consultar o imóvel ou gravar uma proposta.

O orçamento adicional normaliza o e-mail com trim/lowercase e o associa ao imóvel. A reserva da
cota e a criação da oportunidade compartilham uma transação: falhas na criação não consomem uma
tentativa válida. Repetições acima do orçamento retornam 429 com `Retry-After`; não criam novas
oportunidades. Uma nova janela permite novos envios. Indisponibilidade da verificação impede a
criação da proposta com `INQUIRY_RATE_LIMIT_UNAVAILABLE`.
