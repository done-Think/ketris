import type { LEAD_SOURCES, LEAD_SOURCE_KEYS } from '../config/lead-sources'
export type LeadSource = (typeof LEAD_SOURCES)[number]
export type LeadSourceKey = (typeof LEAD_SOURCE_KEYS)[LeadSource]
