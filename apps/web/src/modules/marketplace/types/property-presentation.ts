export type PropertyText = (
  key: 'bedrooms' | 'bathrooms' | 'parking' | 'monthly',
  values: { count: number } | { price: string },
) => string
