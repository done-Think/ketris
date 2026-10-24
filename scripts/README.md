# Patch de desempenho do Next em desenvolvimento

Esta pasta contém uma ferramenta de instalação do monorepo, executada pelo `postinstall` do `package.json` da raiz. O formato `.mjs` permite executar JavaScript com módulos ES diretamente no Node, sem compilar TypeScript nem iniciar a aplicação. O teste em `tests/` usa o runner nativo do Node para verificar a correção e a reaplicação do patch.

`patch-next-dev-performance.mjs` protege as medições de componentes RSC interrompidos ou com erro contra tempos finais negativos, conforme [react/react#37561](https://github.com/react/react/issues/37561). O erro foi reproduzido em Electron e Chrome antes do fluxo E2E de imóveis.

O patch é aplicado pelo `postinstall`, somente aos clientes browser/edge de desenvolvimento embarcados no Next 16.3.1. Não modifica os bundles de produção nem suprime exceções no Cypress. Uma mudança de versão ou de formato do bundle exige revisar/remover o patch; a instalação falha com instrução explícita nesse caso.

Verificação: `node --test scripts/tests/patch-next-dev-performance.test.mjs`.

A configuração webpack usa uma versão de cache própria em desenvolvimento para não reutilizar os clientes RSC compilados antes do patch. Ao remover o patch, remova também esse sufixo em `next.config.mjs`.
