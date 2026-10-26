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

export const leadSourceOptions: LeadSourceOption[] = [
  { value: 'Marketplace', labelKey: 'marketplace' },
  { value: 'WhatsApp', labelKey: 'whatsApp' },
  { value: 'Instagram', labelKey: 'instagram' },
  { value: 'Site', labelKey: 'site' },
  { value: 'Indicação', labelKey: 'referral' },
]

export const leadStageOptions: LeadStageOption[] = [
  { value: 'NOVO', labelKey: 'new' },
  { value: 'EM_CONTATO', labelKey: 'contacted' },
  { value: 'VISITA_MARCADA', labelKey: 'visitScheduled' },
  { value: 'PROPOSTA', labelKey: 'proposal' },
]
