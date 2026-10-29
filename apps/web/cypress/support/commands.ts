import { API_CONTRACT_HEADER, API_CONTRACT_VERSION } from '../../src/shared/config/api-contract'

Cypress.Commands.overwrite('request', (original, ...args: unknown[]) => {
  const [first, second, body] = args
  let options: Partial<Cypress.RequestOptions>
  if (typeof first === 'string') {
    options =
      typeof second === 'string'
        ? { method: first, url: second, body: body as Cypress.RequestBody }
        : { url: first, body: second as Cypress.RequestBody }
  } else if (first && typeof first === 'object') {
    options = first as Partial<Cypress.RequestOptions>
  } else {
    throw new Error('Invalid request options')
  }
  const pathname = new URL(options.url ?? '', Cypress.config('baseUrl') ?? 'http://localhost')
    .pathname
  if (pathname.startsWith('/api/'))
    options = {
      ...options,
      headers: { [API_CONTRACT_HEADER]: API_CONTRACT_VERSION, ...options.headers },
    }
  const request = original as typeof cy.request
  return request(options)
})
