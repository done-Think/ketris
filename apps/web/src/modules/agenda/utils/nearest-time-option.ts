export function nearestTimeOption(options: readonly string[], input: string): string {
  const value = Number(input)
  return options.reduce((nearest, option) =>
    Math.abs(Number(option) - value) <= Math.abs(Number(nearest) - value) ? option : nearest,
  )
}
