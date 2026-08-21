import type { Opportunity } from './opportunity'

export type OpportunityInterestDetails = {
  interest: string
  budget: string
  deadline: string
}

export type SuggestedPropertyPresentation = {
  id: string
  title: string
  imageUrl?: string
  meta: string
  priceLabel: string
  matchPercentage?: number
  href?: string
}

export type OpportunityActivityKind = 'phone' | 'email' | 'opportunity'

export type OpportunityActivityPresentation = {
  id: string
  kind: OpportunityActivityKind
  title: string
  dateLabel: string
  description: string
}

export type OpportunityNextActionKind = 'visit' | 'followUp'

export type OpportunityNextActionPresentation = {
  id: string
  kind: OpportunityNextActionKind
  title: string
  scheduleLabel: string
}

export type OpportunityDetailStagePresentation = {
  label: string
  color: string
  softColor: string
}

export type OpportunityDetailPresentation = {
  interestDetails: OpportunityInterestDetails
  suggestedProperties: readonly SuggestedPropertyPresentation[]
  activities: readonly OpportunityActivityPresentation[]
  nextActions: readonly OpportunityNextActionPresentation[]
}

export type OpportunityDetailFixture = {
  opportunity: Opportunity
  stage: OpportunityDetailStagePresentation
  presentation: OpportunityDetailPresentation
}
