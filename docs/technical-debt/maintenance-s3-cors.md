# Maintenance: CORS do storage configurado

Pendência operacional de CORS resolvida em 26/10/2026 no bucket privado
`ketris-staging-uploads`, após recuperar a autenticação IAM local e reimportar os recursos existentes
para o estado do Terraform. O plano aprovado criou somente a configuração de CORS, sem alterar RDS,
rede, chaves ou bloqueios de acesso público.

Origens autorizadas para GET, HEAD e PUT:

- `https://ketris-web-x9bk.vercel.app`
- `https://www.ketris.com.br`
- `http://localhost:3000`

Os cabeçalhos permitidos são `content-type`, `content-length` e `x-amz-checksum-sha256`. A configuração
compartilhada atende os uploads diretos de Contracts e Maintenance e permanece declarada em
`infra/terraform/s3.tf`, controlada por `contract_document_allowed_origins`.

## Validação realizada

A configuração foi lida novamente pela API S3. Os preflights de PUT com tipo e checksum retornaram
HTTP 200 e a origem correspondente para os três endereços aprovados. Uma origem não autorizada
retornou HTTP 403 sem permissão de origem. Os quatro bloqueios de acesso público permaneceram
habilitados. O RDS continuou disponível em PostgreSQL 16.13, sem mudanças pendentes.

O fluxo completo de Maintenance com arquivo de 8 MB foi validado anteriormente no E2E local com
storage simulado. A verificação na AWS confirmou o CORS real; ela não representa um deploy do código
nem um teste de upload pela aplicação publicada. O ambiente da aplicação ainda precisa da versão
correspondente e de suas credenciais de storage configuradas.

O estado recuperado, seus backups e as credenciais permanecem fora do Git, com acesso local restrito.
A análise dos metadados do RDS e o procedimento de recuperação estão registrados na branch
`fix/aws-terraform-recovery`, separados das correções de Maintenance.
