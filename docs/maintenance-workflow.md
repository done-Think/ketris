# Manutenção: regularização e confirmação da resolução

## Regularização dos chamados existentes

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
| RENTER                           | Não                                            | Não                    |

A confirmação altera o status para `RESOLVIDO` e registra a data de resolução. A contestação exige justificativa, altera o status para `CONTESTADO` e permite a retomada do atendimento pelo responsável ou ADMIN. Quando um OWNER conclui o reparo, a confirmação cabe ao ADMIN. O RENTER pode acompanhar e colaborar conforme as permissões do chamado, mas não confirma nem contesta a resolução.
