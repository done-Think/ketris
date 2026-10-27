export function calculateMonthlyTotal(
  monthlyPrice: number,
  includedUnits: number,
  extraUnitPrice: number,
  usage: number,
): number {
  const extraUnits = Math.max(0, usage - includedUnits)

  return (Math.round(monthlyPrice * 100) + extraUnits * Math.round(extraUnitPrice * 100)) / 100
}
