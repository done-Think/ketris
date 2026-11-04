import { resolveRequestLocale } from '@server/shared/http/request-locale'

const messages = {
  UNAUTHORIZED: [
    'Entre na sua conta para continuar.',
    'Sign in to continue.',
    'Inicia sesión para continuar.',
  ],
  FORBIDDEN: [
    'Você não tem acesso a esta verificação.',
    'You do not have access to this verification.',
    'No tienes acceso a esta verificación.',
  ],
  SESSION_NOT_FOUND: [
    'Verificação não encontrada.',
    'Verification not found.',
    'Verificación no encontrada.',
  ],
  SESSION_EXPIRED: [
    'Este link de verificação expirou.',
    'This verification link has expired.',
    'Este enlace de verificación ha caducado.',
  ],
  SESSION_NOT_IN_REVIEW: [
    'Esta verificação não aguarda revisão.',
    'This verification is not awaiting review.',
    'Esta verificación no está pendiente de revisión.',
  ],
  SESSION_NOT_REJECTED: [
    'Esta verificação não pode ser reaberta.',
    'This verification cannot be reopened.',
    'Esta verificación no se puede reabrir.',
  ],
  INVALID_CAPTURE_STATE: [
    'Esta etapa não está disponível agora.',
    'This step is not available now.',
    'Este paso no está disponible ahora.',
  ],
  NO_ATTEMPTS_LEFT: [
    'O limite de tentativas foi atingido.',
    'The attempt limit has been reached.',
    'Se ha alcanzado el límite de intentos.',
  ],
  AGENCY_NAME_MISSING: [
    'O nome da empresa está indisponível.',
    'The company name is unavailable.',
    'El nombre de la empresa no está disponible.',
  ],
  CONSENT_TERMS_OUTDATED: [
    'Reabra o consentimento atualizado para continuar.',
    'Open the updated consent to continue.',
    'Abre el consentimiento actualizado para continuar.',
  ],
  DOCUMENT_TYPE_NOT_ACCEPTED: [
    'Este tipo de documento não é aceito nesta verificação.',
    'This document type is not accepted for this verification.',
    'Este tipo de documento no se acepta para esta verificación.',
  ],
  IMAGE_REQUIRED: [
    'Envie uma foto para continuar.',
    'Upload a photo to continue.',
    'Envía una foto para continuar.',
  ],
  EVIDENCE_NOT_REVEALED: [
    'Registre a visualização das evidências primeiro.',
    'Record the evidence view first.',
    'Registra primero la visualización de las evidencias.',
  ],
  EVIDENCE_DELETED: [
    'As imagens desta verificação foram excluídas ou expiraram. Solicite uma nova captura.',
    'These verification images have been deleted or expired. Request a new capture.',
    'Las imágenes de esta verificación se eliminaron o caducaron. Solicita una nueva captura.',
  ],
  MANUAL_OVERRIDE_INVALID: [
    'Informe o motivo e uma observação de pelo menos 10 caracteres para a validação manual.',
    'Provide a reason and a note of at least 10 characters for manual validation.',
    'Indica un motivo y una nota de al menos 10 caracteres para la validación manual.',
  ],
  EVIDENCE_RETENTION_NOT_CONFIGURED: [
    'A exclusão automática das imagens precisa ser configurada antes da captura.',
    'Automatic image deletion must be configured before capture.',
    'La eliminación automática de imágenes debe configurarse antes de la captura.',
  ],
  PHOTO_PURGE_FAILED: [
    'A exclusão segura das imagens será tentada novamente.',
    'Secure image deletion will be retried.',
    'Se volverá a intentar la eliminación segura de las imágenes.',
  ],
  EVIDENCE_NOT_FOUND: [
    'Evidência não encontrada.',
    'Evidence not found.',
    'Evidencia no encontrada.',
  ],
  PHOTO_REJECTED: [
    'Esta foto precisa ser refeita. Consulte a orientação exibida.',
    'Retake this photo. Follow the displayed guidance.',
    'Repite esta foto. Sigue la orientación indicada.',
  ],
  LIVENESS_FAILED: [
    'A prova de vida não foi concluída. Tente novamente.',
    'The liveness check was not completed. Try again.',
    'La prueba de vida no se completó. Inténtalo de nuevo.',
  ],
  VERIFICATION_INCOMPLETE: [
    'As verificações obrigatórias precisam ser concluídas antes da aprovação.',
    'Complete the required checks before approval.',
    'Completa las comprobaciones obligatorias antes de aprobar.',
  ],
  ANALYSIS_UNAVAILABLE: [
    'O serviço de análise está indisponível. Tente novamente mais tarde.',
    'The analysis service is unavailable. Try again later.',
    'El servicio de análisis no está disponible. Inténtalo más tarde.',
  ],
  ANALYSIS_TIMEOUT: [
    'A análise demorou mais que o esperado. Tente novamente.',
    'The analysis timed out. Try again.',
    'El análisis tardó demasiado. Inténtalo de nuevo.',
  ],
  ANALYSIS_FAILED: [
    'Não foi possível concluir a análise.',
    'The analysis could not be completed.',
    'No se pudo completar el análisis.',
  ],
  ANALYSIS_INVALID_RESPONSE: [
    'O serviço de análise retornou uma resposta inválida.',
    'The analysis service returned an invalid response.',
    'El servicio de análisis devolvió una respuesta no válida.',
  ],
  STORAGE_UNAVAILABLE: [
    'O armazenamento seguro está indisponível.',
    'Secure storage is unavailable.',
    'El almacenamiento seguro no está disponible.',
  ],
  PERSISTENCE_BUSY: [
    'Outra etapa está em andamento. Aguarde e tente novamente.',
    'Another step is in progress. Wait and try again.',
    'Hay otro paso en curso. Espera e inténtalo de nuevo.',
  ],
  PERSISTENCE_UNAVAILABLE: [
    'Não foi possível salvar a verificação. Tente novamente.',
    'The verification could not be saved. Try again.',
    'No se pudo guardar la verificación. Inténtalo de nuevo.',
  ],
  RATE_LIMITED: [
    'Muitas solicitações. Aguarde um minuto e tente novamente.',
    'Too many requests. Wait a minute and try again.',
    'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.',
  ],
  PAYLOAD_TOO_LARGE: [
    'Envie uma única foto com até 3 MiB.',
    'Upload one photo up to 3 MiB.',
    'Envía una sola foto de hasta 3 MiB.',
  ],
  INVALID_IMAGE: [
    'Envie uma foto JPEG ou PNG válida.',
    'Upload a valid JPEG or PNG photo.',
    'Envía una foto JPEG o PNG válida.',
  ],
  INVALID_ORIGIN: [
    'A origem desta solicitação não é permitida.',
    'This request origin is not allowed.',
    'El origen de esta solicitud no está permitido.',
  ],
  VALIDATION_ERROR: [
    'Confira os dados enviados.',
    'Check the submitted information.',
    'Revisa los datos enviados.',
  ],
  RESULT_LIMIT_EXCEEDED: [
    'O volume de verificações excede o limite desta consulta. Entre em contato com o suporte.',
    'The verification volume exceeds this query limit. Contact support.',
    'El volumen de verificaciones supera el límite de esta consulta. Contacta con soporte.',
  ],
  INTERNAL_ERROR: [
    'Não foi possível concluir a solicitação.',
    'The request could not be completed.',
    'No se pudo completar la solicitud.',
  ],
} as const

export function faceCheckErrorMessage(code: string, request: Request) {
  const locale = resolveRequestLocale(request).toLowerCase()
  const index = locale.startsWith('en') ? 1 : locale.startsWith('es') ? 2 : 0
  return (messages[code as keyof typeof messages] ?? messages.INTERNAL_ERROR)[index]
}
