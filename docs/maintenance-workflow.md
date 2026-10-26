# Manutenção: regularização e confirmação da resolução

## Organização do código

- `src/modules/maintenance/hooks/use-maintenance-dashboard.ts`: consultas, filtros, paginação e ações da lista.
- `src/modules/maintenance/components/MaintenanceTicketsTable.tsx`: tabela e paginação visual; os blocos do detalhe ficam em `components/ticket-detail`.
- `src/modules/maintenance/styles/`: estilos dos componentes e apresentação de status/prioridade, usando os tokens do tema.
- `src/server/maintenance/domain/`: permissões e planejamento das ações; `application/ports/`: contratos de persistência, storage e autorizações de upload. As rotas chamam casos de uso, que aplicam também a projeção pública do chamado.
- `src/server/maintenance/infrastructure/maintenance-ticket-mapper.ts`: conversão dos registros Prisma; `maintenance-access-scope.ts`: filtros de acesso; `prisma-maintenance-links.ts`: transação de regularização dos vínculos. O repositório coordena essas responsabilidades.
- `src/server/contracts/types/contract-renter-link.ts`: tipos da política compartilhada de vínculo do locatário.
- Os testes de casos de uso ficam separados por assunto em `src/server/maintenance/tests/application/use-cases`, com dados comuns em `tests/fixtures`. Os testes de API seguem a mesma divisão em `src/app/api/maintenance/tests/tickets`, com preparação e limpeza isoladas por suíte em `tests/fixtures`.

Os testes permanecem no projeto como proteção contra regressões. Dividir os arquivos não remove os cenários existentes nem cria cópias deles.

## Regularização dos chamados existentes

O vínculo do usuário locatário segue a política dos contratos e do financeiro: confirmação explícita
pelo ADMIN da imobiliária via API, conta RENTER ativa e e-mail normalizado correspondente à parte
LOCATARIO. A conta pode estar no tenant compartilhado. Confirmar o mesmo vínculo novamente é
permitido; substituir por outro usuário é bloqueado. A API `POST /api/maintenance/links` e a API
`POST /api/contracts/{id}/parties/{partyId}/link-user` seguem a mesma regra. Na manutenção, falhas
desfazem também alterações de proprietário e histórico da mesma operação.

O renter pode acompanhar seus contratos em várias imobiliárias sem dar a elas acesso aos dados
umas das outras. Lista, detalhe, criação, ações, histórico e anexos usam o contrato vinculado; chamado,
contrato e imóvel precisam pertencer à mesma imobiliária. Não há associação automática de registros
antigos por e-mail, cadastro ou login. Sem usuário vinculado e contrato válido, o renter não tem acesso.

A migration `20261014120000_maintenance_access_workflow` mantém os chamados antigos sem contrato. Enquanto não houver contrato válido, somente o ADMIN do tenant pode acessá-los.

O ADMIN deve conferir os vínculos do imóvel e do contrato em **Regularizar vínculos**: proprietário do imóvel e usuário locatário da parte contratual. O corretor autorizado é o responsável pelo imóvel ou pelo chamado. Essa etapa não associa chamados a contratos.

Para associar o chamado, o ADMIN abre seu detalhe e seleciona **Associar contrato**. Para arquivados, deve acessar a lista **Arquivados** primeiro. A seleção começa vazia e mostra apenas contratos do imóvel do chamado; mesmo havendo apenas um contrato, o administrador deve selecioná-lo explicitamente. Quando existem vários contratos, o administrador deve verificar qual corresponde ao chamado antes de confirmar.

A operação também está disponível em `POST /api/maintenance/tickets/{id}/actions`:

```json
{ "action": "linkContract", "contractId": "id-do-contrato-confirmado" }
```

O servidor exige ADMIN e valida tenant e imóvel do contrato. A associação não altera imóvel, status, data de resolução, autoria da conclusão ou arquivamento. Ela mantém o histórico existente e adiciona uma atividade `EDICAO` com autor, data e contrato anterior/novo, na mesma transação da associação. Não exige reabertura nem restauração, incluindo chamados `FECHADO`.

Após a associação, proprietário vinculado, corretor autorizado e locatário vinculado recuperam o acesso a chamados não arquivados, inclusive encerrados. Terceiros continuam bloqueados. Arquivados permanecem visíveis apenas ao ADMIN; a restauração é uma ação separada, que preserva status e data de resolução e devolve o acesso aos usuários autorizados. Não se deve reabrir um chamado apenas para regularizar seu contrato.

## Quem confirma e contesta a resolução

O responsável interno ou o ADMIN conclui o atendimento em andamento, levando o chamado a `AGUARDANDO_CONFIRMACAO`. Nesse estado:

| Perfil                           | Confirmar                                      | Contestar              |
| -------------------------------- | ---------------------------------------------- | ---------------------- |
| ADMIN do tenant                  | Sim                                            | Sim, com justificativa |
| Proprietário vinculado ao imóvel | Sim, se a conclusão não foi feita por um OWNER | Sim, com justificativa |
| AGENT                            | Não                                            | Não                    |
| RENTER                           | Não                                            | Sim, com justificativa |

A confirmação altera o status para `RESOLVIDO` e registra a data de resolução. A contestação exige justificativa, altera o status para `CONTESTADO` e permite a retomada do atendimento pelo responsável ou ADMIN. Quando um OWNER conclui o reparo, a confirmação cabe ao ADMIN. O RENTER vinculado pode contestar e pode finalizar diretamente chamados ativos com `finish`, conforme o fluxo atual da 149. A confirmação administrativa do vínculo de acesso é uma operação distinta da confirmação de resolução.

## Categorias, catálogo e histórico

As categorias padrão são armazenadas como `PLUMBING`, `ELECTRICAL`, `STRUCTURAL` e `PAINTING`, com rótulos traduzidos. A migration preserva outras categorias legadas; elas continuam disponíveis ao editar o chamado.

O catálogo pertence à imobiliária do chamado. Quem já pode definir seu prestador pode selecionar um cadastro ativo ou cadastrar um novo. A gestão edita, inativa e reativa o catálogo. Um cadastro idêntico a um prestador inativo exige reativação pela gestão. A importação dos prestadores antigos unifica somente nome, telefone, e-mail e observações exatamente iguais dentro da mesma imobiliária.

A atribuição guarda o ID do prestador e uma cópia dos seus dados no chamado. Editar ou inativar o catálogo não altera chamados ou atividades anteriores. Cadastro/edição/inativação do catálogo e seu histórico são transacionais; o cadastro feito durante uma atribuição participa da mesma transação do chamado.

Os identificadores históricos dos autores são preservados sem chave estrangeira, de acordo com a decisão adotada para os históricos de Auth, CRM e Contracts. A gravação usa o autor autenticado validado pelo servidor. Registros importados não recebem autoria fictícia. Eventos de sistema novos têm códigos para tradução; notas e justificativas humanas e mensagens legadas continuam com o texto original.

## Listagem e formulários

A API pagina os chamados e calcula indicadores e contagens sobre todos os registros autorizados, separando ativos e arquivados. Busca e filtros restringem os resultados da tabela, sem restringir os indicadores globais. Lista, indicadores e detalhe exigem a mesma coerência entre chamado, contrato, imóvel e tenant para os usuários que não são da gestão; legados sem contrato e registros inconsistentes permanecem acessíveis somente à gestão.

O filtro de categoria é aplicado no servidor junto da paginação. Aceita os códigos padrão e os valores legados preservados; os quatro rótulos antigos são normalizados para seus códigos. Os controles de desktop e do diálogo compartilham a seleção e retornam à primeira página quando ela muda.

A regularização administrativa de vínculos executa a alteração e seu histórico em transação serializável. Conflitos de serialização (`P2034`) repetem a transação completa até três tentativas; outras falhas são devolvidas sem repetição. Após esgotar as tentativas, a API retorna conflito para revisão dos dados.

Os formulários usam RHF/Zod e limites alinhados com a API. O imóvel é derivado do contrato selecionado. Atualizações em segundo plano preservam a edição local do agendamento. Somente HTTP 404 mostra chamado não encontrado; outras falhas permitem nova tentativa.

## Anexos privados de até 8 MB

O navegador valida JPEG, PNG ou WebP e calcula SHA-256. `POST /api/maintenance/tickets/{id}/attachments/upload` autoriza o usuário no chamado e emite uma autorização individual de dez minutos, vinculada ao usuário, chamado, tenant e metadados. O arquivo segue por PUT direto ao S3 privado, sem enviar o bearer token da aplicação ao storage.

`POST /api/maintenance/tickets/{id}/attachments/complete` revalida o acesso e o estado do chamado, verifica tamanho, tipo e checksum no S3 e registra o anexo e sua atividade transacionalmente. Repetir a confirmação não duplica o anexo. Arquivos sem confirmação não aparecem no chamado.

A URL persistida continua sendo a rota autenticada `/api/maintenance/media/...`. Após autorizar o acesso pelo chamado, essa rota redireciona para uma URL privada de leitura com validade de 60 segundos e cache desabilitado. Assim, o corpo do arquivo não atravessa a função da Vercel nem no envio nem na leitura. A rota multipart antiga permanece para compatibilidade, mas está sujeita ao limite de payload da infraestrutura.

A configuração AWS de CORS foi aplicada e validada em 26/10/2026 para as origens aprovadas. Consulte o [registro da configuração de Maintenance](technical-debt/maintenance-s3-cors.md). O fluxo completo de 8 MB foi validado com PostgreSQL e simulador S3 isolados; na AWS foram validados o CORS e os preflights reais.
