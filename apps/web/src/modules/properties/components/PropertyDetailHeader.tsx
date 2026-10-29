import { styles, getStatusChipStyles } from '../styles/property-detail-header.styles'
import { Box, Button, Chip, CircularProgress, Stack, Typography } from '@mui/material'
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { useTranslations } from 'next-intl'

import { useRouter } from '@/i18n/navigation'

import { dashboardPropertyStatusStyles } from '../styles/property-status.styles'
import type { PropertyDetailHeaderProps } from '../types/dashboard-property'

export function PropertyDetailHeader({
  property,
  canManage,
  isPublishing,
  isUnpublishing,
  isDeleting,
  onEdit,
  onPublish,
  onUnpublish,
  onDeleteRequest,
}: PropertyDetailHeaderProps) {
  const router = useRouter()
  const t = useTranslations('properties.detail')
  const statusT = useTranslations('properties.dashboard.filters')
  const status = dashboardPropertyStatusStyles[property.status]
  const isPublished = property.apiStatus === 'PUBLISHED'
  const activeContractId = property.activeContractId
  const isRented = property.status === 'rented'
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="space-between"
      useFlexGap
      gap={2}
      sx={styles.stack}
    >
      <Box sx={styles.box}>
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          useFlexGap
          columnGap={1.6}
          rowGap={0.8}
          sx={styles.stack2}
        >
          <Typography variant="h2" sx={styles.typography}>
            {property.title}
          </Typography>
          <Chip label={statusT(property.status)} sx={getStatusChipStyles(status)} />
        </Stack>
        <Typography sx={styles.typography2}>
          {property.address} - {property.location}
        </Typography>
      </Box>

      {canManage ? (
        <Stack
          direction="row"
          flexWrap="wrap"
          alignItems="flex-start"
          useFlexGap
          gap={1.2}
          sx={styles.stack3}
        >
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlineRoundedIcon />}
            onClick={onDeleteRequest}
            disabled={isDeleting}
            sx={styles.button}
          >
            {t('delete')}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<EditOutlinedIcon />}
            onClick={onEdit}
            sx={styles.button2}
          >
            {t('edit')}
          </Button>
          <Stack spacing={1.1}>
            <Button
              variant="contained"
              startIcon={
                isPublishing || isUnpublishing ? (
                  <CircularProgress size={16} color="inherit" />
                ) : isPublished ? (
                  <VisibilityOffOutlinedIcon />
                ) : (
                  <PublishOutlinedIcon />
                )
              }
              onClick={isPublished ? onUnpublish : onPublish}
              disabled={isPublishing || isUnpublishing}
              sx={styles.button3}
            >
              {isPublished ? t('unpublish') : t('publish')}
            </Button>
            {isRented && activeContractId ? (
              <Button
                onClick={() =>
                  router.push({
                    pathname: '/dashboard/contracts/[id]',
                    params: { id: activeContractId },
                  })
                }
                variant="outlined"
                color="secondary"
                startIcon={<ArticleOutlinedIcon />}
                sx={styles.button4}
              >
                {t('activeContract')}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      ) : null}
    </Stack>
  )
}
