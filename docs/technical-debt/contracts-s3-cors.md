# Contracts: configurar CORS do storage privado

Pendência de implantação: aplicar no bucket privado de uploads as origens exatas da aplicação em `contract_document_allowed_origins`. A configuração está preparada em `infra/terraform/s3.tf`, mas não foi aplicada na AWS.

## Impacto enquanto estiver pendente

O navegador não consegue concluir o envio direto de novos PDFs ao S3. A autorização inicial da API pode funcionar, mas o envio do arquivo falha por CORS e o documento não é confirmado no contrato.

Novos registros manuais de assinatura ficam impedidos quando não existe PDF comprobatório válido da revisão atual. A exigência de comprovante permanece vigente; o adiamento não autoriza assinar sem documento. Edições que alterem os dados do contrato continuam exigindo novo PDF antes de registrar assinaturas.

Listagem, cadastro, edição, histórico, vínculo de locatário, cancelamento e encerramento não dependem desse CORS. Continuam sujeitos às permissões, estados e validações existentes. Chave de criptografia e migrations são pré-requisitos separados e não estão dispensados por este débito.

## Critério de conclusão

1. Definir as origens exatas de cada aplicação que utiliza o bucket, incluindo a origem local somente se necessária.
2. Aplicar a configuração preparada, preservando o bucket privado e eventuais regras existentes necessárias.
3. Validar pelo navegador de uma origem autorizada: autorização, PUT com checksum, confirmação do PDF e registro manual com comprovante da revisão atual.

Os testes automatizados utilizam simulador local e já validam o fluxo da aplicação. Eles não comprovam a configuração de CORS do bucket real.

Consulte [operação de Contracts](../contracts-operations.md) para configuração e implantação.
