const profileOwners = new Set(['brokers', 'agencies'])

export function toPublicProfileMediaKey(segments: readonly string[]): string | null {
  const [root, owner] = segments
  const valid =
    root === 'profiles' &&
    profileOwners.has(owner ?? '') &&
    segments.length >= 4 &&
    segments.every(
      (segment) => segment && segment !== '.' && segment !== '..' && !/[\\/%]/.test(segment),
    )

  return valid ? segments.join('/') : null
}
