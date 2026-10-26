import { createServer } from 'node:http'
import { createHash } from 'node:crypto'
import { once } from 'node:events'

export async function startPrivateS3Server(port = 0, allowedOrigin?: string) {
  const objects = new Map<string, { bytes: Buffer; type: string }>()
  const requests: { method: string; path: string; range?: string }[] = []
  const server = createServer(async (request, response) => {
    if (allowedOrigin && request.headers.origin === allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin)
      response.setHeader('Access-Control-Allow-Methods', 'PUT, GET, HEAD')
      response.setHeader('Access-Control-Allow-Headers', 'content-type, x-amz-checksum-sha256')
      response.setHeader('Vary', 'Origin')
    }
    if (request.method === 'OPTIONS') {
      response.writeHead(204).end()
      return
    }
    const url = new URL(request.url ?? '/', 'http://localhost')
    const key = decodeURIComponent(url.pathname)
    const disposition = url.searchParams.get('response-content-disposition')
    if (disposition) response.setHeader('Content-Disposition', disposition)
    requests.push({ method: request.method ?? '', path: key, range: request.headers.range })
    if (request.method === 'PUT') {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const bytes = Buffer.concat(chunks)
      const checksum = createHash('sha256').update(bytes).digest('base64')
      if (
        request.headers['x-amz-checksum-sha256'] !== checksum ||
        Number(request.headers['content-length']) !== bytes.length
      ) {
        response.writeHead(400).end()
        return
      }
      objects.set(key, { bytes, type: String(request.headers['content-type'] ?? '') })
      response.writeHead(200, { 'x-amz-checksum-sha256': checksum }).end()
      return
    }
    const object = objects.get(key)
    if (!object) {
      response.writeHead(404).end()
      return
    }
    const headers = {
      'content-length': object.bytes.length,
      'content-type': object.type,
      'x-amz-checksum-sha256': createHash('sha256').update(object.bytes).digest('base64'),
    }
    if (request.method === 'HEAD') {
      response.writeHead(200, headers).end()
      return
    }
    const bytes = request.headers.range === 'bytes=0-4' ? object.bytes.subarray(0, 5) : object.bytes
    if (bytes === object.bytes) response.writeHead(200, headers).end(bytes)
    else
      response
        .writeHead(206, {
          'content-type': object.type,
          'content-length': bytes.length,
          'content-range': 'bytes 0-4/' + object.bytes.length,
        })
        .end(bytes)
  })
  server.listen(port, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Storage local não iniciou.')
  return {
    url: 'http://127.0.0.1:' + address.port,
    objects,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
        server.closeAllConnections()
      }),
  }
}
