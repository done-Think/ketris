import type { z } from 'zod'
import type { createLoginSchema } from '../schemas/login-schema'
import type { Control } from 'react-hook-form'
import type { LoginTenantChoice } from './auth-api'

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>

export interface LoginTenantSelectProps {
  control: Control<LoginFormValues>
  tenants: LoginTenantChoice[]
}

export type LoginFormProps = {
  callbackUrl: string
}

export interface LoginErrorBody {
  error?: { code?: string }
}
