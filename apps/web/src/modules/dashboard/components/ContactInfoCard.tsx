import { Box, Link as MuiLink, Stack, Typography } from '@mui/material'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'

import type { ContactInfoCardProps } from '../types/dashboard-overview'
import { styles } from '../styles/contact-info-card.styles'

export function ContactInfoCard({ label, name, phone }: ContactInfoCardProps) {
  return (
    <Box sx={styles.box}>
      <Stack direction="row" alignItems="center" spacing={0.8}>
        <PersonOutlineOutlinedIcon sx={styles.personOutlineOutlinedIcon} />
        <Typography sx={styles.typography}>{label}</Typography>
      </Stack>
      <Typography sx={styles.typography2}>{name}</Typography>
      <MuiLink href={`tel:${phone.replace(/\D/g, '')}`} underline="none" sx={styles.muiLink}>
        <PhoneOutlinedIcon sx={styles.phoneOutlinedIcon} />
        {phone}
      </MuiLink>
    </Box>
  )
}
