'use client'

import { useState } from 'react'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PublishOutlinedIcon from '@mui/icons-material/PublishOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  type SxProps,
  type Theme,
} from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'
import { alpha, iconSize } from '@shared/theme/tokens'

import {
  useDeleteProperty,
  usePublishProperty,
  useUnpublishProperty,
} from '../hooks/use-properties'
import type { DashboardProperty } from '../types/dashboard-property'
import { errorMessage } from '../utils/error-message'
import { DeletePropertyDialog } from './DeletePropertyDialog'

export interface PropertyRowActionsProps {
  property: DashboardProperty
  onView: () => void
}

const rowActionButtonSx: SxProps<Theme> = {
  width: 36,
  height: 36,
  border: '1px solid',
  borderColor: 'divider',
  color: 'text.secondary',
  '&:hover': {
    borderColor: 'primary.main',
    color: 'primary.main',
    bgcolor: alpha.magenta[6],
  },
}

export function PropertyRowActions({ property, onView }: PropertyRowActionsProps) {
  const t = useTranslations('properties.dashboard.table')
  const detailT = useTranslations('properties.detail')
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const { data: session } = useSession()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const publishProperty = usePublishProperty()
  const unpublishProperty = useUnpublishProperty()
  const deleteProperty = useDeleteProperty()

  const canManage =
    session?.papel === 'ADMIN' ||
    session?.papel === 'OWNER' ||
    session?.user?.id === property.responsibleUserId
  const isPublished = property.apiStatus === 'PUBLISHED'
  const isMutating =
    publishProperty.isPending || unpublishProperty.isPending || deleteProperty.isPending

  const closeMenu = () => setMenuAnchor(null)

  const handleEdit = () => {
    closeMenu()
    router.push({ pathname: '/dashboard/properties/[id]/edit', params: { id: property.id } })
  }

  const handleTogglePublish = async () => {
    closeMenu()

    try {
      if (isPublished) {
        await unpublishProperty.mutateAsync(property.id)
        enqueueSnackbar(detailT('unpublishSuccess'), { variant: 'success' })
      } else {
        await publishProperty.mutateAsync(property.id)
        enqueueSnackbar(detailT('publishSuccess'), { variant: 'success' })
      }
    } catch (error) {
      enqueueSnackbar(
        errorMessage(error, isPublished ? detailT('unpublishError') : detailT('publishError')),
        { variant: 'error' },
      )
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteProperty.mutateAsync(property.id)
      setIsDeleteDialogOpen(false)
      enqueueSnackbar(detailT('deleteSuccess'), { variant: 'success' })
    } catch (error) {
      setIsDeleteDialogOpen(false)
      enqueueSnackbar(errorMessage(error, detailT('deleteError')), { variant: 'error' })
    }
  }

  return (
    <Stack
      direction="row"
      spacing={0.8}
      sx={{ width: '100%', justifyContent: 'center', alignItems: 'center', height: '100%' }}
    >
      <IconButton
        aria-label={t('viewAriaLabel', { title: property.title })}
        onClick={(event) => {
          event.stopPropagation()
          onView()
        }}
        sx={rowActionButtonSx}
      >
        <VisibilityOutlinedIcon sx={{ fontSize: iconSize.md }} />
      </IconButton>

      {canManage ? (
        <>
          <IconButton
            aria-label={t('moreActionsAriaLabel', { title: property.title })}
            onClick={(event) => {
              event.stopPropagation()
              setMenuAnchor(event.currentTarget)
            }}
            disabled={isMutating}
            sx={rowActionButtonSx}
          >
            <MoreVertIcon sx={{ fontSize: iconSize.md }} />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditOutlinedIcon sx={{ fontSize: iconSize.md }} />
              </ListItemIcon>
              <ListItemText>{detailT('edit')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleTogglePublish} disabled={isMutating}>
              <ListItemIcon>
                {isPublished ? (
                  <VisibilityOffOutlinedIcon sx={{ fontSize: iconSize.md }} />
                ) : (
                  <PublishOutlinedIcon sx={{ fontSize: iconSize.md }} />
                )}
              </ListItemIcon>
              <ListItemText>{isPublished ? detailT('unpublish') : detailT('publish')}</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu()
                setIsDeleteDialogOpen(true)
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteOutlineRoundedIcon sx={{ fontSize: iconSize.md, color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>{detailT('delete')}</ListItemText>
            </MenuItem>
          </Menu>
        </>
      ) : null}

      <DeletePropertyDialog
        open={isDeleteDialogOpen}
        isPending={deleteProperty.isPending}
        title={property.title}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </Stack>
  )
}
