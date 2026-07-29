import { httpClient, type HttpClient } from './http-client'

// Classe base para os services de cada módulo.
// Ex.: class PropertiesService extends BaseService { ... }
export abstract class BaseService {
  protected http: HttpClient

  constructor(client: HttpClient = httpClient) {
    this.http = client
  }
}
