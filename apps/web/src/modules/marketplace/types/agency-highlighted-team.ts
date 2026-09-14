import type { AgencyProfile } from './agency'
import type { BrokerProfile } from './broker'

export type AgencyHighlightedTeamProps = {
  brand: AgencyProfile['brand']
  brokers: BrokerProfile[]
}
