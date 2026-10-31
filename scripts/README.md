# Patch de desempenho do Next em desenvolvimento

Esta pasta contém uma ferramenta de instalação do monorepo, executada pelo `postinstall` do `package.json` da raiz. O formato `.mjs` permite executar JavaScript com módulos ES diretamente no Node, sem compilar TypeScript nem iniciar a aplicação. O teste em `tests/` usa o runner nativo do Node para verificar a correção e a reaplicação do patch.

`patch-next-dev-performance.mjs` protege as medições de componentes RSC interrompidos ou com erro contra tempos finais negativos, conforme [react/react#37561](https://github.com/react/react/issues/37561). O erro foi reproduzido em Electron e Chrome antes do fluxo E2E de imóveis.

O patch é aplicado pelo `postinstall`, somente aos clientes browser/edge de desenvolvimento embarcados no Next 16.3.1. Não modifica os bundles de produção nem suprime exceções no Cypress. Uma mudança de versão ou de formato do bundle exige revisar/remover o patch; a instalação falha com instrução explícita nesse caso.

Verificação: `node --test scripts/tests/patch-next-dev-performance.test.mjs`.

A configuração webpack usa uma versão de cache própria em desenvolvimento para não reutilizar os clientes RSC compilados antes do patch. Ao remover o patch, remova também esse sufixo em `next.config.mjs`.

## Publicação de staging

`staging-release.mjs` coordena o candidato Vercel, migrations e testes de autenticação. É chamado
pelo GitHub Actions, com destino fixado em `infra/deploy/staging.json`; não carrega envs locais.
`staging-release-lib.mjs` valida destino, ledger e ordem das etapas. A fixture de autenticação
é reconciliada por `staging-smoke-account.mjs`, separada do seed completo e de contas humanas.
As conexões PostgreSQL são limitadas às etapas de banco, com timeout no cliente e
tratamento de desconexões. Nenhuma sessão fica aberta durante o build remoto. Os
comandos Prisma e Vercel também têm prazo máximo; falhas não repetem transações.
Configuração e ativação estão em [staging-release.md](../docs/staging-release.md).

Os testes de fluxo usam `node --test scripts/tests/staging-release.test.mjs`. O ensaio de banco
usa `node --test scripts/tests/staging-release-db.test.mjs` com `DATABASE_URL` de um servidor
PostgreSQL **local**: cria, migra e remove seu próprio database temporário, sem modificar o
database informado na URL. Não aceita host remoto. Ambos os testes rodam no CI.

## Reaproveitamento do CI

`ci-validation.mjs` tem três modos usados por `ci.yml`: `plan` decide se existe evidência
válida do PR, `record quality|auth-e2e` registra o conteúdo testado por cada job e `gate`
confere os resultados antes do release. Não instala pacotes, baixa artefatos nem executa
código de outro workflow. A consulta ao GitHub usa o token automático com acesso de leitura.

`ci-validation-lib.mjs` valida a origem, o Git tree, os dois jobs, a tentativa, a idade e a
identidade dos artefatos. Qualquer incerteza executa CI completo. A integração real com
Git é ensaiada em repositórios temporários; os testes HTTP usam respostas simuladas:

```sh
node --test scripts/tests/ci-validation.test.mjs
```

As regras de transição e os estados esperados dos jobs estão em
[staging-release.md](../docs/staging-release.md#reaproveitamento-da-validação-do-pr).
