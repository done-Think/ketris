// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { sha256Hex } from '@shared/utils/sha256-hex'

describe('sha256Hex', () => {
  it('returns the lowercase hex SHA-256 of the blob bytes', async () => {
    expect(await sha256Hex(new Blob(['abc']))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })
})
