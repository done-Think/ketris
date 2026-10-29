import { describe, expect, it } from 'vitest'

import { formatDashboardDate } from '../../utils/format-dashboard-date'

const date = new Date('2026-10-26T15:00:00.000Z')

describe('formatDashboardDate', () => {
  it('escreve a data por extenso no idioma, com a primeira letra maiúscula', () => {
    expect(formatDashboardDate('pt-BR', date)).toBe('Segunda-feira, 26 de outubro de 2026')
    expect(formatDashboardDate('en-US', date)).toBe('Monday, October 26, 2026')
    expect(formatDashboardDate('es-ES', date)).toBe('Lunes, 26 de octubre de 2026')
  })

  it('usa o fuso da operação, não o do navegador', () => {
    expect(formatDashboardDate('pt-BR', new Date('2026-10-27T02:00:00.000Z'))).toBe(
      'Segunda-feira, 26 de outubro de 2026',
    )
  })
})
