# Instagram: conexão pessoal por tenant e publicação de imóveis

Requisitos conferidos na documentação oficial em 23/10/2026. Fluxo escolhido:
Instagram API **with Instagram Login**, não Facebook Login nem Instagram Basic Display.

## Escopo e arquitetura

- A conexão é pessoal: uma conta profissional por usuário dentro do tenant. A mesma
  conta Instagram não pode ficar conectada a dois usuários/tenants simultaneamente.
- Perfis de negócio: ADMIN anuncia qualquer imóvel do tenant; AGENT anuncia apenas
  imóveis em que é o representante; OWNER anuncia apenas seus próprios imóveis.
- Correspondência técnica atual, sem renomeação global: ADMIN de negócio é o papel
  persistido OWNER; proprietário/OWNER de negócio é PROPERTY_OWNER; corretor é AGENT.
  As permissões reutilizam as políticas de auth, sem aceitar ADMIN como alias de token.
- O vínculo do corretor usa Imovel.responsavelId e o do dono usa proprietarioId. A origem
  da representação pode ser a imobiliária ou o proprietário; solicitar/aceitar/alterar
  essa representação é um fluxo separado. Não há novos vínculos automáticos.
- A conexão fica em Meu Perfil e também no detalhe do imóvel. Cada usuário publica
  somente na própria conta, com revisão de fotos, ordem e legenda.
- `src/server/instagram`: casos de uso dependem de ports; Prisma, Meta, criptografia e
  preparação das imagens ficam em infrastructure; `container.ts` monta as dependências.
- Tipos ficam em `types`. Conexão/editor reutilizáveis ficam em `shared`, sem importação
  entre módulos do frontend. A interface usa MUI, tokens, React Hook Form e next-intl.
- Na última etapa do cadastro, a opção de marketplace agora chama a publicação do imóvel
  após sua criação. A opção de Instagram abre a revisão de seleção, ordem e legenda.
- O detalhe do imóvel permite acompanhar o resultado e revisar um novo envio quando
  ainda não existe publicação ou quando uma tentativa falhou antes da confirmação.
- A publicação no site é independente. Falha de OAuth, banco da integração ou Meta não
  desfaz nem despublica um imóvel que já foi publicado no site.
- Primeiro escopo: fotos, uma imagem ou carrossel, sem Reels, vídeos, Stories ou anúncios.

## Requisitos atuais da Meta

- Conta Instagram profissional Business ou Creator; Instagram Login não exige uma Página
  do Facebook vinculada. A conta adicionada para teste deve ser pública.
- Escopos: `instagram_business_basic` e `instagram_business_content_publish`.
  Não solicitar permissões de mensagens, comentários, insights ou Facebook Pages para
  este fluxo. Não usar os antigos escopos `business_basic`/`business_content_publish`.
- Código OAuth de uso único trocado exclusivamente no backend. Token longo tem validade
  aproximada de 60 dias, conforme `expires_in`; pode ser renovado depois de 24 horas,
  enquanto ainda válido. Expirado ou revogado, exige nova autorização.
- Host de publicação: `graph.instagram.com`. Criar os contêineres em `/{id}/media`,
  verificar `status_code`, confirmar em `/{id}/media_publish` e guardar o ID retornado.
- Imagens JPEG, até 8 MB, proporção entre 4:5 e 1,91:1. A referência atual permite até
  20 itens no carrossel. Legenda limitada a 2.200 caracteres nesta implementação.
- A Meta precisa baixar as imagens sem login no Ketris. O backend lê somente fotos do
  imóvel autorizado no S3 e prepara cópias sRGB JPEG de 1080x1080, com margens brancas,
  sem recortar o imóvel nem modificar os originais. Links assinados duram 48 horas.
- Os documentos atuais têm números diferentes para alguns limites gerais/carrosséis.
  Por isso o código consulta `content_publishing_limit` e não fixa uma cota diária.

Fontes oficiais:

- [Criação do aplicativo](https://developers.facebook.com/documentation/instagram-platform/create-an-instagram-app)
- [Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/)
- [Login empresarial e tokens](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
- [Publicação de conteúdo](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/)
- [Referência de mídia](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)
- [App Review](https://developers.facebook.com/docs/instagram-platform/app-review/)
- [Versões Graph API](https://developers.facebook.com/docs/graph-api/changelog/)

## Configurar o aplicativo no Meta for Developers

1. Acesse `https://developers.facebook.com/apps/` com a conta responsável da equipe e
   crie um aplicativo. No assistente descrito pela Meta: **Outro → Empresa/Business**;
   preencha o nome e e-mail de contato e associe o portfólio empresarial quando solicitado.
   Se o painel mostrar outro assistente, selecione o caso de uso que disponibiliza
   Instagram e confirme que o produto permite **API setup with Instagram Login**.
2. Adicione o produto **Instagram**. Abra **Instagram → Configuração da API com login do
   Instagram**. Não configure este código com credenciais de Facebook Login.
3. Solicite apenas as duas permissões acima. Remova as permissões recomendadas de
   mensagens/comentários/insights que o assistente eventualmente selecionar.
4. Em **Adicionar conta**, adicione `@monkeystecnologia`, confirme que é profissional
   e pública e conclua o login/convite indicado pelo painel. Para desenvolvimento,
   adicione a equipe às funções/testadores apropriados e aceite os convites pendentes.
   A senha dessa conta nunca é digitada no Ketris.
5. Em **Configurar login da empresa no Instagram → Configurações de login da empresa**,
   copie o **Instagram App ID** e o **Instagram App Secret** para o ambiente do backend.
   Esses dados podem diferir do ID/secret geral exibido em outra seção do aplicativo.
6. Cadastre exatamente estes endereços:

   | Configuração                     | URL inicial                                                       |
   | -------------------------------- | ----------------------------------------------------------------- |
   | URI de redirecionamento OAuth    | `https://ketris-web-x9bk.vercel.app/api/instagram/oauth/callback` |
   | Retorno de desautorização        | `https://ketris-web-x9bk.vercel.app/api/instagram/deauthorize`    |
   | Solicitação de exclusão de dados | `https://ketris-web-x9bk.vercel.app/api/instagram/data-deletion`  |

7. Em configurações básicas, informe domínio `ketris-web-x9bk.vercel.app`, e-mail de
   contato e URL pública da política de privacidade aprovada pela empresa. Preencha as
   informações adicionais exigidas pelo painel. O projeto não cria texto jurídico nem
   inventa uma política de privacidade. A rota de exclusão retorna URL de acompanhamento
   e código de confirmação; as requisições precisam da assinatura válida da Meta.
8. Para publicar fotos com consulta de status, não é necessário assinar webhooks de
   mensagens/comentários. O retorno OAuth não é um webhook. Se esses produtos forem
   adicionados depois, terão configuração e permissões próprias.
9. Mantenha o aplicativo em **Development** no teste inicial. Use a conta adicionada e
   Standard Access. Não marque o app como pronto para atender clientes antes da análise.

## Variáveis de ambiente

Todas as variáveis `INSTAGRAM_*` e `CRON_SECRET` são do servidor, sem `NEXT_PUBLIC_`.
O arquivo `.env.example` não contém tokens ou segredos reais.

| Variável                         | Valor/finalidade                                                                   |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `INSTAGRAM_ENABLED`              | `false` por padrão; `true` somente depois da migration/configuração                |
| `INSTAGRAM_APP_ID`               | Instagram App ID do painel                                                         |
| `INSTAGRAM_APP_SECRET`           | Instagram App Secret, no cofre de segredos do ambiente                             |
| `INSTAGRAM_GRAPH_API_VERSION`    | `v26.0`, versão atual consultada; revisar a política de versões antes de atualizar |
| `INSTAGRAM_REDIRECT_URI`         | Callback OAuth exato da tabela anterior                                            |
| `INSTAGRAM_PUBLIC_MEDIA_ORIGIN`  | `https://ketris-web-x9bk.vercel.app`, sem caminho                                  |
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | Chave aleatória independente de 32 bytes em base64                                 |
| `CRON_SECRET`                    | Segredo independente para autenticar o agendador                                   |

Gerar cada segredo localmente, sem enviar o resultado ao chat ou commitá-lo:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Também são necessárias as variáveis existentes de banco, NextAuth e S3. `NEXTAUTH_URL`
e o endereço efetivo do site devem usar o domínio estável do teste. Abra o Ketris nesse
mesmo domínio antes de conectar; o cookie OAuth é restrito ao host e não funciona se o
fluxo começar em outro preview. O domínio e a rota de fotos não podem exigir a tela de
proteção de deploy da Vercel. Nunca desative proteção de outro ambiente por conta própria.

## Migration e processamento

- Migration única e aditiva: `20261124090000_instagram_integration`. Cria o enum de status,
  as conexões pessoais (chave tenantId + connectedBy), os estados OAuth de uso único e a
  fila/histórico de publicações, com unicidade e índices. As tabelas nascem vazias; não
  migra contas e não altera imóveis existentes. Sem DROP, passa na regra do release de
  staging e está declarada em `infra/deploy/staging.json`.
- O release de staging (`scripts/staging-release.mjs`) aplica a migration com
  `prisma migrate deploy` antes de promover o deploy.
- Histórico e nova tentativa são restritos ao solicitante e exigem vínculo atual com
  o imóvel. Mesmo o gestor não usa a credencial nem consulta o histórico de outro usuário.
- Pedidos repetidos para o mesmo imóvel e conta não criam outro post. Outra conta pode
  anunciar o mesmo imóvel. Se uma conta antes usada por outra pessoa for reconectada,
  o histórico anterior não é exposto nem a publicação antiga duplicada automaticamente.

- `prisma generate` apenas gera o cliente. **Não aplica a migration.** A aplicação no
  banco local ou em outros ambientes exige autorização separada.
- A primeira tentativa usa `after()` do Next.js após gravar a fila. Enquanto a Meta
  responde `IN_PROGRESS`, ela consulta o container a cada 5 s por até 60 s
  (`instagramRequestMediaWaitMs`) e publica na mesma chamada. No caso normal, o post sai
  sem depender do agendador. A fila persistente permite retomar interrupções.
- `apps/web/vercel.json` agenda um Vercel Cron diário (`0 9 * * *`, 06:00 em Brasília)
  para `GET /api/cron/instagram`. O plano Hobby aceita só cron diário. A chamada processa
  todos os pedidos vencidos em até 60 s, renova tokens que vencem em até 7 dias e limpa
  estados OAuth vencidos. Tokens expirados não são renovados.
- Defina `CRON_SECRET` nas variáveis de ambiente da Vercel. A Vercel envia
  `Authorization: Bearer <CRON_SECRET>` sozinha. Sem a variável, a rota responde 401.
  Com `INSTAGRAM_ENABLED=false`, a rota responde 200 sem processar nada.
- Um pedido que não terminar na primeira tentativa espera o cron do dia seguinte, ou o
  botão "Tentar de novo" no detalhe do imóvel. No plano Pro, o cron pode rodar a cada
  minuto (`* * * * *`).
- O backend precisa de S3 GetObject/PutObject e DeleteObject no prefixo de fotos. Não
  usa upload direto do navegador para a Meta. Storage local/URLs externas não são
  convertidos por este adapter; fotos antigas precisam ser reenviadas pelo cadastro.
- Recomenda-se configurar expiração das cópias derivadas no storage, preservando os
  originais, para remover também arquivos órfãos de execuções interrompidas. Essa regra
  de infraestrutura não foi ativada automaticamente.

## Segurança e prevenção de duplicidade

- AES-256-GCM v2 com IV aleatório e tenant, usuário e conta como dado autenticado.
  A mesma cifra não pode ser aberta para outra identidade ou destino. A chave deve ser preservada e ter backup seguro; trocá-la
  sem migração exige reconectar as contas. Token e secret não fazem parte de DTOs públicos.
- OAuth usa estado aleatório de 10 minutos, hash no banco, cookie HttpOnly/Secure/Lax,
  vínculo ao tenant/usuário e consumo atômico. O callback também exige a sessão do mesmo usuário, revalidada pelo token service.
- Chamadas de token não geram spans/breadcrumbs de saída para evitar registrar query
  strings sensíveis. Erros da Meta são traduzidos em códigos locais, sem propagar o
  corpo recebido, tokens ou URLs de troca de credenciais aos logs da aplicação.
- A chave única combina tenant, imóvel e conta Instagram. Repetir a solicitação não
  cria um segundo post. O conteúdo confirmado fica congelado enquanto estiver em envio.
- O worker utiliza lease atômico, confere a conta/revisão, usuário ativo, papel atual,
  aprovação do corretor, tenant ativo e vínculo com o imóvel, além de seu estado publicado.
  A autorização é conferida novamente imediatamente antes de media_publish. A troca
  da conta ou retirada do imóvel impede a continuidade de trabalhos antigos.
- Antes de `media_publish`, grava `PUBLISHING`. Timeout/crash após essa fase resulta em
  `VERIFYING`: consulta o contêiner e nunca repete automaticamente a confirmação. Se não
  puder confirmar o resultado, termina em `BLOCKED`, exigindo conferência humana.
- Falhas anteriores à confirmação podem ser tentadas novamente ou revistas pelo solicitante autorizado.
  Não existe garantia distribuída de exactly-once da Meta; a escolha conservadora é
  bloquear uma tentativa incerta em vez de arriscar duplicar uma publicação.
- Desconectar remove somente a credencial do usuário e cancela seus trabalhos ainda
  não confirmados. O histórico pessoal é preservado; trabalhos com confirmação incerta
  são bloqueados pelo worker quando a conexão não pode mais ser verificada. Não apaga posts
  que já estão no Instagram. Também é possível revogar o aplicativo pelo próprio Instagram.
- Desautorização/exclusão assinadas removem a conexão, os registros dessa identidade e
  as cópias de imagem conhecidas. Imóveis do site e fotos originais são dados do Ketris,
  não são removidos por essa operação. Após exclusão do histórico, uma nova autorização
  deve ser precedida de conferência dos posts existentes; a deduplicação apagada não pode
  comprovar publicações antigas. Uma operação remota já em andamento pode concluir.

## Teste inicial: Horizonte Sul Imóveis

1. Obter aprovação e aplicar a migration no ambiente escolhido; configurar os segredos
   do aplicativo de teste, storage e processamento. Não usar token global da equipe.
2. Entrar no domínio estável com um gestor da **Horizonte Sul Imóveis** (papel técnico OWNER). A seleção do tenant
   vem da autenticação, não do nome digitado nem de parâmetro enviado pelo navegador.
3. Em **Meu Perfil**, clicar em **Conectar Instagram**, autorizar
   `@monkeystecnologia` no domínio oficial do Instagram e conferir o @ no retorno.
4. Criar um imóvel de teste com fotos sem dados sensíveis, selecionar publicar no site
   e também no Instagram, revisar a ordem, as imagens e a legenda antes de confirmar.
5. Conferir o imóvel no marketplace, o status no detalhe e o post real da conta. Repetir
   o pedido e verificar que o mesmo registro é devolvido, sem criar outro post.
6. Simular falha da Meta em ambiente de teste; conferir que o imóvel continua publicado.
   Testar também expiração/reconexão, acesso de outro tenant, corretor sem representação
   e proprietário sem vínculo. Cada usuário usa sua própria conexão.
7. Remover o post de teste manualmente no Instagram, se necessário. O Ketris não remove
   conteúdo remoto nesta versão. Não publicar em contas de clientes nessa fase.

## Para atender clientes

Standard Access atende as contas próprias/gerenciadas adicionadas ao aplicativo. Para
contas de imobiliárias clientes, solicitar **Advanced Access** para as duas permissões,
concluir **App Review**, verificação empresarial e demais verificações que o painel exigir.
O simples ato de mudar para Live não concede essas permissões.

Preparar política de privacidade, exclusão de dados, descrição de cada permissão,
credenciais de teste do Ketris quando solicitadas e gravação mostrando o fluxo completo:
Usuário autorizado → conectar → consentimento → @ pessoal conectado → fotos/legenda → confirmar → post real.
Enviar cada permissão para análise. Depois da aprovação, verificar os níveis concedidos,
habilitar o modo apropriado de produção e permitir que cada cliente autorize sua conta.
Não usar senhas dos clientes nem compartilhar o token da equipe.

## Validação e dependências externas

Os testes locais cobrem criptografia, OAuth, escopo por tenant, seleção/ordenação,
estados de publicação e resultado incerto com Meta simulada. Há testes de integração
preparados para banco real, incluindo unicidade e concorrência; precisam da migration.

O teste OAuth/publicação real depende do aplicativo, credenciais, conta profissional,
deploy HTTPS, banco migrado, S3 e agendador configurados. Sem essas etapas não se deve
afirmar que a conexão ou uma publicação real foi validada. Não foram criados recursos
Meta/AWS/Vercel nem executados deploy, migration ou posts por esta implementação.
