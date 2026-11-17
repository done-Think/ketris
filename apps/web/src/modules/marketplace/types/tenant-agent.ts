import type { components } from '@shared/types/generated/api'

export type TenantAgent = Pick<
  components['schemas']['TeamMember'],
  'id' | 'name' | 'email' | 'active' | 'invitation'
>

export type ListTeamMembersResponse = Pick<components['schemas']['TeamOverviewResponse'], 'members'>
