export const sessionEndRequestedEvent = 'ketris:session-end-requested'

export function notifySessionEndRequested() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(sessionEndRequestedEvent))
}

export const localOnlyLogoutEvent = 'ketris:logout-local-only'

export function notifyLocalOnlyLogout() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(localOnlyLogoutEvent))
}
