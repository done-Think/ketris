import { NextResponse } from 'next/server'

import { generateOpenApiDocument } from '@server/openapi/registry'

// GET /api/docs/openapi.json — documento OpenAPI 3.0 gerado a partir dos MESMOS schemas Zod usados na
// validação em runtime (ver src/server/<dominio>/openapi.ts). Consumido pela UI em /api/docs.
export async function GET() {
  return NextResponse.json(generateOpenApiDocument())
}
