import { styles } from '@shared/styles/page-placeholder.styles'
import { Container, Typography } from '@mui/material'

import type { PagePlaceholderProps } from '@shared/types/page-placeholder'

export function PagePlaceholder({
  title,
  description,
  maxWidth = 'lg',
  paddingY = 4,
}: PagePlaceholderProps) {
  return (
    <Container maxWidth={maxWidth} sx={styles.container(paddingY)}>
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Container>
  )
}
