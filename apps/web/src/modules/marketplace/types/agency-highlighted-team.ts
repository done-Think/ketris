import type { AgencyProfile, AgencyTeamHighlight } from './agency'

export type AgencyHighlightedTeamProps = {
  brand: AgencyProfile['brand']
  team: AgencyTeamHighlight[]
}
