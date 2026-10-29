import type { MaintenancePrepareUploadResponseDTO } from '@shared/types/generated/maintenance/dto'
import { BaseService } from '@shared/lib/api/base-service'
import { HttpClient, httpClient } from '@shared/lib/api/http-client'
import { uploadToSignedUrl } from '@shared/lib/api/signed-upload'
import type {
  CreateMaintenanceProviderPayload,
  MaintenanceProviderFilters,
  MaintenanceProviderOption,
  MaintenanceProvidersResponse,
  UpdateMaintenanceProviderPayload,
} from '../types/maintenance-provider'
import type {
  MaintenanceAction,
  MaintenanceOptions,
  MaintenanceUserLinkInput,
} from '../types/service'
import { maintenanceFileSha256, validateMaintenanceFile } from '../utils/maintenance-file'

import type {
  ApiMaintenanceActivity,
  ApiMaintenanceAttachment,
  ApiMaintenanceTicket,
  CreateMaintenanceTicketPayload,
  ListMaintenanceTicketsResponse,
  MaintenanceActivitiesResponse,
  MaintenanceActivityResponse,
  MaintenanceTicketListFilters,
  MaintenanceTicketResponse,
  UpdateMaintenanceTicketPayload,
  UploadMaintenanceTicketAttachmentResponse,
} from '../types/service'

export class MaintenanceService extends BaseService {
  private readonly path = '/maintenance/tickets'

  constructor(
    client: HttpClient = httpClient,
    private readonly storage = new HttpClient(''),
  ) {
    super(client)
  }

  list(filters: MaintenanceTicketListFilters = {}): Promise<ListMaintenanceTicketsResponse> {
    const params = {
      ...(filters.locale ? { locale: filters.locale } : {}),
      ...(filters.archived ? { archived: 'true' } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
      ...(filters.category ? { category: filters.category } : {}),
      ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.page ? { page: String(filters.page) } : {}),
      ...(filters.pageSize ? { pageSize: String(filters.pageSize) } : {}),
    }

    return this.http.get<ListMaintenanceTicketsResponse>(this.path, { params })
  }

  get(id: string): Promise<ApiMaintenanceTicket> {
    return this.http
      .get<MaintenanceTicketResponse>(`${this.path}/${id}`)
      .then((data) => data.ticket)
  }

  create(payload: CreateMaintenanceTicketPayload): Promise<ApiMaintenanceTicket> {
    return this.http.post<MaintenanceTicketResponse>(this.path, payload).then((data) => data.ticket)
  }

  update(id: string, payload: UpdateMaintenanceTicketPayload): Promise<ApiMaintenanceTicket> {
    return this.http
      .patch<MaintenanceTicketResponse>(`${this.path}/${id}`, payload)
      .then((data) => data.ticket)
  }

  remove(id: string): Promise<void> {
    return this.http.delete<void>(`${this.path}/${id}`)
  }

  resolve(id: string): Promise<ApiMaintenanceTicket> {
    return this.http
      .post<MaintenanceTicketResponse>(`${this.path}/${id}/resolve`)
      .then((data) => data.ticket)
  }

  addNote(id: string, message: string): Promise<ApiMaintenanceActivity> {
    return this.http
      .post<MaintenanceActivityResponse>(`${this.path}/${id}/notes`, { message })
      .then((data) => data.activity)
  }

  listActivities(id: string): Promise<ApiMaintenanceActivity[]> {
    return this.http
      .get<MaintenanceActivitiesResponse>(`${this.path}/${id}/activities`)
      .then((data) => data.activities)
  }

  async uploadAttachment(id: string, file: File): Promise<ApiMaintenanceAttachment> {
    validateMaintenanceFile(file)
    const prepared = await this.http.post<MaintenancePrepareUploadResponseDTO>(
      `${this.path}/${id}/attachments/upload`,
      {
        filename: file.name,
        size: file.size,
        contentType: file.type,
        sha256: await maintenanceFileSha256(file),
      },
    )
    await uploadToSignedUrl(this.storage, prepared.upload, file)
    return this.http
      .post<UploadMaintenanceTicketAttachmentResponse>(`${this.path}/${id}/attachments/complete`, {
        token: prepared.token,
      })
      .then((data) => data.attachment)
  }

  options(): Promise<MaintenanceOptions> {
    return this.http.get('/maintenance/options')
  }

  act(id: string, action: MaintenanceAction): Promise<ApiMaintenanceTicket> {
    return this.http
      .post<MaintenanceTicketResponse>(`${this.path}/${id}/actions`, action)
      .then((data) => data.ticket)
  }

  listProviders(filters: MaintenanceProviderFilters = {}): Promise<MaintenanceProvidersResponse> {
    const params = {
      ...filters,
      includeInactive:
        filters.includeInactive === undefined ? undefined : String(filters.includeInactive),
    }
    return this.http.get('/maintenance/providers', { params })
  }

  createProvider(payload: CreateMaintenanceProviderPayload): Promise<MaintenanceProviderOption> {
    return this.http
      .post<{ provider: MaintenanceProviderOption }>('/maintenance/providers', payload)
      .then((data) => data.provider)
  }

  updateProvider(
    id: string,
    payload: UpdateMaintenanceProviderPayload,
  ): Promise<MaintenanceProviderOption> {
    return this.http
      .patch<{ provider: MaintenanceProviderOption }>(`/maintenance/providers/${id}`, payload)
      .then((data) => data.provider)
  }

  linkUsers(input: MaintenanceUserLinkInput): Promise<void> {
    return this.http.post('/maintenance/links', input)
  }
}

export const maintenanceService = new MaintenanceService()
