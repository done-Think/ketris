# Contracts: migrações, proteção de dados e PDFs privados

## Configuração antes da implantação

Defina `CONTRACTS_DATA_ENCRYPTION_KEY` com 32 bytes aleatórios codificados em base64. Use uma chave própria por banco/ambiente e preserve-a em armazenamento de segredos e nos procedimentos de recuperação. Não utilize a chave fictícia dos testes fora do CI efêmero.

O secret `CONTRACTS_DATA_ENCRYPTION_KEY` do environment **staging** no GitHub e a variável dos ambientes da aplicação que acessam esse banco devem conter a mesma chave. Os workflows de migração/seed e de reset validam a configuração antes de alterar o banco. A configuração não cria automaticamente secrets no GitHub ou variáveis na Vercel.

Geração local, sem registrar o valor em logs:

```sh
umask 077
openssl rand -base64 32 > /caminho/protegido/contracts-data-encryption.key
```

Configure também as credenciais S3, `AWS_REGION`, `S3_BUCKET_NAME` e `AUTH_TOKEN_SECRET` já usados pela aplicação. O bucket deve permanecer privado. Não exponha a chave de criptografia em variáveis `NEXT_PUBLIC_*`.

## Migração e backfill

As migrations `20261025190000_contract_lifecycle_documents_and_audit` e `20261025193000_contract_document_revision` adicionam histórico, autoria, evidências e revisão do documento. A unicidade do código passa a ser por tenant, preservando os códigos existentes.

Antes de executá-las em um banco persistente, mantenha um backup recuperável e a chave correspondente. Execute:

```sh
npm run db:deploy -w @ketris/web
npm run db:protect-contract-cpfs -w @ketris/web
```

O seed também executa o backfill antes de popular dados. A rotina processa lotes de até 100 CPFs legados e é idempotente. Protege os CPFs com AES-256-GCM, nonce aleatório e contexto autenticado contendo tenant e ID da parte. Registra a atualização técnica como ação do sistema, sem guardar o CPF no histórico.

Na primeira implantação, coordene a atualização da aplicação com o pipeline que executa o seed/backfill. Depois da proteção, versões antigas que leem o CPF diretamente não conseguem apresentá-lo corretamente. Previews que compartilham o mesmo banco também precisam usar a versão compatível; não execute esse backfill enquanto fluxos de Contracts de versões anteriores ainda precisarem acessar o banco.

CPFs antigos continuam legíveis durante a transição, mas novas gravações usam criptografia. Não há atribuição retroativa de autor, método de assinatura ou timestamp de criação para registros antigos. O timestamp de atualização da parte pode refletir o backfill que efetivamente a alterou.

Não substitua a chave em uso por uma nova chave aleatória: dados já protegidos exigem a chave original. Rotação exige uma rotina específica de recriptografia. Um rollback para código que espera CPF em texto puro é incompatível com o banco após o backfill. Para recuperação, use backup, versão da aplicação e chave compatíveis; não remova tabelas de auditoria ou documentos para tentar reverter a migração.

## Transferência de PDFs

O arquivo é um PDF final enviado pela imobiliária, com limite de 10 MiB. A aplicação autoriza o envio por dez minutos e vincula contrato, usuário, tenant, revisão, tamanho e SHA-256. O navegador envia os bytes diretamente ao S3, sem encaminhar o token de sessão ou o cabeçalho de tenant.

A confirmação verifica permissão atual, revisão do contrato, tamanho, tipo, cabeçalho PDF e checksum no storage. Documento e histórico são gravados na mesma transação. Repetir a confirmação do mesmo envio não duplica os registros. Arquivos enviados mas não confirmados não são apresentados como documentos do contrato.

O download exige acesso de leitura ao contrato e fornece URL válida por um minuto após verificar a integridade. Arquivos legados sem objeto privado e hash continuam listados, sem download privado disponível. Não disponibilize o bucket publicamente nem faça proxy dos PDFs de 10 MiB por uma função da Vercel.

O Terraform prepara CORS na variável `contract_document_allowed_origins`: informe apenas as origens exatas da aplicação, sem caminhos ou curingas. O ajuste permite PUT, GET e HEAD e os cabeçalhos necessários ao checksum. Revisar e aplicar essa configuração é uma operação de infraestrutura separada; o código da branch não a aplica automaticamente.

A configuração compartilhada de CORS foi aplicada em 26/10 e consta no estado local do Terraform, conforme o [registro de Contracts](technical-debt/contracts-s3-cors.md). O fluxo de PDF pela aplicação publicada ainda precisa de credenciais válidas e validação no navegador. Registrar assinatura continua exigindo comprovante válido da revisão atual.

## Assinaturas e histórico

O registro temporário de assinatura é identificado como **manual** e exige PDF comprobatório da revisão atual. Guarda hash do documento, autor, instante do servidor, navegador e IP somente quando fornecido pela origem confiável já configurada. Assinaturas antigas mantêm os metadados que realmente possuem.

Editar os dados antes da primeira assinatura incrementa a revisão e exige novo PDF, preservando os arquivos anteriores. Após a primeira assinatura, a edição fica bloqueada. Trocar o e-mail do locatário remove seu vínculo de acesso e exige nova confirmação explícita da gestão.

Cancelamento de contrato ainda não ativo e encerramento de contrato ativo exigem motivo e preservam financeiro e histórico. Encerrar locação sem outro contrato ativo inativa o imóvel, preservando a data da publicação; vendas preservam Vendido.

A integração com provedor externo de assinatura e o fluxo de renovação/aditivos estão registrados nos débitos técnicos próprios. O registro manual não representa uma integração com provedor.

## Validação automatizada

CI usa PostgreSQL efêmero e chave fictícia exclusiva de testes. Os fluxos Cypress de Auth e Agenda são preservados e Contracts é incluído no mesmo job. Os testes de PDFs usam storage HTTP local, credenciais fictícias e verificação de endpoints locais; não utilizam o S3 real.
