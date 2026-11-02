import { advance, pendingAdvance } from '../domain/session-rules'
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
  const refreshed: SessionRecord[] = []
  for (const record of records) {
    if (!pendingAdvance(record.session, now)) {
      refreshed.push(record)
      continue
    }
    refreshed.push(await changeSession(deps, { id: record.session.id }, (current) => current))
  }

  return refreshed
}

export async function readSession(deps: VerificationDependencies, key: SessionKey) {
  const record = await deps.sessions.read(key)
  if (!record) throw new VerificationError('SESSION_NOT_FOUND')

  return record
}
