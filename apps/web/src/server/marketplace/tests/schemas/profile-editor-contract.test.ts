import { describe, expect, it } from 'vitest'

import {
  emptyValues as emptyAgencyValues,
  toDraft as toAgencyDraft,
} from '@modules/marketplace/utils/agency-public-profile-editor-adapter'
import {
  emptyValues as emptyBrokerValues,
  toDraft as toBrokerDraft,
} from '@modules/marketplace/utils/public-profile-editor-adapter'

import { saveAgencyProfileRequestSchema } from '../../schemas/agency-profile.schema'
import { saveBrokerProfileRequestSchema } from '../../schemas/broker-profile.schema'

describe('contrato entre os editores de perfil e as rotas de salvar', () => {
  it('o rascunho do corretor passa no schema estrito do servidor', () => {
    const draft = toBrokerDraft({
      ...emptyBrokerValues,
      displayName: 'Marina Costa',
      neighborhoods: 'Jardins, Moema',
      specialties: 'Alto padrão',
      primaryColor: '#F30274',
    })

    expect(saveBrokerProfileRequestSchema.safeParse(draft).error?.issues).toBeUndefined()
  })

  it('o rascunho da imobiliária, com equipe, passa no schema estrito do servidor', () => {
    const draft = toAgencyDraft({
      ...emptyAgencyValues,
      displayName: 'Imobiliária Horizonte',
      coverage: 'Jardins',
      yearsInMarket: '12',
      team: [{ usuarioId: 'usuario-1', name: 'Marina' }],
    })

    expect(saveAgencyProfileRequestSchema.safeParse(draft).error?.issues).toBeUndefined()
  })
})
