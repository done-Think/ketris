const passwordCharacterGroups = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  digits: '23456789',
  special: '!@#$%&*?',
} as const

const allPasswordCharacters = Object.values(passwordCharacterGroups).join('')

export const temporaryPasswordLength = 12

function randomIndex(max: number) {
  return crypto.getRandomValues(new Uint32Array(1))[0] % max
}

function pickCharacter(characters: string) {
  return characters[randomIndex(characters.length)]
}

export function generateTemporaryPassword(length = temporaryPasswordLength) {
  const required = Object.values(passwordCharacterGroups).map(pickCharacter)
  const remaining = Array.from({ length: Math.max(0, length - required.length) }, () =>
    pickCharacter(allPasswordCharacters),
  )
  const characters = [...required, ...remaining]

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    ;[characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]]
  }

  return characters.join('')
}
