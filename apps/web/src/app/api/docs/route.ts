// GET /api/docs — Swagger UI self-hosted (assets servidos por /api/docs/assets/*, spec por
// /api/docs/openapi.json). Sem dependência de CDN (ver ADR-0002).
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Ketris BFF API — Docs</title>
    <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css" />
    <link rel="icon" href="/api/docs/assets/favicon-32x32.png" sizes="32x32" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
    <script src="/api/docs/assets/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api/docs/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'StandaloneLayout',
        })
      }
    </script>
  </body>
</html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
