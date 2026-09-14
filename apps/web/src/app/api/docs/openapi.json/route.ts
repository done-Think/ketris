import { NextResponse } from 'next/server'

import { generateOpenApiDocument } from '@server/openapi/registry'

export async function GET() {
  return NextResponse.json(generateOpenApiDocument())
}
