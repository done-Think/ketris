import assert from 'node:assert/strict'
import test from 'node:test'
import { findConventionViolations } from '../check-code-conventions.mjs'

for (const [name, file, source, count] of [
  ['rejects duplicated currency', 'apps/web/src/modules/a.ts', "f(1, {currency: 'BRL'})", 1],
  [
    'allows the currency definition',
    'apps/web/src/shared/config/currency.ts',
    "const x = {currency: 'BRL'}",
    0,
  ],
  [
    'rejects weakened types',
    'apps/web/src/server/db/a.ts',
    'const x = globalThis as unknown as Client',
    1,
  ],
  ['allows unknown inputs', 'apps/web/src/server/db/a.ts', 'function f(x: unknown) {}', 0],
  [
    'rejects numeric messages',
    'apps/web/src/server/a/schemas/input.ts',
    "z.number().positive('Must be positive')",
    1,
  ],
  [
    'rejects regex messages',
    'apps/web/src/server/a/schemas/input.ts',
    "z.string().regex(/x/, 'Invalid code')",
    1,
  ],
  [
    'rejects quoted message fields',
    'apps/web/src/server/a/schemas/input.ts',
    "z.string({'required_error':'Required'})",
    1,
  ],
  [
    'rejects phrase keys',
    'apps/web/src/server/a/schemas/input.ts',
    "z.string().refine(f, {message:'Invalid phone'})",
    1,
  ],
  [
    'rejects positional messages',
    'apps/web/src/server/a/schemas/input.ts',
    "z.string().min(1, 'Required')",
    1,
  ],
  [
    'allows typed keys',
    'apps/web/src/server/a/schemas/input.ts',
    "z.string().refine(f, validationRefinement('phoneInvalid'))",
    0,
  ],
  [
    'allows response message fields',
    'apps/web/src/server/a/schemas/output.ts',
    'z.object({message:z.string()})',
    0,
  ],
  [
    'allows translated UI messages',
    'apps/web/src/modules/a/schemas/input.ts',
    "z.string().min(1,t('required'))",
    0,
  ],
  [
    'allows test assertions',
    'apps/web/src/server/a/tests/x.test.ts',
    'const x = a as unknown as A',
    0,
  ],
])
  test(name, () => assert.equal(findConventionViolations(file, source).length, count))
