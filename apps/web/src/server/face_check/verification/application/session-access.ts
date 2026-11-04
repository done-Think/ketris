import { advance } from '../domain/session-rules'
import { VerificationError } from '../domain/verification-error'
import type {
  SessionKey,
  SessionRecord,
  VerificationDependencies,
} from '../../types/verification.types'

export function changeSession<T>(
  deps: VerificationDependencies,
  key: SessionKey,
  change: (record: SessionRecord) => Promise<T> | T,
) {
  return deps.sessions.update(key, (record) => {
    advance(record, deps.clock(), deps.newId())
    return change(record)
  })
}

export async function currentSessions(deps: VerificationDependencies) {
  const records = await deps.sessions.list()
  const now = deps.clock()
  for (const record of records) advance(record, now, deps.newId())
  return records
}

export async function readSession(deps: VerificationDependencies, key: SessionKey) {
  const record = await deps.sessions.read(key)
  if (!record) throw new VerificationError('SESSION_NOT_FOUND')
  // Reads derive expiry from the committed snapshot; they never contend with an upload/analysis lease.
  advance(record, deps.clock(), deps.newId())
  return record
}
