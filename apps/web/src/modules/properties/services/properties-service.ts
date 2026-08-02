import { BaseService } from '@shared/lib/api/base-service'

import type { PropertyFormValues } from '../schemas/property-schema'
import type { Property } from '../types/property'

class PropertiesService extends BaseService {
  private readonly path = '/properties'

  list(): Promise<Property[]> {
    return this.http.get<Property[]>(this.path)
  }

  getById(id: string): Promise<Property> {
    return this.http.get<Property>(`${this.path}/${id}`)
  }

  create(payload: PropertyFormValues): Promise<Property> {
    return this.http.post<Property>(this.path, payload)
  }

  update(id: string, payload: Partial<PropertyFormValues>): Promise<Property> {
    return this.http.patch<Property>(`${this.path}/${id}`, payload)
  }

  publish(id: string): Promise<Property> {
    return this.http.post<Property>(`${this.path}/${id}/publish`)
  }

  unpublish(id: string): Promise<Property> {
    return this.http.post<Property>(`${this.path}/${id}/unpublish`)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/${id}`)
  }
}

export const propertiesService = new PropertiesService()
