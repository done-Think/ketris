import { Prisma } from '@prisma/client'

// Database value of PerfilPublicoStatus.PUBLISHED (the enum is @map'ped), for raw queries.
export const PUBLISHED_PROFILE_STATUS = 'PUBLICADO'

// Postgres has no unaccent extension here, so accents are folded with translate(): the same
// accent- and case-insensitive match the directory pages used to do in the browser.
const accented = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ'
const plain = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'

function foldSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

// `searchable` is the SQL text to search in; no query matches every row.
export function profileSearchCondition(searchable: Prisma.Sql, q: string | undefined) {
  const term = q?.trim()
  if (!term) return Prisma.sql`TRUE`

  const pattern = `%${foldSearchText(term).replace(/[\\%_]/g, (char) => `\\${char}`)}%`

  return Prisma.sql`lower(translate(${searchable}, ${accented}, ${plain})) LIKE ${pattern}`
}

// Keeps the order of the page ids when loading the full rows by id.
export function orderByIds<TItem>(ids: string[], items: TItem[], idOf: (item: TItem) => string) {
  const byId = new Map(items.map((item) => [idOf(item), item]))

  return ids.flatMap((id) => {
    const item = byId.get(id)
    return item ? [item] : []
  })
}
