import { extractErrorMessage } from '@shared/utils/error-message'
import { useTranslations } from 'next-intl'
import { MaintenanceUploadValidationError } from '../utils/maintenance-file'

export function useMaintenanceErrorMessage() {
  const t = useTranslations('dashboard.maintenance.errors')
  return (error: unknown, fallback: string) =>
    error instanceof MaintenanceUploadValidationError
      ? t('attachmentInvalid')
      : extractErrorMessage(error, fallback, {
          MAINTENANCE_STORAGE_UNAVAILABLE: t('storageUnavailable'),
          MAINTENANCE_UPLOAD_EXPIRED: t('uploadExpired'),
          MAINTENANCE_UPLOAD_INVALID: t('uploadInvalid'),
          FORBIDDEN: t('forbidden'),
          UNAUTHORIZED: t('unauthorized'),
          CONFLICT: t('conflict'),
          VALIDATION_ERROR: t('validation'),
          REQUEST_VALIDATION_ERROR: t('validation'),
          MAINTENANCE_TICKET_NOT_FOUND: t('ticketNotFound'),
          MAINTENANCE_PROPERTY_NOT_FOUND: t('propertyNotFound'),
          MAINTENANCE_TICKET_ALREADY_RESOLVED: t('alreadyResolved'),
          MAINTENANCE_ATTACHMENT_VALIDATION_ERROR: t('attachmentInvalid'),
          MAINTENANCE_PROVIDER_NOT_FOUND: t('providerNotFound'),
          MAINTENANCE_PROVIDER_INACTIVE: t('providerInactive'),
          MAINTENANCE_PROVIDER_ALREADY_EXISTS: t('providerExists'),
        })
}
