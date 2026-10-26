import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDatabaseUrl } from '../src/server/db/database-url'
import { protectLegacyContractCpfs } from '../src/server/contracts/infrastructure/protect-legacy-contract-cpfs'

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: getDatabaseUrl() }) })

async function main() {
  const count = await protectLegacyContractCpfs(prisma)
  console.log(`Proteção de CPFs concluída: ${count} registros atualizados.`)
}

main()
  .catch(() => {
    console.error(
      'Não foi possível concluir a proteção dos CPFs. Verifique a configuração e tente novamente.',
    )
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
