export const agendaHourOptions = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, '0'),
)

export const agendaMinuteOptions = ['00', '30'] as const
