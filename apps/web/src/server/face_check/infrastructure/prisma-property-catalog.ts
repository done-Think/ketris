import type { FaceCheckActor, FaceCheckDatabase } from '../types/access'
import { FaceCheckAccessScope } from './access-scope'

export interface FaceCheckPropertyOption {
  id: string
  title: string
  address?: string
}

export class PrismaFaceCheckPropertyCatalog {
  constructor(private readonly database: FaceCheckDatabase) {}

  async list(actor: FaceCheckActor): Promise<FaceCheckPropertyOption[]> {
    const current = await new FaceCheckAccessScope(this.database, { actor }).actor()
    const properties = await this.database.property.findMany({
      where: {
        tenantId: current.tenantId,
        ...(current.role === 'AGENT' ? { responsibleId: current.actorId } : {}),
      },
      select: {
        id: true,
        title: true,
        address: { select: { street: true, number: true, city: true, state: true } },
      },
      orderBy: { title: 'asc' },
    })
    return properties.map(({ address, ...property }) => ({
      ...property,
      ...(address
        ? { address: `${address.street}, ${address.number} · ${address.city}/${address.state}` }
        : {}),
    }))
  }
}
