'use client'

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import {
  Box,
  IconButton,
  InputAdornment,
  MenuItem,
  MenuList,
  Popover,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useController } from 'react-hook-form'

import { agendaHourOptions, agendaMinuteOptions } from '../config/agenda-time-options'
import { styles } from '../styles/agenda-time-field.styles'
import type { AgendaTimeFieldProps, AgendaTimePart } from '../types/agenda-event'
import { nearestTimeOption } from '../utils/nearest-time-option'

export function AgendaTimeField({ control }: AgendaTimeFieldProps) {
  const t = useTranslations('agenda.eventForm')
  const { field, fieldState } = useController({ control, name: 'scheduledTime' })
  const id = useId()
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null)
  const optionsRef = useRef<Record<string, HTMLLIElement | null>>({})
  const search = useRef({ part: 'hour' as AgendaTimePart, digits: '', at: 0 })
  const [open, setOpen] = useState(false)
  const [hour = '00', minute = '00'] = field.value.split(':')

  function select(part: AgendaTimePart, option: string) {
    field.onChange(
      `${part === 'hour' ? option : nearestTimeOption(agendaHourOptions, hour)}:${part === 'minute' ? option : nearestTimeOption(agendaMinuteOptions, minute)}`,
    )
  }

  function close() {
    setOpen(false)
    search.current.digits = ''
    field.onBlur()
  }

  function searchOption(event: KeyboardEvent, part: AgendaTimePart) {
    if (event.ctrlKey || event.metaKey || event.altKey || !/^\d$/.test(event.key)) return
    event.preventDefault()
    event.stopPropagation()
    const now = Date.now()
    const previous = search.current
    const digits =
      previous.part === part && now - previous.at < 1000 && previous.digits.length < 2
        ? previous.digits + event.key
        : event.key
    search.current = { part, digits, at: now }
    const option = nearestTimeOption(
      part === 'hour' ? agendaHourOptions : agendaMinuteOptions,
      digits,
    )
    select(part, option)
    optionsRef.current[`${part}-${option}`]?.focus()
  }

  return (
    <>
      <TextField
        ref={setAnchor}
        id={id}
        inputRef={field.ref}
        name={field.name}
        value={field.value}
        label={t('fields.time')}
        fullWidth
        error={Boolean(fieldState.error)}
        helperText={fieldState.error?.message}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
            event.preventDefault()
            setOpen(true)
          } else if (/^\d$/.test(event.key)) {
            setOpen(true)
            searchOption(event, 'hour')
          }
        }}
        onBlur={() => {
          if (!open) field.onBlur()
        }}
        inputProps={{
          readOnly: true,
          role: 'combobox',
          'aria-expanded': open,
          'aria-haspopup': 'dialog',
          'aria-controls': open ? `${id}-picker` : undefined,
        }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={t('timePicker.title')}
                onClick={() => setOpen(true)}
                edge="end"
              >
                <AccessTimeRoundedIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ id: `${id}-picker`, role: 'dialog', 'aria-label': t('timePicker.title') }}
      >
        <Box sx={styles.picker}>
          {(['hour', 'minute'] as const).map((part) => (
            <Box key={part}>
              <Typography id={`${id}-${part}`} sx={styles.heading}>
                {t(`timePicker.${part}`)}
              </Typography>
              <MenuList
                aria-labelledby={`${id}-${part}`}
                autoFocusItem={part === 'hour'}
                variant="selectedMenu"
                sx={styles.options}
                onKeyDownCapture={(event) => searchOption(event, part)}
              >
                {(part === 'hour' ? agendaHourOptions : agendaMinuteOptions).map((option) => (
                  <MenuItem
                    key={option}
                    ref={(element) => {
                      optionsRef.current[`${part}-${option}`] = element
                    }}
                    selected={option === (part === 'hour' ? hour : minute)}
                    sx={styles.option}
                    onClick={() => {
                      select(part, option)
                      search.current.digits = ''
                      if (part === 'minute') close()
                    }}
                  >
                    {option}
                  </MenuItem>
                ))}
              </MenuList>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  )
}
