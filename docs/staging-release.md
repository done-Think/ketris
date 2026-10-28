# Publicação coordenada da refatoração

Status: preparação local; publicação externa depende de acesso AWS/hosting e dos gates abaixo.

A migration de renome muda o contrato físico do banco. Uma instância antiga não pode continuar
atendendo durante a troca. `X-Ketris-Api-Version: 2` protege o contrato HTTP; não adapta uma
instância antiga ao banco novo. O workflow de staging passou a ser manual e não migra mais no
push de `dev`.

## Antes da janela

1. CI verde para o SHA exato, incluindo tipos OpenAPI, testes, build e navegador.
2. Ensaio em cópia autorizada do banco de staging: inventário de mídia, históricos mistos,
   chave de CPFs preservada, duração e locks medidos. O ensaio local não substitui esse passo.
3. Snapshot com restauração verificada e referência registrada; aplicação anterior e nova
   disponíveis como artefatos imutáveis. Confirmar quem promove/reverte o hosting.
4. Credenciais válidas no ambiente da aplicação, conexão PostgreSQL, bucket privado e CORS das
   origens exatas. Validar autorização → PUT com checksum → confirmação → leitura assinada.
5. SES com remetente/domínio verificado, permissões e restrições do sandbox conhecidas;
   validar cadastro, recuperação, convite e troca de e-mail com destinatários autorizados.

## Durante a janela

1. Ativar manutenção no ingresso/hosting, interromper novas escritas e drenar todas as instâncias
   antigas e workers. Confirmar isso antes de executar o workflow.
2. Em `dev`, executar `Staging migration (maintenance window)` com referência do snapshot e do
   artefato compatível. O workflow exige CI verde para o mesmo commit. O seed completo é opt-in,
   somente para demonstração: ele redefine contas/senhas das fixtures existentes.
3. Promover o artefato compatível no hosting, conferir cadeia de migrations e saúde do banco,
   login e permissões; conferir perfis, CRM, contrato, financeiro, agenda e uploads.
4. Testar chamada antiga (409), contrato v2 e recarregamento de uma aba antiga. Liberar tráfego
   somente depois dos smokes e monitorar erros, latência de banco e dos contadores compartilhados.

O workflow conclui a etapa do banco; não declara que promoveu uma aplicação. A integração com o
hosting depende da identificação do projeto e do mecanismo real de promoção, ainda não fornecidos.

## Recuperação

Falha transacional: conferir catálogo e `_prisma_migrations`, reconciliar a execução falha e repetir
somente após corrigir a causa. Migration concluída: preferir correção compatível ou restauração
coordenada do snapshot e da aplicação. O `english-rename/down.sql` inverte apenas o renome congelado;
não é rollback das migrations de modelagem posteriores. Não apagar histórico do Prisma e não
executar esse down sobre o schema posterior sem compensações específicas e ensaiadas.

## Dependências externas em aberto

Assinatura eletrônica exige provedor, fluxo e sandbox; boleto exige gateway/convênio. Os registros
manuais atuais não passam a representar integrações oficiais. Termos/privacidade precisam de URLs
e versões aprovadas. Juros, multa, carência, renovação e aditivos precisam das regras do time
responsável. O código não presume aprovação dessas condições nem fabrica comprovantes.

A sessão AWS local estava expirada nesta revisão. Não há comprovação nova de CORS/SES/RDS
publicados nem de promoção no hosting. Esses itens só podem mudar para concluídos após evidência
no ambiente de destino.

S3 e SES usam a cadeia padrão do SDK instalado: variáveis de credenciais temporárias
(incluindo `AWS_SESSION_TOKEN`), profile local ou role do workload. Para testar com um profile,
renovar sua sessão e iniciar o processo com `AWS_PROFILE` definido; uma sessão expirada continua
sendo erro de acesso. Sem credenciais/profile em desenvolvimento, uploads conservam o storage
local. Não é necessário criar chaves permanentes para executar esses testes locais.

## Verificação externa somente de leitura em 28/10/2026

A URL de staging registrada no Terraform, `https://ketris-web-x9bk.vercel.app`, respondeu 200 em
`/pt` e `/api/marketplace/stats`. Esses retornos não anunciaram o cabeçalho de contrato v2.
`/api/docs/openapi.json` respondeu 200 e informou API `0.1.0`, com os campos antigos em português
nas propriedades. A nova entrega gera OpenAPI `2.0.0`. Isso confirma que a aplicação desta branch
não está promovida ali; não comprova o schema atual do RDS. Não houve escrita nem implantação
nessa verificação. A AWS continuou recusando STS com sessão expirada.
