import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { collectApiAliases, apiAliasFiles } from '../api-contract-aliases.mjs'

test('discovers domain DTOs and generates bridges using native platform paths', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ketris-api-aliases-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const directory = path.join(root, 'apps/web/src/server/demo/types')
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(
    path.join(directory, 'http.ts'),
    "import type { z } from 'zod'\nimport { requestSchema } from '../schemas/request'\nexport type RequestDTO = z.infer<typeof requestSchema>\n",
  )
  const aliases = collectApiAliases(root, () => ({
    requestSchema: {
      _def: { openapi: { _internal: { refId: 'DemoRequest' } } },
    },
  }))
  assert.equal(aliases.length, 1)
  const bridges = apiAliasFiles(root, aliases, { DemoRequest: {} })
  assert.equal(bridges[0].file, path.join(root, 'apps/web/src/shared/types/generated/demo/http.ts'))
  assert.match(bridges[0].source, /RequestDTO/)
})
