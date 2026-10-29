import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import {
  API_CONTRACT_HEADER,
  API_CONTRACT_VERSION,
  requiresApiContract,
} from '@shared/config/api-contract'

export function validateApiContract(request: NextRequest): NextResponse | null {
  if (
    request.method === 'OPTIONS' ||
    !requiresApiContract(request.nextUrl.pathname) ||
    request.headers.get(API_CONTRACT_HEADER) === API_CONTRACT_VERSION
  )
    return null

  return NextResponse.json(
    {
      error: {
        code: 'CLIENT_UPDATE_REQUIRED',
        message: 'A aplicação foi atualizada. Recarregue a página para continuar.',
      },
    },
    {
      status: 409,
      headers: {
        [API_CONTRACT_HEADER]: API_CONTRACT_VERSION,
        'Cache-Control': 'no-store',
        Vary: API_CONTRACT_HEADER,
      },
    },
  )
}
