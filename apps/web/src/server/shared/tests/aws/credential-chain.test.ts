import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  for (const name of [
    'AWS_PROFILE',
    'AWS_WEB_IDENTITY_TOKEN_FILE',
    'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
    'AWS_CONTAINER_CREDENTIALS_FULL_URI',
  ])
    vi.stubEnv(name, '')
  vi.stubEnv('AWS_REGION', 'us-east-1')
  vi.stubEnv('S3_BUCKET_NAME', 'local-unit-fixture')
  vi.stubEnv('AWS_ACCESS_KEY_ID', 'temporary-unit-access')
  vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'temporary-unit-secret')
  vi.stubEnv('AWS_SESSION_TOKEN', 'temporary-unit-session')
})
afterEach(() => vi.unstubAllEnvs())

describe('AWS credential chain', () => {
  it('preserves temporary session tokens for S3 and SES', async () => {
    const { getS3Client } = await import('../../storage/s3-client')
    const { getSesClient } = await import('../../email/ses-client')
    for (const client of [getS3Client(), getSesClient()]) {
      expect(await client.config.credentials()).toMatchObject({
        accessKeyId: 'temporary-unit-access',
        sessionToken: 'temporary-unit-session',
      })
      client.destroy()
    }
  })
  it('keeps development uploads local without credentials or an explicitly selected profile', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('AWS_ACCESS_KEY_ID', '')
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', '')
    const { shouldUseLocalUploadsStorage } = await import('../../storage/s3-client')
    expect(shouldUseLocalUploadsStorage()).toBe(true)
    vi.stubEnv('AWS_PROFILE', 'unit-profile')
    expect(shouldUseLocalUploadsStorage()).toBe(false)
  })
  it('allows workload roles in production without long-lived access keys', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('AWS_ACCESS_KEY_ID', '')
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', '')
    const { hasUploadsStorageConfig, getS3Client } = await import('../../storage/s3-client')
    expect(hasUploadsStorageConfig()).toBe(true)
    expect(await getS3Client().config.region()).toBe('us-east-1')
    getS3Client().destroy()
  })
})
