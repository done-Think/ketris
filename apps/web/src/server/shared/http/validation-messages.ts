import pt from '@/i18n/messages/pt-BR/validation.json'
import en from '@/i18n/messages/en-US/validation.json'
import es from '@/i18n/messages/es-ES/validation.json'
import type { AppLocale } from '@/i18n/types/locale.types'
import type { ValidationParameter } from '../types/request-validation'

export type ServerValidationMessageKey = keyof typeof pt.server

const catalogs = { 'pt-BR': pt.server, 'en-US': en.server, 'es-ES': es.server }

export function isServerValidationMessageKey(value: unknown): value is ServerValidationMessageKey {
  return typeof value === 'string' && Object.hasOwn(pt.server, value)
}

export function validationMessage(
  locale: AppLocale,
  key: ServerValidationMessageKey,
  params: Record<string, ValidationParameter> = {},
): string {
  return catalogs[locale][key].replace(/\{(\w+)\}/g, (_placeholder, name: string) =>
    String(params[name] ?? ''),
  )
}

const customMessages = new Map<string, ServerValidationMessageKey>([
  ['A data de término deve ser posterior à data de início.', 'endAfterStart'],
  ['Informe ao menos um campo para atualizar.', 'updateRequired'],
  ['Informe ao menos um campo para atualização.', 'updateRequired'],
  ['Selecione um prestador ou informe seus dados.', 'providerRequired'],
  ['Informe o imóvel ou uma referência.', 'propertyReferenceRequired'],
  ['Informe o nome do participante.', 'participantNameRequired'],
  ['Informe o telefone do participante.', 'participantPhoneRequired'],
  ['Selecione os corretores destinatários do evento interno.', 'audienceRequired'],
  ['Visitas devem ter duração mínima de 30 minutos.', 'visitDuration'],
  ['Informe o motivo do cancelamento.', 'cancellationReasonRequired'],
  ['O motivo exige status CANCELLED.', 'cancellationStatusRequired'],
  ['"to" deve ser depois de "from".', 'periodEndAfterStart'],
  ['Informe uma descrição para uma cobrança avulsa (sem contrato).', 'descriptionRequired'],
  ['Envie um arquivo em "file".', 'fileRequired'],
  ['Envie somente um arquivo no campo file.', 'singleFileRequired'],
  ['Informe um destino válido em "target".', 'targetRequired'],
  ['Nome de arquivo inválido.', 'filenameInvalid'],
  ['Informe uma data existente em formato ISO.', 'isoDateInvalid'],
  ['Telefone inválido.', 'phoneInvalid'],
  ['Senha deve ter no máximo 72 bytes.', 'passwordBytes'],
  ['Senha deve ter pelo menos 8 caracteres.', 'passwordMinimum'],
  ['É necessário aceitar os termos.', 'termsRequired'],
  ['Use até 32 caracteres.', 'cpfLength'],
  ['Use no máximo duas casas decimais.', 'decimalPlaces'],
  ['URL inválida.', 'urlInvalid'],
  ['Informe um vinculo.', 'linkRequired'],
  ['Informe a parte e o usuario locatario juntos.', 'partyAndRenterRequired'],
  ['Corpo da requisição não é um JSON válido.', 'invalidJson'],
])

export function customValidationMessageKey(
  message: string,
  params?: Record<string, unknown>,
): ServerValidationMessageKey | undefined {
  if (isServerValidationMessageKey(params?.i18nKey)) return params.i18nKey
  return customMessages.get(message)
}
