export function getPhoneDigits(phone: string) {
  return phone.replace(/\D/g, '')
}
export function getWhatsAppUrl(phone: string) {
  const digits = getPhoneDigits(phone)
  return `https://wa.me/${digits.length === 10 || digits.length === 11 ? '55' + digits : digits}`
}
