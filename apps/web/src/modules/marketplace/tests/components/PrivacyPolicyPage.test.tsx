import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../components/MarketplaceHeader', () => ({ MarketplaceHeader: () => null }))
vi.mock('../../components/MarketplaceBreadcrumbs', () => ({ MarketplaceBreadcrumbs: () => null }))
vi.mock('@shared/components/layout', () => ({ SiteFooter: () => null }))
vi.mock('../../hooks/use-marketplace-navigation', () => ({
  useMarketplaceNavigation: () => ({ footerColumns: [], legalLinks: [] }),
}))

import { PrivacyPolicyPage } from '../../components/PrivacyPolicyPage'

describe('PrivacyPolicyPage', () => {
  it('explains the Instagram permissions, storage, disconnection and deletion', () => {
    render(
      <PrivacyPolicyPage
        siteOrigin="https://ketris.example"
        contactEmail="privacidade@ketris.example"
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Política de Privacidade' })).toBeVisible()
    expect(screen.getByText(/Atualizada em 24 de novembro de 2026/)).toBeVisible()
    expect(screen.getByText(/^instagram_business_basic:/)).toBeVisible()
    expect(screen.getByText(/^instagram_business_content_publish:/)).toBeVisible()
    expect(screen.getByText(/criptografado \(AES-256-GCM\)/)).toBeVisible()
    expect(screen.getByText(/Amazon S3/)).toBeVisible()
    expect(screen.getByText(/clique em Desconectar no cartão Meu Instagram/)).toBeVisible()
    expect(
      screen.getByText(/https:\/\/ketris\.example\/api\/instagram\/data-deletion/),
    ).toBeVisible()
    expect(screen.getByText(/privacidade@ketris\.example/)).toBeVisible()
  })

  it('points to the agency administrator when no privacy mailbox is configured', () => {
    render(<PrivacyPolicyPage siteOrigin="https://ketris.example" contactEmail={null} />)

    expect(screen.getByText(/administrador da sua imobiliária/)).toBeVisible()
  })
})
