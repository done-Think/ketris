import { expect, it } from 'vitest'
import { nearestTimeOption } from '../../utils/nearest-time-option'
import { agendaHourOptions, agendaMinuteOptions } from '../../config/agenda-time-options'

it.each([
  ['01', '00'],
  ['14', '00'],
  ['15', '30'],
  ['29', '30'],
  ['45', '30'],
  ['59', '30'],
])('limits minute search %s to %s', (input, expected) => {
  expect(nearestTimeOption(agendaMinuteOptions, input)).toBe(expected)
})

it('clamps an out-of-range hour to the displayed choices', () => {
  expect(nearestTimeOption(agendaHourOptions, '99')).toBe('23')
})
