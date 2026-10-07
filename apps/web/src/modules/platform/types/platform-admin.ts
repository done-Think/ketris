import type { z } from 'zod'

import type { createPlatformAdminSchema } from '../schemas/create-platform-admin-schema'
import type { updatePlatformAdminSchema } from '../schemas/update-platform-admin-schema'

export type PlatformAdminRole = 'ADMIN' | 'ADMIN_AGENT' | 'AGENT'

export type CreatePlatformAdminFormValues = z.infer<ReturnType<typeof createPlatformAdminSchema>>

export type UpdatePlatformAdminFormValues = z.infer<typeof updatePlatformAdminSchema>

export interface PlatformAdminAccount {
  id: string
  nome: string
  email: string
  role: PlatformAdminRole
  ativo: boolean
}

export interface CreatePlatformAdminPayload {
  nome: string
  email: string
  password: string
  role: PlatformAdminRole
}

export interface UpdatePlatformAdminPayload {
  nome: string
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
  nome: string
  email: string
  password: string
  role: PlatformAdminRole
}

export interface UpdatePlatformAdminInput {
  id: string
  nome: string
  email: string
  role: PlatformAdminRole
}

export type CreatePlatformAdminDialogProps = {
  open: boolean
  onClose: () => void
}

export type EditPlatformAdminDialogProps = {
  admin: PlatformAdminAccount | null
  onClose: () => void
}

export type CreatePlatformAdminFormProps = {
  onCancel?: () => void
  onSuccess?: () => void
}
