import { createHash } from 'node:crypto'

import type { PhotoFingerprint } from '../types/verification.types'

const nearDuplicateMaxBits = 8

export function sha256Hex(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function hammingDistance(first: string, second: string) {
  let difference = BigInt(`0x${first}`) ^ BigInt(`0x${second}`)
  let bits = 0
  while (difference > BigInt(0)) {
    bits += Number(difference & BigInt(1))
    difference >>= BigInt(1)
  }

  return bits
}

export function isSamePhoto(candidate: PhotoFingerprint, other: PhotoFingerprint) {
  if (candidate.sha256 === other.sha256) return true

  return candidate.hashes.some((hash) =>
    other.hashes.some((otherHash) => hammingDistance(hash, otherHash) <= nearDuplicateMaxBits),
  )
}
