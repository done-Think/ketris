import { LEAD_SOURCES, leadSourceKey } from '@shared/config/lead-sources'
import type { CreateLeadStep, LeadSourceOption, LeadStageOption } from '../types/lead'

export const createLeadSteps: CreateLeadStep[] = [
  {
    key: 'contact',
    labelKey: 'contact',
    fields: ['name', 'phone', 'email'],
  },
  {
    key: 'interest',
    labelKey: 'interest',
    fields: ['interest', 'budget', 'source'],
  },
  {
    key: 'review',
    labelKey: 'review',
    fields: ['notes'],
  },
]

export const leadSourceOptions: LeadSourceOption[] = LEAD_SOURCES.map((value) => ({
  value,
  labelKey: leadSourceKey(value),
}))

export const leadStageOptions: LeadStageOption[] = [
  { value: 'NEW', labelKey: 'new' },
  { value: 'IN_CONTACT', labelKey: 'contacted' },
  { value: 'VISIT_SCHEDULED', labelKey: 'visitScheduled' },
  { value: 'PROPOSAL', labelKey: 'proposal' },
]
