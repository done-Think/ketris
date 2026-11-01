const cpfLength = 11

export function cpfDigits(value: string) {
  return value.replace(/\D/g, '')
}

export function isValidCpf(value: string) {
  const digits = cpfDigits(value)
  if (digits.length !== cpfLength || /^(\d)\1+$/.test(digits)) return false

  return [9, 10].every((size) => {
    const total = [...digits.slice(0, size)].reduce(
      (sum, digit, index) => sum + Number(digit) * (size + 1 - index),
      0,
    )

    return ((total * 10) % 11) % 10 === Number(digits[size])
  })
}

export function maskCpf(digits: string) {
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`
}
