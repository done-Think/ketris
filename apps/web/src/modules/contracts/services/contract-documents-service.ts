import { BaseService } from '@shared/lib/api/base-service'
import { HttpClient, httpClient } from '@shared/lib/api/http-client'
import type {
  ContractDocumentDownload,
  ContractDocumentResponse,
  ContractDocumentUploadAuthorization,
} from '../types/service'

export class ContractDocumentsService extends BaseService {
  constructor(
    client: HttpClient = httpClient,
    private readonly storage = new HttpClient(''),
  ) {
    super(client)
  }

  async upload(contractId: string, file: File, onProgress: (percent: number) => void) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    const sha256 = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')
    const path = '/contracts/' + contractId + '/documents'
    const authorization = await this.http.post<ContractDocumentUploadAuthorization>(
      path + '/uploads',
      {
        name: file.name,
        size: file.size,
        sha256,
      },
    )
    // O cliente de storage não recebe token, tenant ou renovação de sessão da aplicação.
    await this.storage.put(authorization.uploadUrl, file, {
      headers: authorization.headers,
      timeout: 120000,
      skipUnauthorizedHandling: true,
      onUploadProgress: ({ loaded, total }) =>
        onProgress(total ? Math.round((loaded * 100) / total) : 0),
    })
    return this.http
      .post<ContractDocumentResponse>(path, { uploadToken: authorization.uploadToken })
      .then((result) => result.document)
  }

  download(contractId: string, documentId: string): Promise<ContractDocumentDownload> {
    return this.http.get('/contracts/' + contractId + '/documents/' + documentId + '/download')
  }
}

export const contractDocumentsService = new ContractDocumentsService()
