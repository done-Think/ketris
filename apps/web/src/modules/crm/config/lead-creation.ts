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
    fields: ['interest', 'budget', 'source', 'broker', 'stage'],
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
  { value: 'Indicacao', labelKey: 'referral' },
]

export const leadStageOptions: LeadStageOption[] = [
  { value: 'Novo', labelKey: 'new' },
  { value: 'Em contato', labelKey: 'contacted' },
  { value: 'Visita marcada', labelKey: 'visitScheduled' },
  { value: 'Proposta', labelKey: 'proposal' },
]
