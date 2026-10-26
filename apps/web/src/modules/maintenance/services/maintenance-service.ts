import type { MaintenanceUserLinkInput } from '../types/service'
import { BaseService } from '@shared/lib/api/base-service'
import type { MaintenanceAction, MaintenanceOptions } from '../types/service'

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

  list(filters: MaintenanceTicketListFilters = {}): Promise<ListMaintenanceTicketsResponse> {
    const params = {
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

  uploadAttachment(id: string, file: File): Promise<ApiMaintenanceAttachment> {
    const formData = new FormData()
    formData.append('file', file)

    return this.http
      .post<UploadMaintenanceTicketAttachmentResponse>(`${this.path}/${id}/attachments`, formData, {
        headers: { 'Content-Type': undefined },
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

  linkUsers(input: MaintenanceUserLinkInput): Promise<void> {
    return this.http.post('/maintenance/links', input)
  }
}

export const maintenanceService = new MaintenanceService()
