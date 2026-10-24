'use client'

import { styles } from '../styles/property-detail-dashboard-page.styles'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import { Box, Stack, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSnackbar } from 'notistack'

import { useRouter } from '@/i18n/navigation'
import { getRestrictedRoleAccess } from '@shared/lib/auth/restricted-role-access'

import { useDashboardPropertyMappingOptions } from '../hooks/use-dashboard-property-mapping-options'
import {
  useDeleteProperty,
  useProperty,
  usePublishProperty,
  useUnpublishProperty,
} from '../hooks/use-properties'
import type {
  DashboardPropertyDetailTab,
  PropertyDetailDashboardPageProps,
} from '../types/dashboard-property'
import { extractErrorMessage } from '@shared/utils/error-message'
import { isPropertyNotFound } from '../utils/is-property-not-found'
import { PropertyQueryFeedback } from './PropertyQueryFeedback'
import { toDashboardProperty } from '../utils/map-dashboard-property'
import { DeletePropertyDialog } from './DeletePropertyDialog'
import { PropertyDetailHeader } from './PropertyDetailHeader'
import { PropertyDetailMainPanel } from './PropertyDetailMainPanel'
import { PropertyDetailSidebar } from './PropertyDetailSidebar'
import { PropertyDetailTabs } from './PropertyDetailTabs'

export function PropertyDetailDashboardPage({ propertyId }: PropertyDetailDashboardPageProps) {
  const t = useTranslations('properties.detail')
  const renterT = useTranslations('properties.dashboard.renter')
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const mappingOptions = useDashboardPropertyMappingOptions()
  const { data: session } = useSession()
  const restrictedAccess = getRestrictedRoleAccess(session?.role)
  const isRestrictedViewer = Boolean(restrictedAccess)
  const isReadOnlyViewer = isRestrictedViewer && !restrictedAccess?.canManageProperties
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<DashboardPropertyDetailTab>('data')
  const propertyQuery = useProperty(propertyId)
  const publishProperty = usePublishProperty()
  const unpublishProperty = useUnpublishProperty()
  const deleteProperty = useDeleteProperty()
  if (propertyQuery.isError) {
    if (isPropertyNotFound(propertyQuery.error)) notFound()
    return (
      <PropertyQueryFeedback
        onRetry={() => {
          void propertyQuery.refetch()
        }}
      />
    )
  }
  if (!propertyQuery.data) return <PropertyQueryFeedback loading />

  const property = toDashboardProperty(propertyQuery.data, mappingOptions)
  const canManage =
    Boolean(restrictedAccess?.canManageProperties) ||
    (!isRestrictedViewer &&
      (session?.role === 'OWNER' || session?.user?.id === property.responsibleUserId))

  const handlePublish = async () => {
    try {
      await publishProperty.mutateAsync(propertyId)
      enqueueSnackbar(t('publishSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('publishError')), { variant: 'error' })
    }
  }

  const handleUnpublish = async () => {
    try {
      await unpublishProperty.mutateAsync(propertyId)
      enqueueSnackbar(t('unpublishSuccess'), { variant: 'success' })
    } catch (error) {
      enqueueSnackbar(extractErrorMessage(error, t('unpublishError')), { variant: 'error' })
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
      enqueueSnackbar(extractErrorMessage(error, t('deleteError')), { variant: 'error' })
    }
  }

  return (
    <Box sx={styles.box}>
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
        readOnly={isReadOnlyViewer}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {isReadOnlyViewer && (
        <Typography color="text.secondary" sx={styles.typography}>
          {renterT('readOnly')}
        </Typography>
      )}
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={{ xs: 3, lg: 3.6 }}
        alignItems="flex-start"
      >
        <Box sx={styles.box2}>
          <PropertyDetailMainPanel
            property={property}
            activeTab={isReadOnlyViewer && activeTab !== 'media' ? 'data' : activeTab}
          />
        </Box>

        {!isReadOnlyViewer && <PropertyDetailSidebar property={property} />}
      </Stack>

      {canManage && (
        <DeletePropertyDialog
          open={isDeleteDialogOpen}
          isPending={deleteProperty.isPending}
          title={property.title}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </Box>
  )
}
