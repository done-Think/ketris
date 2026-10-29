import { BaseService } from '@shared/lib/api/base-service'
import { HttpClient, httpClient } from '@shared/lib/api/http-client'
import { uploadToSignedUrl } from '@shared/lib/api/signed-upload'
import { sha256Hex } from '@shared/utils/sha256-hex'
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
    const sha256 = await sha256Hex(file)
    const path = '/contracts/' + contractId + '/documents'
    const authorization = await this.http.post<ContractDocumentUploadAuthorization>(
      path + '/uploads',
      {
        name: file.name,
        size: file.size,
        sha256,
      },
    )
    await uploadToSignedUrl(
      this.storage,
      { url: authorization.uploadUrl, headers: authorization.headers },
      file,
      {
        onUploadProgress: ({ loaded, total }) =>
          onProgress(total ? Math.round((loaded * 100) / total) : 0),
      },
    )
    return this.http
      .post<ContractDocumentResponse>(path, { uploadToken: authorization.uploadToken })
      .then((result) => result.document)
  }

  download(contractId: string, documentId: string): Promise<ContractDocumentDownload> {
    return this.http.get('/contracts/' + contractId + '/documents/' + documentId + '/download')
  }
}

export const contractDocumentsService = new ContractDocumentsService()
