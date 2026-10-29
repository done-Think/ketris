# Contracts: CORS compartilhado e validação do storage privado

Status: configuração aplicada em 26/10/2026 e fluxo privado validado nas APIs publicadas de
staging em 29/10/2026, no artefato `87ead6ced95ae428c721cd4c5fba88ffe044342d`.
A configuração foi reconferida pela API S3: bucket privado, quatro bloqueios de acesso público
habilitados e regra `contract-documents` com GET/HEAD/PUT, tipo, tamanho e checksum.

A regra vale para o bucket, compartilhado por Contracts e Maintenance. As origens registradas são
`http://localhost:3000`, `https://ketris-web-x9bk.vercel.app` e `https://www.ketris.com.br`.

## Validação publicada em 29/10/2026

Duas rodadas usaram contas temporárias em tenants distintos e contratos pela API da aplicação.
Foram aprovados: autorização do PDF, preflight HTTP com a origem de staging, PUT com checksum,
confirmação do documento e download assinado com SHA-256 idêntico ao arquivo enviado.
O PDF pequeno e o PDF no limite de 10 MiB (10.485.760 bytes) passaram pelo mesmo fluxo.

O acesso sem autenticação retornou 401 na aplicação e 403 diretamente no S3; outro tenant
recebeu 404. O registro manual das duas partes vinculou documento/hash/revisão e gerou os eventos
de auditoria esperados. Trata-se de dados fictícios de teste; a integração com provedor externo
de assinatura permanece em sua frente própria.

O mesmo ensaio aprovou os anexos de [Maintenance](maintenance-s3-cors.md). Os quatro tenants e os
registros associados foram removidos, assim como as quatro versões de objetos S3 das duas rodadas.
Escopo da evidência: APIs reais publicadas e preflights HTTP; o aceite humano da interface e
os ensaios de carga permanecem validações separadas.

Consulte [operação de Contracts](../contracts-operations.md) e
[publicação coordenada](../staging-release.md).
