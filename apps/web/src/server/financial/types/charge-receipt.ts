export interface ChargeReceiptDescriptor {
  id: string
  tenantId: string
  chargeId: string
  actorId: string
  name: string
  contentType: string
  size: number
  sha256: string
}

export interface ChargeReceiptObjectInfo {
  size: number
  contentType: string | null
  sha256: string | null
  signature: Uint8Array
}

export interface ChargeReceiptUploadLocation {
  url: string
  headers: Record<string, string>
}

export interface StoredChargeReceiptFile {
  id: string
  tenantId: string
  chargeId: string
  objectKey: string
  name: string
  contentType: string
  size: number
  sha256: string
}
