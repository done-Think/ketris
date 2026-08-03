import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { NextResponse } from 'next/server'
import getAbsoluteFSPath from 'swagger-ui-dist/absolute-path'

import { NotFoundError } from '@server/shared/errors'
import { withErrorHandling } from '@server/shared/http'

const SWAGGER_UI_DIR = getAbsoluteFSPath()

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.html': 'text/html; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
}

export const GET = withErrorHandling(
  async (_request: Request, context: { params: Promise<{ path: string[] }> }) => {
    const { path: segments } = await context.params
    const fileName = segments.join('/')

    const safeName = path.basename(fileName)
    const filePath = path.join(SWAGGER_UI_DIR, safeName)

    if (!filePath.startsWith(SWAGGER_UI_DIR)) {
      throw new NotFoundError('Asset não encontrado.')
    }

    try {
      const content = await readFile(filePath)
      const contentType = CONTENT_TYPES[path.extname(safeName)] ?? 'application/octet-stream'

      return new NextResponse(content, { headers: { 'Content-Type': contentType } })
    } catch {
      throw new NotFoundError('Asset não encontrado.')
    }
  },
)
