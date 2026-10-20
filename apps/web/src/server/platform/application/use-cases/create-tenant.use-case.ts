import { TenantSlugAlreadyInUseError } from '../../domain/errors'
import type { TenantSummary } from '../../domain/tenant-summary.entity'
import type { NewTenant, TenantRepository } from '../ports/tenant-repository.port'

export type CreateTenantInput = NewTenant

export type CreateTenantOutput = TenantSummary

export class CreateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    const existing = await this.tenantRepository.findBySlug(input.slug)

    if (existing) {
      throw new TenantSlugAlreadyInUseError()
    }

    return this.tenantRepository.create({
      nome: input.nome,
      slug: input.slug,
      accountType: input.accountType,
      status: input.status,
    })
  }
}
