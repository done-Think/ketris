import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MetricCard } from '../../components/MetricCard'

describe('MetricCard', () => {
  it.each([
    ['open', 'Abertos', '6', 'FolderOpenOutlinedIcon'],
    ['urgent', 'Urgentes', '12', 'WarningAmberRoundedIcon'],
    ['averageResolution', 'Tempo médio resolução', '0,0 dias', 'AccessTimeOutlinedIcon'],
  ] as const)('shows the whole %s label, the value and its icon', (tone, label, value, icon) => {
    render(<MetricCard tone={tone} label={label} value={value} />)

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByTestId(icon)).toBeInTheDocument()
  })
})
