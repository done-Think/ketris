import { BaseService } from '@shared/lib/api/base-service'

import type {
  Property,
  PropertyPage,
  PropertyOwnersResponse,
  PropertyOwnerOption,
  PropertyFormValues,
  PropertyListFilters,
  PropertyMediaInput,
} from '../types/property'
import type {
  PropertiesResponse,
  PropertyResponse,
  UploadPropertyMediaResponse,
} from '../types/service'
import {
  mapProperty,
  toApiPurpose,
  toCreatePayload,
  toUpdatePayload,
} from '../utils/property-adapter'

export class PropertiesService extends BaseService {
  private readonly path = '/properties'

  async list(filters: PropertyListFilters = {}): Promise<Property[]> {
    const first = await this.listPage({ ...filters, page: 1, pageSize: 100 })
    const properties = [...first.properties]
    for (let page = 2; page <= first.pagination.totalPages; page += 1) {
      properties.push(...(await this.listPage({ ...filters, page, pageSize: 100 })).properties)
    }
    return properties
  }

  listPage(filters: PropertyListFilters = {}): Promise<PropertyPage> {
    const params = {
      ...(filters.locale ? { locale: filters.locale } : {}),
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 25,
      ...(filters.sortBy ? { sortBy: filters.sortBy } : {}),
      ...(filters.sortOrder ? { sortOrder: filters.sortOrder } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.purpose ? { finalidade: toApiPurpose(filters.purpose) } : {}),
    }
    return this.http
      .get<PropertiesResponse>(this.path, { params })
      .then((response) => ({ ...response, properties: response.properties.map(mapProperty) }))
  }

  async listOwners(): Promise<PropertyOwnerOption[]> {
    const first = await this.http.get<PropertyOwnersResponse>(`${this.path}/owners`, {
      params: { page: 1, pageSize: 100 },
    })
    const owners = [...first.owners]
    for (let page = 2; page <= first.pagination.totalPages; page += 1) {
      owners.push(
        ...(
          await this.http.get<PropertyOwnersResponse>(`${this.path}/owners`, {
            params: { page, pageSize: 100 },
          })
        ).owners,
      )
    }
    return owners
  }

  getById(id: string): Promise<Property> {
    return this.http
      .get<PropertyResponse>(`${this.path}/${id}`)
      .then((data) => mapProperty(data.property))
  }

  create(payload: PropertyFormValues): Promise<Property> {
    return this.http
      .post<PropertyResponse>(this.path, toCreatePayload(payload))
      .then((data) => mapProperty(data.property))
  }

  update(id: string, payload: Partial<PropertyFormValues>): Promise<Property> {
    return this.http
      .patch<PropertyResponse>(`${this.path}/${id}`, toUpdatePayload(payload))
      .then((data) => mapProperty(data.property))
  }

  publish(id: string): Promise<Property> {
    return this.http
      .post<PropertyResponse>(`${this.path}/${id}/publish`)
      .then((data) => mapProperty(data.property))
  }

  unpublish(id: string): Promise<Property> {
    return this.http
      .post<PropertyResponse>(`${this.path}/${id}/unpublish`)
      .then((data) => mapProperty(data.property))
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/${id}`)
  }

  uploadMedia(file: File): Promise<PropertyMediaInput> {
    const formData = new FormData()
    formData.append('file', file)

    return this.http
      .post<UploadPropertyMediaResponse>(`${this.path}/media`, formData, {
        headers: { 'Content-Type': undefined },
      })
      .then((data) => ({ url: data.media.url, type: 'foto' }))
  }
}

export const propertiesService = new PropertiesService()
