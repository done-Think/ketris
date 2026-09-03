import { httpClient, type HttpClient } from './http-client'

export abstract class BaseService {
  protected http: HttpClient

  constructor(client: HttpClient = httpClient) {
    this.http = client
  }
}
