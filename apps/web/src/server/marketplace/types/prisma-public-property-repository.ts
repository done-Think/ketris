import type { PropertyPurpose } from './property'

export type DecimalLike = { toNumber(): number }

export type EnderecoRow = {
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  latitude: DecimalLike | null
  longitude: DecimalLike | null
}

export type MidiaRow = { id: string; url: string; tipo: string; ordem: number }

export type ImovelSummaryRow = {
  id: string
  titulo: string
  finalidade: PropertyPurpose
  tipo: string
  valor: DecimalLike
  condominio: DecimalLike | null
  iptu: DecimalLike | null
  quartos: number | null
  banheiros: number | null
  vagas: number | null
  areaM2: DecimalLike | null
  publicadoEm: Date | null
  endereco: {
    cidade: string
    bairro: string
    latitude: DecimalLike | null
    longitude: DecimalLike | null
  } | null
  responsavel: { nome: string; avatarUrl: string | null } | null
  midias: { url: string }[]
}

export type ImovelDetailRow = ImovelSummaryRow & {
  tenantId: string
  descricao: string | null
  endereco: EnderecoRow | null
  midias: MidiaRow[]
}
