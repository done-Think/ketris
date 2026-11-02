export const sessionEndRequestedEvent = 'ketris:session-end-requested'

export function notifySessionEndRequested() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(sessionEndRequestedEvent))
}
