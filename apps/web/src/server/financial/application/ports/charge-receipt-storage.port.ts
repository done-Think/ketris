import type {
  ChargeReceiptDescriptor,
  ChargeReceiptObjectInfo,
  ChargeReceiptUploadLocation,
} from '../../types/charge-receipt'

export interface ChargeReceiptStorage {
  uploadLocation(
    key: string,
    descriptor: ChargeReceiptDescriptor,
  ): Promise<ChargeReceiptUploadLocation>
  inspect(key: string): Promise<ChargeReceiptObjectInfo>
  downloadUrl(key: string, name: string, contentType: string): Promise<string>
}

export interface ChargeReceiptUploadTickets {
  issue(descriptor: ChargeReceiptDescriptor): Promise<string>
  verify(token: string): Promise<ChargeReceiptDescriptor>
}

export interface ChargeReceiptIds {
  generate(): string
}
