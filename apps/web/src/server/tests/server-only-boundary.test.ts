import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const srcRoot = path.resolve(__dirname, '../..')

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) return entry === 'tests' ? [] : listFiles(full)
    return /\.(ts|tsx)$/.test(entry) ? [full] : []
  })
}

describe('fronteira server-only', () => {
  it('todo container.ts e o client Prisma importam server-only', () => {
    const files = [
      ...listFiles(path.join(srcRoot, 'server')).filter((file) => file.endsWith('/container.ts')),
      path.join(srcRoot, 'server/db/prisma.ts'),
    ]

    expect(files.length).toBeGreaterThan(10)
    const missing = files.filter(
      (file) => !readFileSync(file, 'utf8').startsWith("import 'server-only'"),
    )
    expect(missing.map((file) => path.relative(srcRoot, file))).toEqual([])
  })

  it('nenhum arquivo de src/shared importa containers ou o client Prisma do servidor', () => {
    const offenders = listFiles(path.join(srcRoot, 'shared')).filter((file) =>
      /from '@server\/(?:[\w-]+\/container|db\/)/.test(readFileSync(file, 'utf8')),
    )

    expect(offenders.map((file) => path.relative(srcRoot, file))).toEqual([])
  })
})
