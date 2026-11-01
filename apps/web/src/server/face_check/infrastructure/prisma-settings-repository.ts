import type { SettingsRepository } from '../types/verification.types'
import type { VerificationSettings } from '../types/session.types'
import { defaultSettings } from '../verification/container-factory'
import { FaceCheckAccessScope } from './access-scope'
import { DataCipher } from './data-cipher'

export class PrismaSettingsRepository implements SettingsRepository {
  constructor(
    private readonly access: FaceCheckAccessScope,
    private readonly cipher: DataCipher,
  ) {}

  async get(): Promise<VerificationSettings> {
    const { tenantId, agencyName } = await this.access.settings()
    const row = await this.access.database.faceCheckSettings.findUnique({ where: { tenantId } })
    const settings = row
      ? this.cipher.decrypt<VerificationSettings>(row.encryptedRecord, `settings:${tenantId}`)
      : defaultSettings(agencyName)
    return { ...settings, agencyName }
  }

  async save(input: VerificationSettings) {
    const { tenantId, agencyName } = await this.access.settings(true)
    const settings = { ...input, agencyName }
    const encryptedRecord = this.cipher.encrypt(settings, `settings:${tenantId}`)
    await this.access.database.faceCheckSettings.upsert({
      where: { tenantId },
      create: { tenantId, encryptedRecord },
      update: { encryptedRecord },
    })
    return settings
  }
}
