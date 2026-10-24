import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const expectedVersion = '16.3.1'
const require = createRequire(import.meta.url)

export function patchFlightPerformanceSource(source) {
  const matches = [...source.matchAll(/if \(supportsUserTiming\) \{/g)]
  if (
    matches.length === 0 &&
    (source.match(/if \(supportsUserTiming && 0 <= childrenEndTime[\w$]*\) \{/g) ?? []).length === 2
  )
    return source
  if (matches.length !== 2)
    throw new Error(
      'Formato inesperado do cliente RSC; revise o patch de desempenho antes de continuar.',
    )
  let result = source
  for (const match of matches.reverse()) {
    const offset = match.index + match[0].length
    const end = source.slice(offset, offset + 7000).match(/end: (childrenEndTime[\w$]*),/)
    if (!end) throw new Error('Tempo final de RSC não encontrado; o patch não foi aplicado.')
    result =
      result.slice(0, match.index) +
      `if (supportsUserTiming && 0 <= ${end[1]}) {` +
      result.slice(offset)
  }
  return result
}

export async function patchInstalledNext() {
  const packagePath = require.resolve('next/package.json')
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'))
  if (pkg.version !== expectedVersion)
    throw new Error(
      `Revise ou remova o patch de desempenho: esperado Next ${expectedVersion}, instalado ${pkg.version}.`,
    )
  const root = path.dirname(packagePath)
  const changes = []
  for (const bundler of ['webpack', 'turbopack']) {
    for (const target of ['browser', 'edge']) {
      const file = path.join(
        root,
        `dist/compiled/react-server-dom-${bundler}/cjs/react-server-dom-${bundler}-client.${target}.development.js`,
      )
      const source = await readFile(file, 'utf8')
      changes.push({ file, source, patched: patchFlightPerformanceSource(source) })
    }
  }
  for (const change of changes) {
    if (change.source !== change.patched) await writeFile(change.file, change.patched)
  }
  process.stdout.write('Next dev: proteção de medições RSC negativas verificada.\n')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await patchInstalledNext()
