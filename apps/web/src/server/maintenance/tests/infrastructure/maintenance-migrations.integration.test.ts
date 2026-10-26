import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { Client } from 'pg'
import { describe, expect, it } from 'vitest'
import { getDatabaseUrl } from '@server/db/database-url'

describe('Maintenance legacy migrations', () => {
  it('imports exact provider snapshots per tenant without rewriting legacy history or custom categories', async () => {
    const client = new Client({ connectionString: getDatabaseUrl() })
    const schema = 'maintenance_upgrade_' + randomUUID().replaceAll('-', '')
    await client.connect()
    try {
      await client.query('BEGIN')
      await client.query(`CREATE SCHEMA "${schema}"`)
      await client.query(`SET LOCAL search_path TO "${schema}", public`)
      for (const table of [
        'tenants',
        'chamados_manutencao',
        'atividades_chamado_manutencao',
        'anexos_chamado_manutencao',
      ]) {
        await client.query(`CREATE TABLE "${table}" (LIKE public."${table}" INCLUDING ALL)`)
      }
      await client.query(
        'ALTER TABLE chamados_manutencao DROP COLUMN "prestadorId"; ALTER TABLE atividades_chamado_manutencao DROP COLUMN "systemAction"; ALTER TABLE anexos_chamado_manutencao DROP COLUMN "uploadId"',
      )
      await client.query(
        `INSERT INTO tenants (id,nome,slug,"updatedAt") VALUES ('t1','Upgrade','upgrade-t1',now()),('t2','Other','upgrade-t2',now())`,
      )
      const values = [
        'João, "filho"',
        '51999990000',
        'repair@example.test',
        'Primeira linha\nSegunda, ç',
      ]
      const fixtures = [
        ['a', 't1', 'Hidráulica', values[1]],
        ['b', 't1', 'Elétrica', values[1]],
        ['c', 't1', 'Categoria antiga', null],
        ['d', 't2', 'Pintura', values[1]],
      ]
      for (const [id, tenant, category, phone] of fixtures) {
        await client.query(
          `INSERT INTO chamados_manutencao(id,"tenantId","imovelId",categoria,titulo,descricao,"abertoPorId","abertoPorNome","prestadorNome","prestadorTelefone","prestadorEmail","prestadorObservacoes","createdAt","updatedAt") VALUES($1,$2,'historical-property',$3,'Title','Description','historical-author','Historical author',$4,$5,$6,$7,'2020-01-01','2020-02-01')`,
          [id, tenant, category, values[0], phone, values[2], values[3]],
        )
      }
      await client.query(
        `INSERT INTO atividades_chamado_manutencao(id,"chamadoId",tipo,mensagem,"autorId","createdAt") VALUES('activity','a','NOTA','Historical note','historical-author','2020-01-01'); INSERT INTO anexos_chamado_manutencao(id,"chamadoId",nome,url) VALUES('attachment','a','old.png','/existing-photo.png')`,
      )
      const before = (
        await client.query(
          'SELECT id,"updatedAt"::text,"abertoPorId","prestadorObservacoes" FROM chamados_manutencao ORDER BY id',
        )
      ).rows
      for (const migration of [
        '20261026160000_maintenance_provider_catalog_and_categories',
        '20261026170000_maintenance_direct_attachment_uploads',
      ]) {
        await client.query(
          await readFile(path.resolve('prisma/migrations', migration, 'migration.sql'), 'utf8'),
        )
      }
      const providers = (await client.query('SELECT * FROM prestadores_manutencao')).rows
      expect(providers).toHaveLength(3)
      expect(
        providers.every(
          (provider) => provider.createdById === null && provider.updatedById === null,
        ),
      ).toBe(true)
      expect(
        providers.find((provider) => provider.tenantId === 't1' && provider.telefone === values[1])
          ?.fingerprint,
      ).toBe(createHash('sha256').update(JSON.stringify(values)).digest('hex'))
      const rows = (
        await client.query('SELECT id,"prestadorId",categoria FROM chamados_manutencao ORDER BY id')
      ).rows
      expect(rows[0].prestadorId).toBe(rows[1].prestadorId)
      expect(rows[0].prestadorId).not.toBe(rows[2].prestadorId)
      expect(rows[0].prestadorId).not.toBe(rows[3].prestadorId)
      expect(rows.map((row) => row.categoria)).toEqual([
        'PLUMBING',
        'ELECTRICAL',
        'Categoria antiga',
        'PAINTING',
      ])
      expect(
        (
          await client.query(
            'SELECT id,"updatedAt"::text,"abertoPorId","prestadorObservacoes" FROM chamados_manutencao ORDER BY id',
          )
        ).rows,
      ).toEqual(before)
      expect(
        (
          await client.query(
            'SELECT "autorId",mensagem,"systemAction" FROM atividades_chamado_manutencao',
          )
        ).rows,
      ).toEqual([{ autorId: 'historical-author', mensagem: 'Historical note', systemAction: null }])
      expect(
        (await client.query('SELECT "uploadId",url FROM anexos_chamado_manutencao')).rows,
      ).toEqual([{ uploadId: null, url: '/existing-photo.png' }])
      expect(
        (await client.query('SELECT count(*)::int AS n FROM atividades_prestador_manutencao'))
          .rows[0].n,
      ).toBe(0)
    } finally {
      await client.query('ROLLBACK')
      await client.end()
    }
  })
})
