import type { InstagramIdentity, InstagramToken } from '../../types/instagram'

export interface InstagramApi {
  authorizeUrl(state: string): string
  exchange(code: string): Promise<InstagramToken & InstagramIdentity>
  refresh(token: string): Promise<InstagramToken>
  createImage(
    accountId: string,
    token: string,
    url: string,
    caption?: string,
    child?: boolean,
  ): Promise<string>
  createCarousel(
    accountId: string,
    token: string,
    children: string[],
    caption: string,
  ): Promise<string>
  containerStatus(id: string, token: string): Promise<string>
  publish(accountId: string, token: string, containerId: string): Promise<string>
  permalink(id: string, token: string): Promise<string | null>
  checkLimit(accountId: string, token: string): Promise<void>
}

export interface InstagramTokenVault {
  random(): string
  digest(value: string): string
  encrypt(token: string, context: string): string
  decrypt(token: string, context: string): string
}

export interface InstagramMedia {
  prepare(tenantId: string, jobId: string, urls: string[]): Promise<string[]>
  url(jobId: string, index: number): string
  remove(keys: string[]): Promise<void>
}
