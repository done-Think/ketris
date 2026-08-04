import { TenantSlugAlreadyInUseError } from '../../domain/errors'
import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { TenantRepository } from '../ports/tenant-repository.port'

export interface CreateTenantInput {
  nome: string
  slug: string
}

export type CreateTenantOutput = TenantSummary

export class CreateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    const existing = await this.tenantRepository.findBySlug(input.slug)

    if (existing) {
      throw new TenantSlugAlreadyInUseError()
    }

    return this.tenantRepository.create({ nome: input.nome, slug: input.slug })
  }
}
