export function parseMetaJson(raw: string): unknown {
  return JSON.parse(raw.replace(/("(?:user_id|id)"\s*:\s*)(\d{16,})(?=\s*[,}])/g, '$1"$2"'))
}
