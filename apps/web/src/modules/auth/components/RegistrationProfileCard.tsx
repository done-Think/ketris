import { getStyles } from '../styles/registration-profile-card.styles'
import { FormControlLabel, Radio, Stack, Typography } from '@mui/material'

import { RegistrationProfileIcon } from './RegistrationProfileIcon'
import type { RegistrationProfileCardProps } from '../types/registration'

export function RegistrationProfileCard({
  description,
  profile,
  selected,
  title,
}: RegistrationProfileCardProps) {
  const styles = getStyles(selected)

  return (
    <FormControlLabel
      value={profile.id}
      disableTypography
      control={
        <Radio disableRipple slotProps={{ input: { 'aria-label': title } }} sx={styles.radio} />
      }
      label={
        <Stack alignItems="flex-start">
          <RegistrationProfileIcon variant={profile.icon} />

          <Typography variant="h6" sx={styles.typography}>
            {title}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={styles.typography2}>
            {description}
          </Typography>
        </Stack>
      }
      sx={styles.formControlLabel}
    />
  )
}
