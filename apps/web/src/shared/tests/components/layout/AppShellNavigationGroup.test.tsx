import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AppShellNavigationGroup,
  isAppShellNavChildActive,
} from '@shared/components/layout/AppShellNavigationGroup'
import { appShellNavigationItems } from '@shared/components/layout/app-shell-navigation-items'

const navigation = vi.hoisted(() => ({ pathname: '/dashboard/face_check', query: '' }))

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(navigation.query) }))
vi.mock('@/i18n/navigation', async () => {
  const React = await import('react')
  return {
    usePathname: () => navigation.pathname,
    Link: React.forwardRef<
      HTMLAnchorElement,
      Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
        href: string | { pathname: string; query?: Record<string, string> }
      }
    >(function NavigationLink({ href, ...props }, ref) {
      const path =
        typeof href === 'string'
          ? href
          : `${href.pathname}${href.query ? `?${new URLSearchParams(href.query)}` : ''}`
      return <a ref={ref} href={path} {...props} />
    }),
  }
})

const faceCheck = appShellNavigationItems.find((item) => item.href === '/dashboard/face_check')
if (!faceCheck) throw new Error('Face Check navigation is required')
const children = faceCheck.children ?? []

describe('Face Check sidebar navigation', () => {
  beforeEach(() => {
    navigation.pathname = '/dashboard/face_check'
    navigation.query = ''
  })

  it('declares only Sessions, Review and Settings under the overview parent', () => {
    expect(children.map((child) => child.labelKey)).toEqual([
      'faceCheckSessions',
      'faceCheckReview',
      'faceCheckSettings',
    ])
    const candidate = appShellNavigationItems.find(
      (item) => item.href === '/dashboard/face_check/my-verifications',
    )
    expect(candidate?.labelKey).toBe('faceCheckMyVerifications')
    expect(candidate?.children).toBeUndefined()
    expect(candidate?.roles).toBeUndefined()
  })

  it.each([
    ['/dashboard/face_check/sessions', '', true, false],
    ['/dashboard/face_check/sessions', 'filter=review', false, true],
    ['/dashboard/face_check/sessions', 'filter=open', true, false],
    ['/dashboard/face_check/sessions/session-id', '', true, false],
    ['/dashboard/face_check/sessions/session-id', 'filter=review', true, false],
  ] as const)('selects the correct child for %s?%s', (pathname, query, sessions, review) => {
    const params = new URLSearchParams(query)
    expect(isAppShellNavChildActive(children[0], children, pathname, params)).toBe(sessions)
    expect(isAppShellNavChildActive(children[1], children, pathname, params)).toBe(review)
  })

  it('opens children on the active section and keeps the parent linked to Overview', () => {
    render(
      <AppShellNavigationGroup item={faceCheck} active collapsed={false} onNavigate={vi.fn()} />,
    )
    expect(screen.getByRole('link', { name: 'Face Check' })).toHaveAttribute(
      'href',
      '/dashboard/face_check',
    )
    expect(screen.getByRole('link', { name: 'Face Check' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Sessões' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Visão geral' })).not.toBeInTheDocument()
  })

  it('supports explicit keyboard expansion while collapsed and accessible child labels', async () => {
    navigation.pathname = '/dashboard/properties'
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    render(
      <AppShellNavigationGroup item={faceCheck} active={false} collapsed onNavigate={onNavigate} />,
    )
    expect(screen.queryByRole('link', { name: 'Sessões' })).not.toBeInTheDocument()
    const expand = screen.getByRole('button', { name: 'Expandir opções de Face Check' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')
    expect(expand).toHaveAttribute('aria-controls')
    expand.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Recolher opções de Face Check' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await user.click(await screen.findByRole('link', { name: 'Revisão' }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('link', { name: 'Revisão' })).toHaveAttribute(
      'href',
      '/dashboard/face_check/sessions?filter=review',
    )
  })

  it('marks only Review active when filter=review is present', () => {
    navigation.pathname = '/dashboard/face_check/sessions'
    navigation.query = 'filter=review'
    render(
      <AppShellNavigationGroup item={faceCheck} active collapsed={false} onNavigate={vi.fn()} />,
    )
    expect(screen.getByRole('link', { name: 'Revisão' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Sessões' })).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('link', { name: 'Face Check' })).not.toHaveAttribute('aria-current')
  })
})
