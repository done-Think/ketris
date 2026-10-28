# Renome para inglês: artefatos e recuperação

A migration ativa é `prisma/migrations/20261101000000_rename_schema_to_english/migration.sql`. O aplicativo, os DTOs, os schemas Zod do front e do servidor, o seed e os testes usam os nomes novos. `legacy-schema.prisma` preserva o modelo anterior para comparação e recuperação; não deve gerar o cliente usado pelo aplicativo novo. `schema.prisma` neste diretório preserva o schema de destino recebido para a revisão.

Cada SQL contém 587 renomes entre `BEGIN` e `COMMIT`. O ensaio confere que a cópia de ida corresponde exatamente à migration ativa. Arrays, snapshots e JSONs de auditoria permanecem intactos. A apresentação interpreta os campos/status antigos e novos; snapshots financeiros, não expostos no histórico atual, são preservados. Códigos desconhecidos e texto livre não são traduzidos.

## Ensaio sintético no Docker ou CI

O Compose do projeto publica PostgreSQL em `55532`; o CI usa `55432`. Configure o banco administrativo `postgres` de um servidor local com permissão de criar databases:

```sh
RENAME_REHEARSAL_SERVER_URL=postgresql://ketris:ketris@127.0.0.1:55532/postgres npm run db:rehearse-english-rename
```

O script aceita somente loopback, cria databases aleatórios e remove apenas os que criou. Registra versões e hashes, aplica a cadeia anterior, semeia auditorias PT/EN/mistas e injeta falhas após todos os renomes, tanto na ida quanto na compensação. Confere catálogo e auditorias, reconcilia as migrations falhas, aplica a compensação como nova migration e testa a próxima implantação. Também compara os schemas novo/antigo e verifica a cadeia em banco vazio.

No Prisma 7.9.1, a falha proposital pode aparecer como `current transaction is aborted`: a tentativa de registrar o erro usa a transação já abortada. O ensaio confirma diretamente o erro `22012` da divisão por zero e verifica banco e histórico após `migrate deploy`.

## Ensaio com cópia do database local

```sh
npm run db:rehearse-local-english-rename
```

Este comando usa exclusivamente o Compose padrão: container `ketris-db`, database de origem `ketris`, porta `55532` e credenciais locais do Compose. Faz `pg_dump` dentro do container e restaura em database aleatório. Na cópia, aplica a cadeia ativa e compara todas as linhas das 44 tabelas, tanto para uma origem legada quanto para uma já renomeada. Confere os renomes previstos, a normalização de mídia e os backfills de metadados declarados nas migrations posteriores; JSON, texto, arrays comuns, CPFs protegidos e registros anteriores do Prisma são preservados. Repete o deploy para conferir idempotência. O ensaio sintético separado mantém a prova da compensação/reaplicação do renome contra os schemas congelados; esses schemas não incluem as mudanças posteriores de modelagem. Nenhum conteúdo de negócio é impresso. Database temporário e dump são removidos ao terminar; a origem não recebe escritas.

## Publicação e recuperação

O contrato HTTP novo exige `X-Ketris-Api-Version: 2`; o cliente web e o Swagger enviam esse cabeçalho. Chamadas antigas recebem `409 CLIENT_UPDATE_REQUIRED` antes do handler e precisam recarregar o aplicativo; mutações não são repetidas automaticamente. NextAuth, documentação, mídia assinada e o endpoint de saúde mantêm seus protocolos anteriores. JWTs com `papel` continuam sendo interpretados com validação de sessão; novas emissões usam `role`.

A migration e a aplicação precisam ser publicadas em janela coordenada, drenando instâncias antigas. A verificação de versão HTTP não torna uma aplicação antiga compatível com o banco novo. O ensaio local não implanta alterações em staging/produção nem migra o database local original. Para usar o aplicativo novo em outro database, aplicar a cadeia com `db:deploy` no destino correto antes de iniciar a versão nova.

`down.sql` é a inversão estrutural do estado completo novo. Não aplicá-lo cegamente sobre uma execução parcial. Uma migration concluída deve ser desfeita por nova migration compensatória, preservando `_prisma_migrations`; uma falha exige conferir estado real e reconciliar o registro falho. A recuperação inclui uma versão compatível da aplicação e a validação do próximo deploy.
