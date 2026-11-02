# Face Check no Ketris

O módulo `face_check` integra o fluxo real do piloto `done-Think/facecheck-pilot`,
commit `3d9357a` da branch `balde`. A interface usa o tema, autenticação,
traduções e organização do Ketris. O backend de negócio continua no BFF Next.js;
o processamento nativo Python roda em serviço/container persistente, sem Lambda.
Não há sessões em memória, Supabase ou resultados simulados neste módulo.

## Acesso e rotas

No menu lateral, **Face Check** abre a visão geral. **Sessões**, **Revisão** e
**Configurações** são subitens; não existe uma segunda barra de navegação no conteúdo.

A pessoa convidada encontra **Minhas verificações** em
`/dashboard/face_check/my-verifications` quando houver solicitações vinculadas à conta.
A associação usa o e-mail exato do contato informado ao criar a verificação e uma conta
ativa com e-mail confirmado: prefere uma correspondência única na imobiliária e,
na ausência dela, exige uma correspondência global única. Nomes, telefones e e-mails
ambíguos não concedem acesso. Convites existentes continuam acessíveis pelo link;
a migration não tenta inferir vínculos a partir dos registros históricos criptografados.
O candidato vê somente imóvel, solicitante, situação, datas e convite próprio válido;
não recebe documentos, CPF, auditoria nem acesso à revisão da imobiliária. Sessões
em análise mostram o andamento, sem reabrir a captura.

O sininho mostra um aviso enquanto houver verificações próprias aptas à captura.
Ele consulta apenas contadores, sem trazer dados pessoais ou links de convite para
outras telas. Clicar no aviso abre a captura válida mais recente, após conferir
novamente a conta e a autorização no servidor. Se ela já tiver sido concluída ou
expirado, a pessoa vê a lista atualizada. O menu **Minhas verificações** permanece
disponível como acesso independente da notificação.

A captura autenticada usa `/dashboard/face_check/my-verifications/[id]`, dentro
do layout do dashboard. Cada acesso verifica o vínculo da solicitação com a conta;
o identificador não concede acesso a verificações de outras pessoas. O link público
do convite redireciona para essa tela quando o titular já está logado. Sem login,
o convite continua permitindo o fluxo portátil, inclusive pelo celular. As telas
usam breakpoints para aproveitar o desktop e empilhar conteúdo em telas pequenas.

A proteção do Sentry mantém a gravação e os envios privados bloqueados sem alterar
os atributos do `<html>` antes da hidratação. As raízes do módulo mantêm seus
marcadores de privacidade renderizados pelo React.

O menu aparece para contas AGENCY e BROKER ativas/em avaliação, usuários OWNER
ou AGENT ativos, aprovados e com e-mail verificado. A construtora é cadastrada
como AGENCY no modelo atual. O administrador global, locatários e contas pessoais
não recebem acesso operacional ao módulo.

OWNER gerencia os imóveis da organização; AGENT acessa somente os imóveis dos
quais é responsável atualmente. As consultas, imagens e decisões verificam essa
condição novamente no servidor. A transferência do imóvel revoga o acesso do
corretor anterior. Reemitir o convite registra o novo emissor autorizado,
preservando a autoria original na auditoria.

| Rota, com prefixo de idioma           | Uso                                           |
| ------------------------------------- | --------------------------------------------- |
| `/dashboard/face_check`               | Visão geral                                   |
| `/dashboard/face_check/sessions`      | Verificações e revisão manual                 |
| `/dashboard/face_check/sessions/[id]` | Evidências, auditoria e decisão               |
| `/dashboard/face_check/settings`      | Configuração da organização, edição por OWNER |
| `/face_check/verify/[token]`          | Captura por convite, sem exigir login         |

Os contratos estão no OpenAPI sob `/face_check`. O navegador envia a versão
atual do contrato da API. A captura pública tem cliente separado: um convite
inválido não tenta renovar nem encerrar a sessão de outra conta no navegador.
O token aleatório é vinculado a uma única verificação, tem expiração e é
armazenado como hash para consulta. O payload que contém o convite é criptografado.
Não divulgue URLs de captura em logs, tickets ou analytics.

Após o aceite do aviso, “Ativar câmera” solicita a permissão nativa do navegador
no computador ou celular, somente para vídeo. Sem webcam, a tela orienta a usar
o celular e oferece QR code e cópia do mesmo convite, sem serviço externo de QR.
“Continuar pelo celular” aparece somente após identificar um computador. Celulares
e tablets seguem no aparelho atual, com orientações de permissão e recuperação da
câmera adaptadas, sem convite para transferir a verificação para outro celular.
Permissão negada tem orientação própria e botão para tentar novamente. As
câmeras são desligadas ao sair da etapa, inclusive quando a permissão chega
depois que a tela foi fechada. Endereços locais ou sem HTTPS não são apresentados
como links utilizáveis por outro aparelho.

## Captura local e revisão antes do envio

Frente, verso, selfie e movimentos ficam apenas em memória no navegador até a
confirmação final. Fotografar não dispara upload. A pessoa pode conferir os dois
lados, refazer apenas um deles, confirmar a selfie e revisar as seis imagens antes
de enviar. Sair da captura ou recarregar a página descarta as fotos locais; não há
persistência em localStorage, IndexedDB ou cache do navegador.

A captura tenta negociar a resolução nativa disponível no dispositivo. Quando
suportado, `ImageCapture.takePhoto()` preserva a fotografia nativa do documento, que
pode ter mais detalhe que o vídeo. Dispositivos sem essa API usam o quadro completo
do vídeo como origem do recorte. Na captura de documentos, somente a área da moldura
é codificada e mantida para revisão e envio; a moldura e o recorte compartilham a
mesma geometria, nas orientações horizontal e vertical. Se a fotografia nativa tiver
proporções diferentes do vídeo, usamos o vídeo para manter o enquadramento mostrado.
O recorte preserva a densidade de pixels original, sem ampliação artificial.
Uma foto nativa com menos pixels que o quadro disponível não substitui o
vídeo de maior resolução. Se a consulta de capacidades ou uma combinação de tamanho
não for suportada, tentamos o modo de fotografia padrão do dispositivo antes do vídeo.
Foco, exposição e balanço de branco contínuos são solicitados apenas quando anunciados
pelo dispositivo, independentemente da resolução; a rejeição de um controle não
descarta os demais ajustes. Selfie e movimentos mantêm a mesma resolução e origem de vídeo para não
distorcer a comparação de distância do rosto. Os
limites de 3 MiB e 16 megapixels por imagem permanecem; aumentar pixels por software
não substitui resolução óptica ou foco. A orientação ao vivo usa detecção nativa
local quando disponível; sem ela, apresenta orientação neutra e continua permitindo
a captura. Não há envio remoto de prévias. Recortes de PDF/galeria também são locais.

O MacBook Pro de 13″ com M2 (2022, Mac14,7) tem câmera integrada de 720p, conforme as
[especificações da Apple](https://support.apple.com/en-ie/111869). Solicitar 4K ao
navegador não acrescenta detalhe a esse sensor. Para conferir a nitidez, compare o
mesmo enquadramento com outro aplicativo de câmera, sem efeitos de desfoque. O
[modo Retrato do macOS](https://support.apple.com/en-ie/105117) pode desfocar partes
da cena; o site não controla esse efeito do sistema. Se os dados do documento
continuarem ilegíveis, oferecemos a continuação no celular pelo mesmo convite.

Refazer um lado do documento mantém o outro lado, a selfie e as poses locais. Quando
todas as demais fotos já existem, a recaptura volta diretamente à revisão final.
O verso rejeitado é reenviado sem repetir a frente já aceita. Se a selfie já tiver
sido aceita ou seu envio tiver ficado incerto, a edição do documento exige um novo plano na confirmação
final e a revalidação das fotos locais existentes, sem novas selfies. Essa renovação
preserva o prazo original e os limites de rejeição; não contorna validações.

## Captura dos movimentos

A selfie e cada movimento exigem um clique antes da contagem visível de 3 segundos,
com bipes quando o navegador permite áudio. Depois da foto, a pessoa pode conferir
ou refazer a captura. O botão “Próximo” apenas apresenta as instruções da pose
seguinte — esquerda, direita e aproximação — sem contagem ou foto. A pessoa pode ler
e se posicionar sem pressa. Somente o clique em “Capturar foto” inicia os 3 segundos.
Refazer uma pose também apresenta a câmera e aguarda esse clique. Não há encadeamento automático.
Depois da última foto, outro clique abre a revisão final, sem enviar as imagens.
Pausar, ocultar a aba ou perder a câmera cancela a contagem em andamento; retomar
exige uma nova ação do usuário.

`POST /api/face_check/capture/{token}/liveness-plan` emite um identificador vinculado
à sessão, antes de capturar os movimentos. Ele não recebe imagens e preserva o prazo
de consentimento e os limites de rejeições. Reiniciar invalida o plano anterior.

Somente na confirmação final o cliente envia frente, verso, selfie e movimentos,
em requisições individuais limitadas, vinculadas ao mesmo plano. Isso evita reduzir
a qualidade para acomodar seis imagens em um único payload. Todas as verificações
de documento, identidade, ordem e anti-spoof continuam no backend; não se aceita
aprovação calculada pelo cliente. O prazo de 15 segundos entre recebimentos começa
em `liveness-start`, após o envio da selfie. Os horários registram recebimento e
análise, sem atestar o instante de aquisição de cada foto no dispositivo.

Falhas não apagam os movimentos já aceitos. A retomada sincroniza respostas perdidas
sem repetir etapas aceitas, e o limite de rejeições mantém a revisão humana. A
aprovação automática permanece desativada; a sequência de fotos não constitui
sozinha uma prova certificada de captura ao vivo.

## Convites por e-mail

Criar uma verificação exige um e-mail válido. Formulário, API, caso de uso e
persistência rejeitam e-mail ausente, vazio ou inválido, incluindo telefone no
lugar do endereço. O e-mail é normalizado e o convite é registrado na mesma
transação da sessão; uma sessão nova não pode ser criada sem o convite. Registros
históricos continuam legíveis. O idioma da interface usada na criação define o template e o link
em português, inglês ou espanhol.

O envio usa o SES, a região AWS e o remetente `SES_FROM_EMAIL` existentes. O
template contém a solicitação da imobiliária, validade e link para iniciar;
não inclui CPF, documentos ou imagens. Destinatário e token continuam cifrados
no registro da sessão; a fila contém somente referências e estado de entrega.

A aplicação tenta o envio logo após criar a sessão, com orçamento de três segundos.
Falhas preservam a verificação e deixam o convite para retentativa com backoff.
O worker confere novamente o emissor, imóvel, destinatário vinculado, token e
prazo, cancelando convites inválidos ou já em análise/concluídos. Lease e estado
`SENT` evitam processamento concorrente e reenvio de mensagens confirmadas.
O aceite do SES e a atualização no banco não são atômicos: um timeout ou crash
nesse intervalo pode causar uma duplicata rara; não há garantia de exatamente um envio.

O endpoint interno `GET /api/internal/face_check/invitations` usa o mesmo segredo
de manutenção da retenção e retorna apenas contagens. O workflow de retenção
também executa `scripts/face-check-invitation-emails.mjs`; na configuração atual,
essa retentativa de contingência é horária. O envio inicial não depende do cron.
Os testes usam um simulador local do protocolo SES, sem disparar mensagens reais.

## Persistência e imagens

A migration `20261111090000_face_check_module` adiciona as tabelas próprias ao
Prisma/PostgreSQL. Chaves compostas impedem relações entre organizações. O
payload de sessão/configuração é criptografado com AES-256-GCM e AAD vinculado
ao tipo do registro, organização e identificador. A aplicação usa lease e revisão
para controlar concorrência sem manter uma conexão PostgreSQL ocupada enquanto
aguarda OCR, rede ou S3.

As fotos ficam criptografadas no prefixo privado
`face_check/<tenant>/<session>/...` do bucket configurado, com criptografia
adicional do S3. Não há ACL pública nem URL pública/assinada para o navegador:
o BFF autoriza cada leitura e responde `no-store`. Imagens não entram no JSON
do banco. Fotos: JPEG/PNG, até 3 MiB e 16 milhões de pixels, com conteúdo
decodificado validado no servidor.

Rotas e telas do módulo ficam fora de Replay, breadcrumbs e traces do Sentry.
O transporte também filtra envelopes automáticos. Somente um diagnóstico mínimo
explícito, sem requisição, usuário, anexos ou variáveis locais, pode ser enviado.

## Consentimento, retenção e revisão

Antes de aceitar o consentimento ou abrir a câmera, a captura mostra um modal
com o aviso e o checkbox obrigatório “Entendi e estou de acordo!”. O backend
confere a versão `camera-2026-10-31-retention-v1`; aceitar outra versão não libera
uploads. O texto e todo o fluxo estão em pt-BR, en-US e es-ES.

- Decisão final de aprovação/rejeição bloqueia a visualização imediatamente e
  tenta excluir as imagens na própria requisição. Falhas ficam em fila durável.
- O prazo máximo definido para as imagens é sete dias. O TTL interno é de
  **6 dias e 23 horas**, deixando uma hora para a rotina periódica. Ele começa
  antes do primeiro upload e não é prorrogado por novas tentativas enquanto
  houver imagens antigas. O prazo exato fica nos metadados da verificação.
- A exclusão abrange tentativas anteriores, objetos órfãos, versões antigas e
  delete markers do S3. Só depois da confirmação a fila é encerrada. Um simples
  `DeleteObject` em bucket versionado não satisfaz a política.
- Evidências expiradas, excluídas ou com exclusão pendente não podem ser lidas
  ou usadas para aprovar uma verificação. Reabrir exige nova captura; imagens
  excluídas não são recuperadas. Auditoria, decisão e métricas permanecem.

O teto depende da execução e do monitoramento da rotina de exclusão; não é uma
garantia fornecida por um campo de expiração no banco. Antes de coletar fotos,
configure e valide o scheduler, as permissões de exclusão e os alertas de falha.
Em produção, uploads são recusados sem um segredo de retenção configurado.

A aprovação biométrica automática está desligada. Após captura/análise, o
operador revisa os dados. Uma falha biométrica pode ser resolvida por decisão
manual explícita: são exigidos acesso atual ao imóvel, as três imagens retidas,
registro de visualização, motivo e justificativa de pelo menos dez caracteres.
A decisão fica marcada como MANUAL; não transforma a prova de vida em sucesso.

## Configuração privada

Configure no ambiente do backend, sem prefixo `NEXT_PUBLIC_`:

| Variável                         | Valor/finalidade                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| `FACE_CHECK_DATA_ENCRYPTION_KEY` | Chave aleatória de 32 bytes em base64; preserve-a para ler dados existentes         |
| `FACE_CHECK_ENGINE_URL`          | Endereço do serviço Python acessível pelo backend                                   |
| `FACE_CHECK_ENGINE_TOKEN`        | Segredo Bearer aleatório de pelo menos 32 bytes, igual no motor e no BFF            |
| `FACE_CHECK_S3_BUCKET_NAME`      | Bucket privado de evidências; pode ser o uploads existente com as permissões abaixo |
| `FACE_CHECK_RETENTION_SECRET`    | Segredo aleatório de pelo menos 32 bytes, igual na aplicação e no scheduler         |

O runtime reutiliza as credenciais/região AWS da aplicação. O exemplo sem
segredos está em [face-check.env.example](face-check.env.example). O motor e seu
Dockerfile estão documentados em [face-check-engine.md](face-check-engine.md).
No desenvolvimento, `FACE_CHECK_LOCAL_STORAGE=true` permite armazenamento
criptografado em `.local/face_check` sem S3. Esse fallback é recusado em produção.

Para usar o perfil Docker local, configure o mesmo `FACE_CHECK_ENGINE_TOKEN` em
`apps/web/.env.local` e em `services/face_check_engine/.env` (arquivos ignorados).
Depois execute `docker compose --profile face_check up --build -d face_check_engine`.
O perfil não modifica o PostgreSQL e publica o motor somente em `127.0.0.1:8765`.

Gere segredos diferentes para criptografia, motor e retenção. A chave de dados
não pode ser trocada arbitrariamente depois de gravar registros. O serviço
Python deve ficar em rede privada ou atrás de um ingresso HTTPS autenticado.
A Vercel não acessa o Docker do seu computador por `localhost`.

Os assets do importador de PDF são copiados de `pdfjs-dist` por `predev` e
`prebuild`, com a licença. São gerados e ignorados pelo Git.

## Exclusão automática no staging

O endpoint interno `GET /api/internal/face_check/cleanup` exige Bearer próprio;
não aceita sessão de usuário. Retorna apenas contagens, sem dados pessoais.
Uma falha parcial responde 503 e mantém as exclusões pendentes para nova tentativa.

O workflow `Face Check retention` executa no ambiente GitHub `staging` e usa o
secret `FACE_CHECK_RETENTION_SECRET`. A origem é lida do manifesto de staging;
o script também aceita `FACE_CHECK_APP_ORIGIN` para execução operacional explícita.
As permissões Terraform incluem `ListBucketVersions`, `DeleteObject` e
`DeleteObjectVersion`, com exclusão limitada a `face_check/*` no bucket uploads.
Essas alterações precisam ser aplicadas antes do teste de exclusão física.

**GitHub só agenda workflows presentes na branch padrão.** O cron horário da
branch padrão dispara a execução na `dev`, compatível com a regra de deployment
do ambiente staging. Apenas mergear na `dev` não liga esse cron. Enquanto o
workflow não estiver na branch padrão, configure um scheduler externo equivalente;
o disparo manual isolado serve para validar, não substitui a execução recorrente.
Não habilite coleta real de fotos sem esse passo. Monitore falhas e pendências,
inclusive volume que exceda o lote de 50 sessões por execução.

Em resets ou exclusões físicas administrativas de organizações/imóveis, purgue
os prefixos correspondentes antes de apagar os metadados de retenção do banco.
Os fluxos normais de inativação preservam os registros para a rotina periódica.

Sequência de ativação em staging:

1. Disponibilizar o motor Python e conferir saúde, autenticação e conectividade.
2. Configurar os cinco valores privados acima e aplicar as permissões S3.
3. Aplicar a migration pelo release coordenado habitual.
4. Configurar o secret do scheduler, ativar a execução recorrente e validar a
   exclusão de um objeto sintético em bucket versionado, incluindo versões.
5. Testar convite, captura, falha, revisão manual, expiração e autorização com
   contas de cada perfil antes de coletar documentos de pessoas.

Este trabalho prepara o código; não provisiona o motor nem altera o RDS/S3 real.

## Validação e limites

`npm run face-check:test:integration` cria um banco aleatório em PostgreSQL
local, aplica todas as migrations, ensaia acesso/transferência/concorrência e
retenção e remove somente esse banco ao terminar. Use `FACE_CHECK_TEST_SERVER_URL`
para mudar a conexão local de teste; hosts remotos são recusados pelo runner.
Os testes de modelo real usam apenas imagens sintéticas dentro do container.

O piloto possui bypass conhecido de anti-spoof e limiares não calibrados. Os
resultados não equivalem a validação documental oficial, certificação biométrica
ou assinatura digital. O módulo preserva esses limites e mantém decisão humana.
Uma eventual aprovação automática exige avaliação independente e critérios de
produto; a tela de configuração não permite habilitá-la.
