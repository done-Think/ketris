import type { BrokerTeamMenuAction, TeamMember, TeamMemberState } from '../types/team'
import type { TransferDestination } from '../types/broker-team'

const BRAZIL_COUNTRY_CODE = '55'

export function teamMemberState(member: TeamMember): TeamMemberState {
  if (member.invitation) return 'invited'

  return member.active ? 'active' : 'inactive'
}

const menuActionsByState: Record<TeamMemberState, readonly BrokerTeamMenuAction[]> = {
  active: ['performance', 'editGoal', 'transferPortfolio', 'scheduleOneOnOne', 'deactivate'],
  inactive: ['performance', 'transferPortfolio', 'activate'],
  invited: ['resendInvitation', 'cancelInvitation'],
}

export function teamMemberMenuActions(member: TeamMember): readonly BrokerTeamMenuAction[] {
  return menuActionsByState[teamMemberState(member)]
}

function phoneDigits(phone: string | null): string | null {
  const digits = phone?.replace(/\D/g, '') ?? ''
  if (digits.length < 10) return null

  return digits.length <= 11 ? `${BRAZIL_COUNTRY_CODE}${digits}` : digits
}

export function teamMemberContactLinks(member: TeamMember) {
  const phone = phoneDigits(member.phone)

  return {
    whatsapp: phone ? `https://wa.me/${phone}` : null,
    email: `mailto:${member.email}`,
    call: phone ? `tel:+${phone}` : null,
  }
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase().trim()
}

export function matchesTeamSearch(member: TeamMember, search: string): boolean {
  const query = normalize(search)
  if (!query) return true

  return [member.name, member.email, member.headline ?? '', ...member.specialties].some((value) =>
    normalize(value).includes(query),
  )
}

export function transferDestinations(
  members: readonly TeamMember[],
  sourceId: string,
  self: TransferDestination | null,
): TransferDestination[] {
  const brokers = members
    .filter((member) => member.id !== sourceId && teamMemberState(member) === 'active')
    .map((member) => ({ id: member.id, label: member.name }))

  return self && self.id !== sourceId ? [self, ...brokers] : brokers
}

export function responseTimeParts(minutes: number) {
  if (minutes < 60) return { unit: 'minutes', minutes } as const
  if (minutes < 24 * 60)
    return { unit: 'hours', hours: Math.floor(minutes / 60), minutes: minutes % 60 } as const

  return { unit: 'days', days: Math.round(minutes / (24 * 60)) } as const
}
