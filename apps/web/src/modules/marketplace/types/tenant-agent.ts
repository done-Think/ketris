export interface TenantAgent {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

export interface ListTenantUsersResponse {
  users: TenantAgent[]
}
