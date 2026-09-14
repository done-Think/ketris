import { getSwaggerUiHtml } from '@server/openapi/swagger-ui-page'

export async function GET() {
  return new Response(getSwaggerUiHtml(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
