import type { RatingLocale } from '../types/rating'

const ratingFormatOptions: Intl.NumberFormatOptions = {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  useGrouping: false,
}

const ratingFormatters = new Map<string, Intl.NumberFormat>()

function resolveRatingLocale(locale: RatingLocale) {
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? 'en-US'
  } catch {
    return 'en-US'
  }
}

function getRatingFormatter(locale: RatingLocale) {
  const localeKey = resolveRatingLocale(locale)
  const cachedFormatter = ratingFormatters.get(localeKey)

  if (cachedFormatter) return cachedFormatter

  const formatter = new Intl.NumberFormat(localeKey, ratingFormatOptions)

  ratingFormatters.set(localeKey, formatter)

  return formatter
}

export function formatRating(rating: number, locale: RatingLocale = 'en-US') {
  return getRatingFormatter(locale).format(rating)
}
