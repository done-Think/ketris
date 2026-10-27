import { Prisma } from '@prisma/client'

const accented = 'ÁÀÃÂÄáàãâäÉÈÊËéèêëÍÌÎÏíìîïÓÒÕÔÖóòõôöÚÙÛÜúùûüÇçÑñ'
const plain = 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn'

export function normalizedDirectoryTerm(q: string | undefined): string | null {
  const value = q?.trim()
  if (!value) return null
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\\%_]/g, '\\$&')
  return `%${normalized}%`
}

export function normalizedSearchText(columns: Prisma.Sql[]): Prisma.Sql {
  return Prisma.sql`lower(translate(concat_ws(' ', ${Prisma.join(columns)}), ${accented}, ${plain}))`
}
