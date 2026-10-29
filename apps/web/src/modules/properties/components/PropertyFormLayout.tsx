import { styles } from '../styles/property-form-layout.styles'
import { Box, Typography } from '@mui/material'

import type { PropertyFormLayoutProps } from '../types/dashboard-property'
import { CreatePropertyStepsNav } from './CreatePropertyStepsNav'

export function PropertyFormLayout({
  title,
  mobileTitle,
  activeStepIndex,
  maxVisitedStepIndex,
  isUploading = false,
  onStepSelect,
  onSubmit,
  children,
}: PropertyFormLayoutProps) {
  return (
    <Box sx={styles.page}>
      <Box sx={styles.content}>
        <Box sx={styles.header}>
          <Box sx={styles.headerContent}>
            <Typography variant="h3" sx={styles.title}>
              <Box component="span" sx={styles.desktopTitle}>
                {title}
              </Box>
              <Box component="span" sx={styles.mobileTitle}>
                {mobileTitle}
              </Box>
            </Typography>

            <CreatePropertyStepsNav
              activeStepIndex={activeStepIndex}
              maxVisitedStepIndex={
                isUploading ? Math.min(activeStepIndex, maxVisitedStepIndex) : maxVisitedStepIndex
              }
              onStepSelect={onStepSelect}
            />
          </Box>
        </Box>

        <Box
          component="form"
          onSubmit={(event) => {
            if (isUploading) {
              event.preventDefault()
              return
            }
            onSubmit(event)
          }}
          sx={styles.form}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
