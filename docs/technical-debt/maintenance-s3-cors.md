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
storage simulado. A rodada de 26/10 confirmou o CORS; o ensaio publicado posterior está abaixo.

## Validação publicada em 29/10/2026

No artefato `87ead6ced95ae428c721cd4c5fba88ffe044342d`, duas rodadas com contas e chamados temporários
aprovaram o fluxo real: autorização pela aplicação, preflight HTTP da origem de staging, PUT de PNG
com checksum, confirmação do anexo e redirecionamento autenticado para leitura assinada.
Foram usados um PNG pequeno e outro de 7.854.138 bytes (aproximadamente 7,49 MiB).
O SHA-256 do download correspondeu ao arquivo enviado.

Leituras anônimas retornaram 401 na aplicação e 403 no S3; a tentativa de outro tenant retornou 404.
Os registros e as versões S3 criados pelo ensaio foram removidos ao final. O bucket permaneceu
privado e a configuração foi apenas consultada. O aceite humano da interface e os ensaios de carga
ficam separados dessa evidência de API/preflight.

O estado recuperado, seus backups e as credenciais permanecem fora do Git, com acesso local restrito.
A análise dos metadados do RDS e o procedimento de recuperação estão registrados na branch
`fix/aws-terraform-recovery`, separados das correções de Maintenance.
