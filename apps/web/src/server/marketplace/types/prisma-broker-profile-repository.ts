export type DecimalLike = { toNumber(): number }

export type UsuarioWithPerfilRow = {
  id: string
  tenantId: string
  nome: string
  email: string
  avatarUrl: string | null
  tenant: { nome: string }
  perfilPublico: {
    displayName: string
    headline: string | null
    bio: string | null
    creci: string | null
    telefone: string | null
    regiao: string | null
    bairros: string[]
    especialidades: string[]
    disponibilidade: string | null
    corPrimaria: string | null
    corSecundaria: string | null
    corFundo: string | null
    avatarUrl: string | null
    bannerUrl: string | null
    status: 'DRAFT' | 'PUBLISHED'
    publicadoEm: Date | null
  } | null
}
