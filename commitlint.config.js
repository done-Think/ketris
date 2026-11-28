// Padrão: `tipo(escopo): assunto` em inglês, no imperativo, minúsculo, sem ponto final, até 100
// caracteres. O escopo é obrigatório e vem da lista fechada abaixo (grafia única: `face-check`).
// O ticket vai no rodapé (`Refs: DTK-NNN`), preenchido por scripts/commit-msg-hook.mjs a partir do
// nome da branch. `Tests-Skipped-By` é o registro de auditoria de quem pulou a validação local.
// Ver README.md, seção "Validação local".

const scopes = [
  // módulos do produto
  'adr',
  'agenda',
  'agency-dashboard',
  'api',
  'auth',
  'bff',
  'contracts',
  'crm',
  'crm-access',
  'crm-contacts',
  'crm-opportunity',
  'crm-pipeline',
  'crm-proposals',
  'crm-ui',
  'dashboard',
  'face-check',
  'financial',
  'i18n',
  'instagram',
  'maintenance',
  'marketplace',
  'platform',
  'properties',
  'registration',
  'team',
  // transversais
  'assets',
  'build',
  'ci',
  'config',
  'db',
  'deploy',
  'deps',
  'docs',
  'e2e',
  'infra',
  'layout',
  'openapi',
  'review',
  'scripts',
  'seed',
  'shared',
  'specs',
  'staging',
  'theme',
  'web',
]

const skipTrailer = /^Tests-Skipped-By: .+ <[^<>\s@]+@[^<>\s@]+> — .{8,}$/

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'tests-skipped-trailer': (parsed) => {
          const lines = (parsed.raw ?? '')
            .split('\n')
            .filter((line) => /^tests-skipped-by:/i.test(line))
          return [
            lines.every((line) => skipTrailer.test(line)),
            'Tests-Skipped-By deve ser "Nome <email> — motivo" (motivo com 8+ caracteres)',
          ]
        },
      },
    },
  ],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-empty': [2, 'never'],
    'scope-enum': [2, 'always', scopes],
    'header-max-length': [2, 'always', 100],
    'tests-skipped-trailer': [2, 'always'],
  },
}
