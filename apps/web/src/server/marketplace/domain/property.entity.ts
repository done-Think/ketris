export type Finalidade = 'ALUGUEL' | 'VENDA'

export interface PropertyAddress {
  logradouro: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string
  latitude: number | null
  longitude: number | null
}

export interface PropertyMedia {
  id: string
  url: string
  tipo: string
  ordem: number
}

export interface PublishedPropertySummary {
  id: string
  titulo: string
  finalidade: Finalidade
  tipo: string
  valor: number
  condominio: number | null
  iptu: number | null
  quartos: number | null
  banheiros: number | null
  vagas: number | null
  areaM2: number | null
  cidade: string | null
  bairro: string | null
  capaUrl: string | null
  publicadoEm: Date | null
}

export interface PublishedPropertyDetail extends PublishedPropertySummary {
  tenantId: string
  descricao: string | null
  endereco: PropertyAddress | null
  midias: PropertyMedia[]
}

export type PublicPropertyDetail = Omit<PublishedPropertyDetail, 'tenantId'>

export function toPublicPropertyDetail(property: PublishedPropertyDetail): PublicPropertyDetail {
  return {
    id: property.id,
    titulo: property.titulo,
    finalidade: property.finalidade,
    tipo: property.tipo,
    valor: property.valor,
    condominio: property.condominio,
    iptu: property.iptu,
    quartos: property.quartos,
    banheiros: property.banheiros,
    vagas: property.vagas,
    areaM2: property.areaM2,
    cidade: property.cidade,
    bairro: property.bairro,
    capaUrl: property.capaUrl,
    publicadoEm: property.publicadoEm,
    descricao: property.descricao,
    endereco: property.endereco,
    midias: property.midias,
  }
}
