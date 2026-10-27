import type { ReactNode } from 'react'

import type { z } from 'zod'

import type { createPlatformAdminSchema } from '../schemas/create-platform-admin-schema'
import type { createUpdatePlatformAdminSchema } from '../schemas/update-platform-admin-schema'

export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export type CreatePlatformAdminFormValues = z.infer<ReturnType<typeof createPlatformAdminSchema>>

export type UpdatePlatformAdminFormValues = z.infer<
  ReturnType<typeof createUpdatePlatformAdminSchema>
>

export interface PlatformAdminAccount {
  id: string
  name: string
  email: string
  role: PlatformAdminRole
  active: boolean
  createdAt: string
  lastAccessAt: string | null
}

export interface CreatePlatformAdminPayload {
  name: string
  email: string
  password: string
  role: PlatformAdminRole
}

export interface UpdatePlatformAdminPayload {
  name: string
  email: string
  role: PlatformAdminRole
}

export interface PlatformAdminResponse {
  admin: PlatformAdminAccount
}

export interface ListPlatformAdminsResponse {
  admins: PlatformAdminAccount[]
}

export interface CreatePlatformAdminInput {
  name: string
  email: string
  password: string
  role: PlatformAdminRole
}

export interface UpdatePlatformAdminInput {
  id: string
  name: string
  email: string
  role: PlatformAdminRole
}

export type CreatePlatformAdminDialogProps = {
  open: boolean
  onClose: () => void
}

export type EditPlatformAdminDialogProps = {
  admin: PlatformAdminAccount
  onClose: () => void
}

export type CreatePlatformAdminFormProps = {
  onCancel?: () => void
  onSuccess?: () => void
}

export type PlatformAdminStatusFilter = 'all' | 'active' | 'inactive'

export type PlatformAdminRoleFilter = 'all' | PlatformAdminRole

export interface PlatformAdminsListState {
  search: string
  status: PlatformAdminStatusFilter
  role: PlatformAdminRoleFilter
  page: number
}

export type PlatformAdminAction =
  | { type: 'create' }
  | { type: 'edit'; admin: PlatformAdminAccount }
  | { type: 'deactivate'; admin: PlatformAdminAccount }

export interface PlatformAdminMenuState {
  anchor: HTMLElement
  admin: PlatformAdminAccount
}

export type AdminItemProps = {
  admin: PlatformAdminAccount
  onMenuOpen?: (anchor: HTMLElement, admin: PlatformAdminAccount) => void
}

export interface PlatformAdminsTableProps {
  admins: PlatformAdminAccount[]
  onMenuOpen?: (anchor: HTMLElement, admin: PlatformAdminAccount) => void
}

export interface PlatformAdminsFiltersProps {
  filters: PlatformAdminsListState
  onChange: (changes: Partial<PlatformAdminsListState>) => void
}

export interface PlatformAdminsEmptyStateProps {
  actionLabel: string
  description: string
  icon: ReactNode
  onAction?: () => void
  title: string
}

export interface DeactivatePlatformAdminDialogProps {
  admin: PlatformAdminAccount
  onClose: () => void
}
