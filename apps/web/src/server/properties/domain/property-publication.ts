import type { Property } from '../types/property'

export function getPublishMissingFields(property: Property): string[] {
  const missingFields: string[] = []

  if (!property.titulo.trim()) missingFields.push('titulo')
  if (!property.tipo.trim()) missingFields.push('tipo')
  if (property.valores.valor <= 0) missingFields.push('valor')
  if (!property.endereco) missingFields.push('endereco')
  if (property.midias.length === 0) missingFields.push('midias')

  return missingFields
}
