import { cp, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const source = path.dirname(require.resolve('pdfjs-dist/package.json'))
const destination = path.join(root, 'apps/web/public/face_check/pdf')
await mkdir(destination, { recursive: true })
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) {
  await cp(path.join(source, directory), path.join(destination, directory), { recursive: true })
}
await cp(path.join(source, 'LICENSE'), path.join(destination, 'LICENSE'))
console.info('Face Check PDF assets prepared.')
