# Publicação pessoal de imóveis no Instagram por tenant

## Objetivo

Permitir que o administrador da imobiliária, o corretor representante e o proprietário
conectem suas próprias contas profissionais usando Instagram Login e confirmem uma
publicação após revisar fotos e legenda. O site
continua funcionando quando o canal externo falha.

## Papéis e representação

ADMIN (negócio) corresponde atualmente a OWNER no código; OWNER proprietário
corresponde a PROPERTY_OWNER. AGENT é o corretor. Esta entrega não renomeia esses
papéis globalmente.

O gestor pode anunciar qualquer imóvel do tenant. O corretor depende de
Imovel.responsavelId e o proprietário de Imovel.proprietarioId. O fluxo de designação
ou aceite da representação é separado.

## Critérios de aceite

- Uma conexão pessoal por tenant/usuário, sem compartilhar a credencial de outro usuário.
- Conexão disponível em Meu Perfil para gestor, corretor e proprietário; RENTER bloqueado.
- Queue, histórico e retry validam o vínculo atual e o escopo pessoal.
- Worker revalida usuário, tenant e representação antes da confirmação remota.
- Perda de acesso cancela trabalhos não enviados; resultado incerto é bloqueado sem republicar.
- O mesmo imóvel pode ser anunciado em contas diferentes sem duplicar pedidos na mesma conta.
- Migração preserva autoria/histórico e exige reconexão de credenciais legadas.

- Conta e credenciais isoladas por tenant e usuário; nenhum token no frontend ou DTOs.
- OAuth temporário, de uso único e vinculado ao ator que iniciou a autorização.
- Revisão de 1–20 fotos e legenda antes da solicitação.
- Publicação do site confirmada antes do envio ao Instagram.
- Pedidos repetidos retornam a mesma publicação; confirmação remota incerta não é repetida.
- Fila persistente retomável e consulta do resultado no detalhe do imóvel.
- Desautorização e exclusão verificam assinatura da Meta.
- Teste real inicial restrito operacionalmente à conta da equipe em Development.

## Fora do escopo

Renomeação global dos papéis, fluxo de designação/aceite de representação, múltiplas
contas Instagram por usuário no tenant, Reels, Stories, vídeos, anúncios, mensagens,
comentários, analytics, edição/exclusão de
posts remotos e provisionamento automático do aplicativo ou de infraestrutura.

## Plano técnico

Domínio `server/instagram` com ports e adapters para Meta/Prisma/S3/criptografia;
componentes compartilhados de conexão e revisão; integração no cadastro e detalhe do
imóvel e no perfil pessoal. Migration de transição preservando histórico, estados persistentes e lease.

## Verificações

Unitários de autorização, OAuth, criptografia, transições e falhas; componentes de
revisão; integração de unicidade/lease/consumo do estado com PostgreSQL. Lint,
typecheck e regressão das telas alteradas. Teste externo só após configuração.

Configuração, ameaças, limitações e roteiro de App Review em
`docs/instagram-integration.md`. Nenhuma migration ou infraestrutura é aplicada sem
autorização separada.
