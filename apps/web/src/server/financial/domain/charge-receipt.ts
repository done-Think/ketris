import type { ChargeReceiptDescriptor } from '../types/charge-receipt'

const extensions: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

const signatures: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
}

export function chargeReceiptObjectKey(
  descriptor: Pick<ChargeReceiptDescriptor, 'tenantId' | 'chargeId' | 'id' | 'contentType'>,
): string {
  return `financial/${descriptor.tenantId}/${descriptor.chargeId}/${descriptor.id}.${extensions[descriptor.contentType] ?? 'bin'}`
}

export function matchesReceiptSignature(contentType: string, bytes: Uint8Array): boolean {
  const signature = signatures[contentType]
  return Boolean(signature) && signature.every((byte, index) => bytes[index] === byte)
}
