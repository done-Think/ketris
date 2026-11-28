import type { InstagramPublication } from '../types/instagram'

export function publicationResponse(job: InstagramPublication) {
  return {
    id: job.id,
    propertyId: job.propertyId,
    accountId: job.accountId,
    status: job.status,
    permalink: job.permalink,
    errorCode: job.lastErrorCode,
    createdAt: job.createdAt.toISOString(),
  }
}
