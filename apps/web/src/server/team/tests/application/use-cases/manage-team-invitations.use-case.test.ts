import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmailAlreadyInUseError } from '@server/auth/domain/errors'

import {
  AcceptTeamInvitationUseCase,
  CancelTeamInvitationUseCase,
  GetTeamInvitationUseCase,
  InviteBrokerUseCase,
  ResendTeamInvitationUseCase,
} from '../../../application/use-cases/manage-team-invitations.use-case'
import {
  TeamInvitationAlreadyAcceptedError,
  TeamInvitationExpiredError,
  TeamInvitationHasPortfolioError,
  TeamInvitationNotFoundError,
} from '../../../domain/errors'
import { hashTeamInvitationToken } from '../../../domain/team-invitation-token'
import type { StoredTeamInvitation } from '../../../types/team-repository'
import { invitationRepository, owner, staff, teamRepository } from './team-fixtures'

const now = new Date('2026-10-20T12:00:00.000Z')
const stored: StoredTeamInvitation = {
  userId: 'agent-9',
  tenantId: 'tenant-1',
  tenantName: 'Imobiliária Horizonte',
  name: 'Bruna',
  email: 'bruna@example.test',
  expiresAt: new Date('2026-10-27T12:00:00.000Z'),
  acceptedAt: null,
}
const hasher = { hash: vi.fn(async (value: string) => `hash:${value}`), compare: vi.fn() }
const mailer = { send: vi.fn() }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.NEXTAUTH_URL = 'https://app.ketris.test'
})

describe('InviteBrokerUseCase', () => {
  it('cria o acesso sem senha conhecida e envia o link de 7 dias por e-mail', async () => {
    const invitations = invitationRepository({ create: vi.fn().mockResolvedValue(stored) })
    const team = teamRepository([staff({ id: 'owner-1', name: 'Dona', role: 'OWNER' })])
    mailer.send.mockResolvedValue(undefined)

    const result = await new InviteBrokerUseCase(
      team,
      invitations,
      hasher,
      mailer,
      () => now,
    ).execute({ ...owner, name: ' Bruna ', email: ' Bruna@Example.test ', locale: 'pt-BR' })

    expect(result).toEqual({ brokerId: 'agent-9', emailDelivered: true })
    const created = vi.mocked(invitations.create).mock.calls[0][0]
    expect(created).toMatchObject({
      tenantId: 'tenant-1',
      name: 'Bruna',
      email: 'bruna@example.test',
      expiresAt: new Date('2026-10-27T12:00:00.000Z'),
      actor: { id: 'owner-1', name: 'Dona' },
    })
    expect(created.passwordHash).toMatch(/^hash:/)
    const email = mailer.send.mock.calls[0][0]
    const token = new URL(email.text.match(/https:\/\/\S+/)[0]).searchParams.get('token')
    expect(created.tokenHash).toBe(hashTeamInvitationToken(token ?? ''))
    expect(email).toMatchObject({ to: 'bruna@example.test' })
    expect(email.html).toContain('Imobiliária Horizonte')
    expect(email.html).not.toContain(created.passwordHash)
  })

  it('avisa quando o e-mail falha sem desfazer o convite', async () => {
    const invitations = invitationRepository({ create: vi.fn().mockResolvedValue(stored) })
    mailer.send.mockRejectedValue(new Error('ses down'))
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const result = await new InviteBrokerUseCase(
      teamRepository([staff({ id: 'owner-1', role: 'OWNER' })]),
      invitations,
      hasher,
      mailer,
    ).execute({ ...owner, name: 'Bruna', email: 'bruna@example.test', locale: 'pt-BR' })

    expect(result.emailDelivered).toBe(false)
  })

  it('recusa e-mail já usado na imobiliária', async () => {
    const invitations = invitationRepository({ isEmailInUse: vi.fn().mockResolvedValue(true) })

    await expect(
      new InviteBrokerUseCase(teamRepository(), invitations, hasher, mailer).execute({
        ...owner,
        name: 'Bruna',
        email: 'bruna@example.test',
        locale: 'pt-BR',
      }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError)
    expect(invitations.create).not.toHaveBeenCalled()
  })
})

describe('reenvio e cancelamento', () => {
  it('reenvia com um token novo e prazo renovado', async () => {
    const invitations = invitationRepository({
      findPendingByUser: vi.fn().mockResolvedValue(stored),
    })
    mailer.send.mockResolvedValue(undefined)

    await new ResendTeamInvitationUseCase(
      teamRepository([staff({ id: 'owner-1', role: 'OWNER' })]),
      invitations,
      mailer,
      () => now,
    ).execute({ ...owner, brokerId: 'agent-9', locale: 'en-US' })

    expect(invitations.replaceToken).toHaveBeenCalledWith(
      'tenant-1',
      'agent-9',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      new Date('2026-10-27T12:00:00.000Z'),
      now,
    )
    expect(mailer.send.mock.calls[0][0].subject).toContain('Imobiliária Horizonte')
  })

  it('só cancela convite pendente sem carteira', async () => {
    await expect(
      new CancelTeamInvitationUseCase(invitationRepository()).execute({
        ...owner,
        brokerId: 'agent-9',
      }),
    ).rejects.toBeInstanceOf(TeamInvitationNotFoundError)
    const withPortfolio = invitationRepository({
      findPendingByUser: vi.fn().mockResolvedValue(stored),
      hasPortfolio: vi.fn().mockResolvedValue(true),
    })
    await expect(
      new CancelTeamInvitationUseCase(withPortfolio).execute({ ...owner, brokerId: 'agent-9' }),
    ).rejects.toBeInstanceOf(TeamInvitationHasPortfolioError)
    expect(withPortfolio.deleteInvitedUser).not.toHaveBeenCalled()
  })
})

describe('aceite do convite', () => {
  it('mostra a situação do convite pelo token', async () => {
    const invitations = invitationRepository({
      findByTokenHash: vi.fn().mockResolvedValue(stored),
    })

    await expect(
      new GetTeamInvitationUseCase(invitations, () => now).execute('token-valido-123456'),
    ).resolves.toMatchObject({ status: 'VALID', agencyName: 'Imobiliária Horizonte' })
    await expect(
      new GetTeamInvitationUseCase(invitations, () => new Date('2026-11-01')).execute(
        'token-valido-123456',
      ),
    ).resolves.toMatchObject({ status: 'EXPIRED' })
    expect(invitations.findByTokenHash).toHaveBeenCalledWith(
      hashTeamInvitationToken('token-valido-123456'),
    )
  })

  it('define a senha uma única vez dentro do prazo', async () => {
    const invitations = invitationRepository({
      findByTokenHash: vi.fn().mockResolvedValue(stored),
    })

    await expect(
      new AcceptTeamInvitationUseCase(invitations, hasher, () => now).execute({
        token: 'token-valido-123456',
        password: 'senha-forte-123',
      }),
    ).resolves.toEqual({ email: 'bruna@example.test', tenantId: 'tenant-1' })
    expect(invitations.accept).toHaveBeenCalledWith(
      hashTeamInvitationToken('token-valido-123456'),
      'hash:senha-forte-123',
      now,
    )
  })

  it('recusa convite expirado, já usado ou inexistente', async () => {
    const make = (value: StoredTeamInvitation | null) =>
      new AcceptTeamInvitationUseCase(
        invitationRepository({ findByTokenHash: vi.fn().mockResolvedValue(value) }),
        hasher,
        () => now,
      ).execute({ token: 'token-valido-123456', password: 'senha-forte-123' })

    await expect(make(null)).rejects.toBeInstanceOf(TeamInvitationNotFoundError)
    await expect(make({ ...stored, acceptedAt: now })).rejects.toBeInstanceOf(
      TeamInvitationAlreadyAcceptedError,
    )
    await expect(make({ ...stored, expiresAt: now })).rejects.toBeInstanceOf(
      TeamInvitationExpiredError,
    )
  })
})
