export function formatContractCode(code: string) {
  return code.replace(/^CTR-\d{4}-/, '#')
}
