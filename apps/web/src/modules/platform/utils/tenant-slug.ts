// Suggests a tenant slug from its name: "Imobiliária São João" → "imobiliaria-sao-joao".
// Same rule as the server-side slug of self-registered agencies.
export function slugifyTenantName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
