# Maintenance: recuperar acesso AWS e aplicar CORS do storage

Pendência de implantação informada pelo responsável: as credenciais locais foram perdidas após a formatação do computador. O responsável não tem backup conhecido do estado do Terraform nem confirmação de backend remoto. A busca em `infra/terraform` não encontrou arquivos de estado. O ambiente de desenvolvimento não tem bucket ou credenciais AWS configurados. Não foi executada nenhuma alteração na AWS nesta branch.

O upload direto de imagens de até 8 MB exige CORS no bucket privado. Sem esse ajuste, a autorização da API pode funcionar, mas o PUT do navegador falha e o anexo não é confirmado. O cadastro, listagem, catálogo e demais ações dos chamados continuam independentes desse CORS.

A configuração já preparada para Contracts em `infra/terraform/s3.tf` atende também Maintenance: PUT/GET/HEAD, origens explícitas e cabeçalhos de tipo, tamanho e checksum SHA-256. A variável existente é `contract_document_allowed_origins`; não há necessidade de um segundo recurso de CORS que substituiria o primeiro.

Para concluir:

1. Recuperar o acesso à conta AWS e o perfil de operação do Terraform. Chaves e segredos devem permanecer fora do Git.
2. Recuperar o estado do Terraform. O código atual configura estado local, ignorado pelo Git; confirmar a existência de backup ou backend utilizado. Se o estado foi perdido, reconciliar os recursos existentes antes de qualquer aplicação.
3. Identificar o bucket e as origens exatas de staging/produção e configurar a variável existente, preservando as origens necessárias para Contracts.
4. Revisar o plano concreto do Terraform e aplicar somente a mudança de CORS necessária, preservando os recursos existentes e a privacidade do bucket.
5. Pelo navegador em uma origem autorizada, enviar uma imagem de 8 MB, confirmar o anexo, visualizá-lo com sessão autorizada e verificar a recusa a um usuário sem acesso ao chamado.

Os testes automatizados cobrem o protocolo, checksum, tamanho, permissões e redirecionamento privado usando storage local. A validação da AWS real permanece pendente, assim como a [configuração de Contracts](contracts-s3-cors.md).
