import { alpha, brand, supportColor } from '@shared/theme/tokens'

import type {
  ContractActionMockContent,
  ContractActionMenuKey,
  ContractActionMenuOption,
  ContractTableAction,
  ContractFilterTab,
  ContractMetric,
  ContractMetricToneStyle,
  ContractStatus,
  ContractStatusStyle,
  ContractType,
  ContractsFiltersFormValues,
  CreateContractStep,
} from '../types/contract'

export const createContractSteps: CreateContractStep[] = [
  { key: 'parties', label: 'Partes' },
  { key: 'property', label: 'Imóvel' },
  { key: 'conditions', label: 'Condições' },
  { key: 'review', label: 'Revisão' },
]

export const contractStatusOptions: ContractStatus[] = [
  'Rascunho',
  'Em revisão',
  'Aguardando assinatura',
  'Assinado',
  'Ativo',
  'Encerrado',
  'Cancelado',
]

export const contractTypeOptions: ContractType[] = ['Residencial', 'Comercial', 'Temporada']

export const contractTypeFilterOptions: Array<ContractsFiltersFormValues['type']> = [
  'Todos',
  ...contractTypeOptions,
]

export const contractPeriodOptions = ['Todos', 'Vencem este mês', 'Vencem em 90 dias'] as const

export const contractFilterTabs: ContractFilterTab[] = [
  { label: 'Todos', status: 'Todos', period: 'Todos' },
  { label: 'Ativos', status: 'Ativo', period: 'Todos' },
  { label: 'Vencendo', status: 'Todos', period: 'Vencem em 90 dias' },
  { label: 'Encerrados', status: 'Encerrado', period: 'Todos' },
]

export const contractStatusStyles: Record<ContractStatus, ContractStatusStyle> = {
  Rascunho: { bgcolor: alpha.graphite[6], color: brand.graphite[500] },
  'Em revisão': { bgcolor: supportColor.warningSoft, color: brand.semantic.warning },
  'Aguardando assinatura': { bgcolor: supportColor.infoSoft, color: brand.semantic.info },
  Assinado: { bgcolor: alpha.magenta[8], color: brand.magenta[700] },
  Ativo: { bgcolor: supportColor.successSoft, color: brand.semantic.success },
  Encerrado: { bgcolor: alpha.graphite[8], color: brand.neutral[500] },
  Cancelado: { bgcolor: alpha.error[10], color: brand.semantic.error },
}

export const contractMetricToneStyles: Record<ContractMetric['tone'], ContractMetricToneStyle> = {
  primary: {
    bgcolor: alpha.magenta[8],
    color: brand.magenta[700],
    borderColor: alpha.magenta[14],
  },
  info: {
    bgcolor: supportColor.infoSoft,
    color: brand.semantic.info,
    borderColor: alpha.graphite[8],
  },
  warning: {
    bgcolor: supportColor.warningSoft,
    color: brand.semantic.warning,
    borderColor: alpha.graphite[8],
  },
  success: {
    bgcolor: supportColor.successSoft,
    color: brand.semantic.success,
    borderColor: alpha.graphite[8],
  },
}

export const contractMetrics: ContractMetric[] = [
  { label: 'Ativos', value: '124', caption: 'Contratos vigentes', tone: 'success' },
  { label: 'Vencendo em 30d', value: '8', caption: 'Exigem acompanhamento', tone: 'warning' },
  { label: 'Inadimplentes', value: '3', caption: 'Com pendencias financeiras', tone: 'primary' },
]

export const contractActionMenuOptions: Record<ContractActionMenuKey, ContractActionMenuOption[]> =
  {
    view: [
      { action: 'view-summary', label: 'Ver resumo', icon: 'summary' },
      { action: 'view-history', label: 'Ver histórico', icon: 'history' },
    ],
    edit: [
      { action: 'edit-data', label: 'Editar dados', icon: 'edit' },
      { action: 'duplicate', label: 'Duplicar contrato', icon: 'duplicate' },
    ],
    download: [
      { action: 'download-pdf', label: 'Baixar PDF', icon: 'pdf' },
      { action: 'download-draft', label: 'Baixar minuta', icon: 'draft' },
    ],
    send: [
      { action: 'send-signature', label: 'Enviar assinatura', icon: 'send' },
      { action: 'copy-signature-link', label: 'Copiar link', icon: 'link' },
    ],
  }

export const contractActionMockContents: Record<ContractTableAction, ContractActionMockContent> = {
  'view-summary': {
    title: 'Resumo do contrato',
    description: 'Previa dos principais dados que seriam exibidos na visualizacao completa.',
    statusLabel: 'Mock de visualizacao',
    primaryActionLabel: 'Abrir contrato',
    successMessage: 'Visualizacao completa ainda sera conectada.',
    sections: [
      {
        title: 'Dados principais',
        items: [
          { label: 'Codigo', value: 'Preenchido pela tabela' },
          { label: 'Imovel', value: 'Nome do imovel selecionado' },
          { label: 'Status atual', value: 'Etapa operacional do contrato' },
        ],
      },
      {
        title: 'Partes',
        items: [
          { label: 'Locador', value: 'Responsavel pelo imovel' },
          { label: 'Locatario', value: 'Cliente vinculado ao contrato' },
          { label: 'Garantia', value: 'Fiador, caucao ou seguro fianca' },
        ],
      },
    ],
  },
  'view-history': {
    title: 'Historico do contrato',
    description: 'Linha do tempo mockada com eventos relevantes do fluxo do contrato.',
    statusLabel: 'Mock de historico',
    primaryActionLabel: 'Ver auditoria',
    successMessage: 'Historico completo ainda sera conectado.',
    sections: [
      {
        title: 'Eventos recentes',
        items: [
          { label: 'Hoje, 10:32', value: 'Contrato revisado por Guilherme Silva' },
          { label: 'Ontem, 17:18', value: 'Minuta gerada automaticamente' },
          { label: '22/08/2026, 09:44', value: 'Cadastro inicial salvo como rascunho' },
        ],
      },
    ],
  },
  'edit-data': {
    title: 'Editar dados',
    description: 'Previa dos grupos de informacao que ficariam disponiveis para ajuste.',
    statusLabel: 'Mock de edicao',
    primaryActionLabel: 'Continuar edicao',
    successMessage: 'Tela de edicao ainda sera conectada.',
    sections: [
      {
        title: 'Campos liberados',
        items: [
          { label: 'Partes', value: 'Locador, locatario e fiador' },
          { label: 'Imovel', value: 'Endereco, tipo e identificacao interna' },
          { label: 'Condicoes', value: 'Valor, vigencia, reajuste e observacoes' },
        ],
      },
    ],
  },
  duplicate: {
    title: 'Duplicar contrato',
    description: 'Mock da criacao de uma nova minuta usando este contrato como base.',
    statusLabel: 'Mock de duplicacao',
    primaryActionLabel: 'Duplicar minuta',
    successMessage: 'Duplicacao de contrato ainda sera conectada.',
    sections: [
      {
        title: 'Sera copiado',
        items: [
          { label: 'Imovel', value: 'Mantem o imovel original' },
          { label: 'Partes', value: 'Mantem locador e locatario para revisao' },
          { label: 'Status', value: 'Nova copia entra como rascunho' },
        ],
      },
    ],
  },
  'download-pdf': {
    title: 'Baixar PDF',
    description: 'Previa do arquivo final que sera entregue para consulta ou assinatura.',
    statusLabel: 'Mock de download',
    primaryActionLabel: 'Baixar PDF',
    successMessage: 'Download do PDF ainda sera conectado.',
    sections: [
      {
        title: 'Arquivo',
        items: [
          { label: 'Formato', value: 'PDF assinado ou consolidado' },
          { label: 'Nome', value: 'codigo-do-contrato.pdf' },
          { label: 'Conteudo', value: 'Contrato, anexos e quadro resumo' },
        ],
      },
    ],
  },
  'download-draft': {
    title: 'Baixar minuta',
    description: 'Previa da minuta editavel antes da coleta de assinaturas.',
    statusLabel: 'Mock de minuta',
    primaryActionLabel: 'Baixar minuta',
    successMessage: 'Download da minuta ainda sera conectado.',
    sections: [
      {
        title: 'Arquivo',
        items: [
          { label: 'Formato', value: 'DOCX ou PDF de conferencia' },
          { label: 'Nome', value: 'minuta-codigo-do-contrato' },
          { label: 'Uso', value: 'Revisao juridica e ajustes internos' },
        ],
      },
    ],
  },
  'send-signature': {
    title: 'Enviar para assinatura',
    description: 'Mock do disparo para as partes envolvidas no contrato.',
    statusLabel: 'Mock de envio',
    primaryActionLabel: 'Enviar agora',
    successMessage: 'Envio para assinatura ainda sera conectado.',
    sections: [
      {
        title: 'Destinatarios',
        items: [
          { label: 'Locador', value: 'Recebe primeiro para conferencia' },
          { label: 'Locatario', value: 'Recebe apos liberacao do locador' },
          { label: 'Fiador', value: 'Incluido quando existir garantia por fiador' },
        ],
      },
    ],
  },
  'copy-signature-link': {
    title: 'Copiar link de assinatura',
    description: 'Previa do link seguro para compartilhar com as partes.',
    statusLabel: 'Mock de link',
    primaryActionLabel: 'Copiar link',
    successMessage: 'Link de assinatura ainda sera conectado.',
    sections: [
      {
        title: 'Link',
        items: [
          { label: 'URL', value: 'https://app.ketris.local/assinaturas/contrato' },
          { label: 'Validade', value: 'Expira em 7 dias apos a geracao' },
          { label: 'Permissao', value: 'Acesso restrito aos signatarios' },
        ],
      },
    ],
  },
}
