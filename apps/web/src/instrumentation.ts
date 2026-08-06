export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    console.log(`   - Docs (Swagger):      ${appUrl}/api/docs`)
  }
}
