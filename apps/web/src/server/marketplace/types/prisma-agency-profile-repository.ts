export type DecimalLike = { toNumber(): number }

export type TenantWithPerfilRow = {
  id: string
  nome: string
  corPrimaria: string | null
  corSecundaria: string | null
  perfilPublico: {
    displayName: string
    headline: string | null
    resumo: string | null
    legalCreci: string | null
    sede: string | null
    endereco: string | null
    telefone: string | null
    email: string | null
    cobertura: string[]
    segmentos: string[]
    anosDeMercado: number | null
    corFundo: string | null
    logoUrl: string | null
    bannerUrl: string | null
    status: 'DRAFT' | 'PUBLISHED'
    publicadoEm: Date | null
    destaques: { ordem: number; usuario: { id: string; nome: string; avatarUrl: string | null } }[]
  } | null
}
