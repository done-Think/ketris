# Contracts: CORS compartilhado e validação do storage privado

Status: configuração de CORS aplicada em 26/10/2026; fluxo de Contracts na aplicação publicada
aguarda validação. O [registro de Maintenance](maintenance-s3-cors.md) documenta a leitura pela API
S3 e os preflights realizados naquela data. Em 28/10, o estado local do Terraform ainda registra a
regra `contract_documents` com GET/HEAD/PUT e cabeçalhos de tipo, tamanho e checksum.

A regra vale para o bucket, compartilhado por Contracts e Maintenance. As origens registradas são
`http://localhost:3000`, `https://ketris-web-x9bk.vercel.app` e `https://www.ketris.com.br`.
A afirmação anterior de que esse CORS não havia sido aplicado estava desatualizada.

## Validação que permanece necessária

O estado local e os preflights históricos não comprovam o fluxo atual do app publicado. A sessão
AWS estava expirada em 28/10, impedindo nova leitura da configuração real. Após renovar o acesso,
conferir drift/origens e validar no navegador: autorização → PUT com checksum → confirmação do PDF
→ leitura assinada → registro manual com comprovante da revisão atual.

Credenciais, permissões e versão compatível da aplicação são pré-requisitos distintos. Não se
presume que uploads atuais estejam bloqueados por CORS, nem que estejam funcionando apenas porque
a regra consta no estado. O bucket continua privado; este registro não autoriza acesso público.

Listagem, cadastro, edição, histórico, vínculo de locatário, cancelamento e encerramento mantêm suas
regras existentes. O adiamento da validação não dispensa PDF válido para novas assinaturas manuais.
Consulte [operação de Contracts](../contracts-operations.md) e
[publicação coordenada](../staging-release.md).
