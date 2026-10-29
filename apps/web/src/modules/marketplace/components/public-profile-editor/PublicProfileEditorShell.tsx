'use client'

import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { Box, Dialog, DialogContent, Stack, Typography } from '@mui/material'

import {
  DashboardHeaderActionButton,
  DashboardNotificationsButton,
  DashboardPageHeader,
} from '@shared/components/layout'

import { styles } from '../../styles/public-profile-editor.styles'
import type { PublicProfileEditorShellProps } from '../../types/profile-editor'

export function PublicProfileEditorShell({
  formId,
  title,
  subtitle,
  labels,
  status,
  isEditing,
  isSaving,
  isTogglingPublish,
  showValidated,
  onEdit,
  onTogglePublish,
  onSubmit,
  previewOpen,
  onOpenPreview,
  onClosePreview,
  preview,
  children,
}: PublicProfileEditorShellProps) {
  const published = status === 'PUBLISHED'

  return (
    <Box sx={styles.page}>
      <DashboardPageHeader
        title={title}
        subtitle={subtitle}
        sx={styles.header}
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={styles.actions}>
            {showValidated ? (
              <Stack direction="row" spacing={0.8} alignItems="center" sx={styles.validated}>
                <CheckCircleOutlineRoundedIcon sx={styles.iconMd} />
                <Typography sx={styles.validatedText}>{labels.validatedDraft}</Typography>
              </Stack>
            ) : null}
            <DashboardHeaderActionButton
              variant="outlined"
              color="secondary"
              startIcon={<VisibilityOutlinedIcon sx={styles.iconSm} />}
              onClick={onOpenPreview}
              sx={styles.previewButton}
            >
              {labels.preview}
            </DashboardHeaderActionButton>
            {isEditing ? (
              <DashboardHeaderActionButton
                key="save"
                type="submit"
                form={formId}
                startIcon={<SaveOutlinedIcon sx={styles.iconSm} />}
                disabled={isSaving}
              >
                {labels.save}
              </DashboardHeaderActionButton>
            ) : (
              <DashboardHeaderActionButton
                key="edit"
                type="button"
                onClick={onEdit}
                startIcon={<SaveOutlinedIcon sx={styles.iconSm} />}
              >
                {labels.edit}
              </DashboardHeaderActionButton>
            )}
            {status ? (
              <DashboardHeaderActionButton
                variant="outlined"
                color={published ? 'error' : 'success'}
                onClick={onTogglePublish}
                disabled={isTogglingPublish}
              >
                {published ? labels.unpublish : labels.publish}
              </DashboardHeaderActionButton>
            ) : null}
            <Box sx={styles.desktopOnly}>
              <DashboardNotificationsButton />
            </Box>
          </Stack>
        }
      />
      <Box id={formId} component="form" noValidate onSubmit={onSubmit} sx={styles.form}>
        <Box sx={styles.layout}>{children}</Box>
      </Box>
      <Dialog open={previewOpen} onClose={onClosePreview} maxWidth="lg" fullWidth>
        <DialogContent sx={styles.previewContent}>{previewOpen ? preview : null}</DialogContent>
      </Dialog>
    </Box>
  )
}
