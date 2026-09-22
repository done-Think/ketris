'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { Box, CircularProgress, Stack } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'

import {
  useDeleteProperty,
  useProperty,
  usePublishProperty,
  useUnpublishProperty,
} from '../hooks/use-properties'
import type {
  PropertyDetailDashboardFormValues,
  PropertyDetailDashboardPageProps,
} from '../types/dashboard-property'
import { errorMessage } from '../utils/error-message'
import { toDashboardProperty } from '../utils/map-dashboard-property'
import { DeletePropertyDialog } from './DeletePropertyDialog'
import { PropertyDetailHeader } from './PropertyDetailHeader'
import { PropertyDetailMainPanel } from './PropertyDetailMainPanel'
import { PropertyDetailSidebar } from './PropertyDetailSidebar'
import { PropertyDetailTabs } from './PropertyDetailTabs'

export function PropertyDetailDashboardPage({ propertyId }: PropertyDetailDashboardPageProps) {
  const t = useTranslations('properties.detail')
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const { data: session } = useSession()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { setValue, watch } = useForm<PropertyDetailDashboardFormValues>({
    defaultValues: {
      activeTab: 'data',
    },
  })
  const activeTab = watch('activeTab')
  const propertyQuery = useProperty(propertyId)
  const publishProperty = usePublishProperty()
  const unpublishProperty = useUnpublishProperty()
  const deleteProperty = useDeleteProperty()

  if (propertyQuery.isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '55vh' }}>
        <CircularProgress size={30} />
      </Stack>
    )
  }

  if (propertyQuery.isError || !propertyQuery.data) {
    notFound()
  }

  const property = toDashboardProperty(propertyQuery.data)
  const canManage =
    session?.papel === 'ADMIN' ||
    session?.papel === 'OWNER' ||
    session?.user?.id === property.responsibleUserId

  const handlePublish = async () => {
    try {
      await publishProperty.mutateAsync(propertyId)
      enqueueSnackbar(t('publishSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('publishError')), { variant: 'error' })
    }
  }

  const handleUnpublish = async () => {
    try {
      await unpublishProperty.mutateAsync(propertyId)
      enqueueSnackbar(t('unpublishSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(errorMessage(error, t('unpublishError')), { variant: 'error' })
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteProperty.mutateAsync(propertyId)
      setIsDeleteDialogOpen(false)
      enqueueSnackbar(t('deleteSuccess'), { variant: 'success' })
      router.push({ pathname: '/dashboard/properties' })
    } catch (error) {
      setIsDeleteDialogOpen(false)
      enqueueSnackbar(errorMessage(error, t('deleteError')), { variant: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4.8 }, py: { xs: 2.6, md: 5 } }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={{ xs: 3, lg: 3.6 }}
        alignItems="flex-start"
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <PropertyDetailHeader
            property={property}
            canManage={canManage}
            isPublishing={publishProperty.isPending}
            isUnpublishing={unpublishProperty.isPending}
            isDeleting={deleteProperty.isPending}
            onEdit={() =>
              router.push({
                pathname: '/dashboard/properties/[id]/edit',
                params: { id: propertyId },
              })
            }
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onDeleteRequest={() => setIsDeleteDialogOpen(true)}
          />
          <PropertyDetailTabs
            activeTab={activeTab}
            onTabChange={(tab) => setValue('activeTab', tab)}
          />
          <PropertyDetailMainPanel property={property} activeTab={activeTab} />
        </Box>

        <PropertyDetailSidebar property={property} />
      </Stack>

      <DeletePropertyDialog
        open={isDeleteDialogOpen}
        isPending={deleteProperty.isPending}
        title={property.title}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  )
}
