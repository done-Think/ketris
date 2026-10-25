import { describe, expect, it } from 'vitest'

import { RENTER_TENANT_SLUG } from '../../../domain/registration-policy'
import { SearchRegisterableTenantsUseCase } from '../../../application/use-cases/search-registerable-tenants.use-case'
import { createDeps, tenant } from './fixtures'

describe('SearchRegisterableTenantsUseCase', () => {
  it('searches agencies by name while excluding the shared renter tenant', async () => {
    const { accounts } = createDeps()
    expect(
      await new SearchRegisterableTenantsUseCase(accounts).execute({ query: 'Imobiliária' }),
    ).toEqual([tenant])
    expect(accounts.searchByName).toHaveBeenCalledWith('Imobiliária', [RENTER_TENANT_SLUG])
  })
})
