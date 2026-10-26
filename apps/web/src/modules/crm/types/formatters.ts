export interface CrmFormatters {
  money: (value: number, monthly?: boolean) => string
  date: (value: string | Date) => string
  relative: (value: string | Date) => string
  number: (value: number) => string
}
