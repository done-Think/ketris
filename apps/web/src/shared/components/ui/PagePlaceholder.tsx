import { Container, Typography } from '@mui/material'

type PagePlaceholderProps = {
  title: string
  description: string
  maxWidth?: 'sm' | 'lg'
  paddingY?: number
}

export function PagePlaceholder({
  title,
  description,
  maxWidth = 'lg',
  paddingY = 4,
}: PagePlaceholderProps) {
  return (
    <Container maxWidth={maxWidth} sx={{ py: paddingY }}>
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Container>
  )
}
