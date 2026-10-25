import bcrypt from 'bcryptjs'

import { isSupportedNewPasswordLength } from '@shared/utils/password-length'
import { PasswordTooLongError } from '../domain/errors'

import type { PasswordHasher } from '../application/ports/password-hasher.port'

const SALT_ROUNDS = 10

export class BcryptPasswordHasher implements PasswordHasher {
  compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash)
  }

  async hash(plainText: string): Promise<string> {
    if (!isSupportedNewPasswordLength(plainText)) throw new PasswordTooLongError()
    return bcrypt.hash(plainText, SALT_ROUNDS)
  }
}
