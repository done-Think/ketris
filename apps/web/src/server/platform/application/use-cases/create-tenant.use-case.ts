import { TenantSlugAlreadyInUseError } from '../../domain/errors'
import type { TenantRepository } from '../ports/tenant-repository.port'
import type { CreateTenantInput, CreateTenantOutput } from '../../types/use-case-inputs'

export class CreateTenantUseCase {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    const existing = await this.tenantRepository.findBySlug(input.slug)

    if (existing) {
      throw new TenantSlugAlreadyInUseError()
    }

    return this.tenantRepository.create({
      name: input.name,
      slug: input.slug,
      accountType: input.accountType,
      status: input.status,
    })
  }
}
