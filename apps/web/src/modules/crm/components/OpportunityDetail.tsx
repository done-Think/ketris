'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  Link,
  Menu,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import axios from 'axios'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSnackbar } from 'notistack'

import { alpha, brand, iconSize, radius, shadows, surface } from '@shared/theme/tokens'

import { opportunityStageByStatus, opportunityStages } from '../config/opportunity-stages'
import {
  useArchiveOpportunity,
  useCrmProperty,
  useOpportunity,
  useUpdateOpportunity,
} from '../hooks/use-opportunities'
import type { Opportunity, OpportunityStatus } from '../types/opportunity'
import {
  formatCurrency,
  formatDate,
  formatMonthlyCurrency,
  formatRelativeDate,
} from '../utils/formatters'

type OpportunityDetailProps = {
  opportunityId: string
}

type EditFormState = {
  interessadoNome: string
  interessadoEmail: string
  interessadoTelefone: string
  valorProposto: string
  prazoContratoMeses: string
  inicioPretendido: string
  garantiaContratual: Opportunity['garantiaContratual']
  condicoesEspeciais: string
  observacoes: string
}

const panelSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: `${radius.md}px`,
  bgcolor: surface.paper,
  boxShadow: `0 10px 30px ${alpha.graphite[6]}`,
} as const

const labelSx = {
  color: 'text.disabled',
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
} as const

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message
    if (typeof message === 'string') return message
  }

  return fallback
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function buildEditState(opportunity: Opportunity): EditFormState {
  return {
    interessadoNome: opportunity.interessadoNome,
    interessadoEmail: opportunity.interessadoEmail,
    interessadoTelefone: opportunity.interessadoTelefone ?? '',
    valorProposto: String(opportunity.valorProposto),
    prazoContratoMeses: opportunity.prazoContratoMeses
      ? String(opportunity.prazoContratoMeses)
      : '',
    inicioPretendido: toDateInput(opportunity.inicioPretendido),
    garantiaContratual: opportunity.garantiaContratual,
    condicoesEspeciais: opportunity.condicoesEspeciais.join(', '),
    observacoes: opportunity.observacoes ?? '',
  }
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={labelSx}>{label}</Typography>
      <Typography sx={{ mt: 0.45, fontSize: 13.5, fontWeight: 600, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  )
}

function DetailLoading() {
  return (
    <Box sx={{ p: { xs: 2, md: 3.5 } }} aria-label="Carregando oportunidade">
      <Skeleton width={180} height={24} />
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1, mb: 3 }}>
        <Skeleton width="42%" height={48} />
        <Skeleton width={150} height={48} />
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 58fr) minmax(320px, 42fr)' },
          gap: 2,
        }}
      >
        <Skeleton variant="rounded" height={310} />
        <Skeleton variant="rounded" height={310} />
      </Box>
    </Box>
  )
}

export function OpportunityDetail({ opportunityId }: OpportunityDetailProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const tenantId = session?.tenantId
  const opportunityQuery = useOpportunity(tenantId, opportunityId)
  const opportunity = opportunityQuery.data
  const propertyQuery = useCrmProperty(tenantId, opportunity?.imovelId)
  const updateOpportunity = useUpdateOpportunity(tenantId ?? '')
  const archiveOpportunity = useArchiveOpportunity(tenantId ?? '')
  const { enqueueSnackbar } = useSnackbar()
  const [stageMenuAnchor, setStageMenuAnchor] = useState<HTMLElement | null>(null)
  const [nextStatus, setNextStatus] = useState<OpportunityStatus | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)

  const activities = useMemo(() => {
    if (!opportunity) return []

    const items = [
      {
        key: 'created',
        title: 'Oportunidade criada',
        detail: 'Registro incluído no pipeline.',
        occurredAt: opportunity.createdAt,
      },
    ]

    if (new Date(opportunity.updatedAt).getTime() > new Date(opportunity.createdAt).getTime()) {
      items.unshift({
        key: 'updated',
        title: 'Oportunidade atualizada',
        detail: `Etapa atual: ${opportunityStageByStatus[opportunity.status].label}.`,
        occurredAt: opportunity.updatedAt,
      })
    }

    return items
  }, [opportunity])

  if (opportunityQuery.isLoading) return <DetailLoading />

  if (opportunityQuery.isError || !opportunity) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={2}
        sx={{ minHeight: '65vh', p: 3 }}
      >
        <Alert severity="error" sx={{ maxWidth: 520 }}>
          Não foi possível carregar esta oportunidade.
        </Alert>
        <Button variant="outlined" onClick={() => opportunityQuery.refetch()}>
          Tentar novamente
        </Button>
        <Button component={NextLink} href="/crm" startIcon={<ArrowBackRoundedIcon />}>
          Voltar ao pipeline
        </Button>
      </Stack>
    )
  }

  const currentOpportunity = opportunity
  const stage = opportunityStageByStatus[currentOpportunity.status]
  const isMutating = updateOpportunity.isPending || archiveOpportunity.isPending
  const property = propertyQuery.data
  const propertyLocation = property
    ? [property.bairro, property.cidade].filter(Boolean).join(' · ') || 'Localização não informada'
    : ''

  function requestStatusChange(status: OpportunityStatus) {
    setStageMenuAnchor(null)
    setNextStatus(status)
  }

  async function confirmStatusChange() {
    if (!nextStatus) return

    try {
      await updateOpportunity.mutateAsync({
        id: currentOpportunity.id,
        changes: { status: nextStatus },
      })
      enqueueSnackbar(`Oportunidade movida para ${opportunityStageByStatus[nextStatus].label}.`, {
        variant: 'success',
      })
      setNextStatus(null)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Não foi possível atualizar a etapa.'), {
        variant: 'error',
      })
    }
  }

  function openEditDialog() {
    setEditForm(buildEditState(currentOpportunity))
    setEditOpen(true)
  }

  async function saveOpportunity() {
    if (!editForm) return

    const proposedValue = Number(editForm.valorProposto)
    const contractMonths = editForm.prazoContratoMeses ? Number(editForm.prazoContratoMeses) : null

    if (
      !editForm.interessadoNome.trim() ||
      !/^\S+@\S+\.\S+$/.test(editForm.interessadoEmail.trim()) ||
      !Number.isFinite(proposedValue) ||
      proposedValue <= 0 ||
      (contractMonths !== null && (!Number.isInteger(contractMonths) || contractMonths <= 0))
    ) {
      enqueueSnackbar('Revise os campos obrigatórios antes de salvar.', { variant: 'warning' })
      return
    }

    try {
      await updateOpportunity.mutateAsync({
        id: currentOpportunity.id,
        changes: {
          interessadoNome: editForm.interessadoNome.trim(),
          interessadoEmail: editForm.interessadoEmail.trim(),
          interessadoTelefone: editForm.interessadoTelefone.trim() || null,
          valorProposto: proposedValue,
          prazoContratoMeses: contractMonths,
          inicioPretendido: editForm.inicioPretendido || null,
          garantiaContratual: editForm.garantiaContratual,
          condicoesEspeciais: editForm.condicoesEspeciais
            .split(',')
            .map((condition) => condition.trim())
            .filter(Boolean),
          observacoes: editForm.observacoes.trim() || null,
        },
      })
      enqueueSnackbar('Oportunidade atualizada.', { variant: 'success' })
      setEditOpen(false)
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Não foi possível atualizar a oportunidade.'), {
        variant: 'error',
      })
    }
  }

  async function confirmArchive() {
    try {
      await archiveOpportunity.mutateAsync(currentOpportunity.id)
      enqueueSnackbar('Oportunidade arquivada.', { variant: 'success' })
      setArchiveOpen(false)
      router.replace('/crm')
    } catch (error) {
      enqueueSnackbar(errorMessage(error, 'Não foi possível arquivar a oportunidade.'), {
        variant: 'error',
      })
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', pb: 2, '& h1, & h2': { letterSpacing: '0 !important' } }}>
      <Box sx={{ p: { xs: 2, sm: 2.5, lg: 3.5 }, pb: { xs: 2, lg: 3 } }}>
        <Breadcrumbs
          aria-label="Navegação estrutural"
          separator="›"
          sx={{ mb: 1.2, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
        >
          <Link component={NextLink} href="/crm" underline="hover" color="text.secondary">
            Pipeline
          </Link>
          <Typography color="text.secondary">{stage.label}</Typography>
          <Typography color="text.primary" fontWeight={700}>
            {opportunity.interessadoNome}
          </Typography>
        </Breadcrumbs>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          gap={1.5}
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.2} flexWrap="wrap" useFlexGap>
            <Typography component="h1" sx={{ fontSize: { xs: 27, md: 31 }, fontWeight: 800 }}>
              {opportunity.interessadoNome}
            </Typography>
            <Chip
              size="small"
              label={stage.label}
              sx={{ bgcolor: stage.softColor, color: stage.color, fontWeight: 800 }}
            />
          </Stack>
          <Typography sx={{ color: 'primary.main', fontSize: { xs: 24, md: 28 }, fontWeight: 900 }}>
            {property?.finalidade === 'ALUGUEL'
              ? formatMonthlyCurrency(opportunity.valorProposto)
              : formatCurrency(opportunity.valorProposto)}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              lg: 'minmax(0, 58fr) minmax(320px, 42fr)',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Stack spacing={2} minWidth={0}>
            <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
              <Typography component="h2" sx={{ mb: 2.2, fontSize: 16, fontWeight: 800 }}>
                Informações de contato e interesse
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2.2,
                }}
              >
                <DetailItem label="E-mail" value={opportunity.interessadoEmail} />
                <DetailItem
                  label="Telefone"
                  value={opportunity.interessadoTelefone ?? 'Não informado'}
                />
                <DetailItem
                  label="Valor proposto"
                  value={formatCurrency(opportunity.valorProposto)}
                />
                <DetailItem
                  label="Prazo de contrato"
                  value={
                    opportunity.prazoContratoMeses
                      ? `${opportunity.prazoContratoMeses} meses`
                      : 'Não informado'
                  }
                />
                <DetailItem
                  label="Início pretendido"
                  value={
                    opportunity.inicioPretendido
                      ? formatDate(opportunity.inicioPretendido)
                      : 'Não informado'
                  }
                />
                <DetailItem
                  label="Garantia"
                  value={
                    opportunity.garantiaContratual === 'NENHUMA'
                      ? 'Não informada'
                      : opportunity.garantiaContratual.replace('_', ' ')
                  }
                />
              </Box>
              {(opportunity.condicoesEspeciais.length > 0 || opportunity.observacoes) && (
                <>
                  <Divider sx={{ my: 2.2 }} />
                  {opportunity.condicoesEspeciais.length > 0 && (
                    <Box sx={{ mb: opportunity.observacoes ? 2 : 0 }}>
                      <Typography sx={labelSx}>Condições especiais</Typography>
                      <Stack direction="row" gap={0.7} flexWrap="wrap" sx={{ mt: 0.8 }}>
                        {opportunity.condicoesEspeciais.map((condition) => (
                          <Chip key={condition} label={condition} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  {opportunity.observacoes && (
                    <DetailItem label="Observações" value={opportunity.observacoes} />
                  )}
                </>
              )}
            </Paper>

            <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
              <Typography component="h2" sx={{ mb: 1.8, fontSize: 16, fontWeight: 800 }}>
                Imóvel associado
              </Typography>
              {propertyQuery.isLoading ? (
                <Stack direction="row" spacing={2}>
                  <Skeleton variant="rounded" width={108} height={82} />
                  <Box flex={1}>
                    <Skeleton width="60%" />
                    <Skeleton width="42%" />
                    <Skeleton width="30%" />
                  </Box>
                </Stack>
              ) : propertyQuery.isError || !property ? (
                <Alert
                  severity="warning"
                  action={<Button onClick={() => propertyQuery.refetch()}>Tentar novamente</Button>}
                >
                  Não foi possível carregar o imóvel associado. Referência: {opportunity.imovelId}
                </Alert>
              ) : (
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.8}
                  sx={{ p: 1.2, bgcolor: surface.app, borderRadius: `${radius.sm}px` }}
                >
                  {property.capaUrl ? (
                    <Box
                      component="img"
                      src={property.capaUrl}
                      alt={property.titulo}
                      sx={{
                        width: { xs: '100%', sm: 112 },
                        height: { xs: 150, sm: 82 },
                        objectFit: 'cover',
                        borderRadius: `${radius.sm}px`,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: { xs: '100%', sm: 112 },
                        height: { xs: 110, sm: 82 },
                        flexShrink: 0,
                        borderRadius: `${radius.sm}px`,
                        bgcolor: brand.neutral[100],
                        color: 'text.disabled',
                      }}
                    >
                      <HomeWorkOutlinedIcon />
                    </Box>
                  )}
                  <Stack minWidth={0} flex={1} justifyContent="center">
                    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                      {property.titulo}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.2, fontSize: 11.5 }}>
                      {[
                        property.tipo,
                        property.areaM2 ? `${property.areaM2} m²` : null,
                        propertyLocation,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 13, fontWeight: 800 }}>
                      {formatCurrency(property.valor)}
                      {property.finalidade === 'ALUGUEL' ? '/mês' : ''}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </Paper>
          </Stack>

          <Stack spacing={2} minWidth={0}>
            <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
              <Typography component="h2" sx={{ mb: 2, fontSize: 16, fontWeight: 800 }}>
                Atividades recentes
              </Typography>
              <Stack>
                {activities.map((activity, index) => (
                  <Stack key={activity.key} direction="row" spacing={1.4}>
                    <Stack alignItems="center">
                      <Avatar
                        sx={{
                          width: 31,
                          height: 31,
                          bgcolor: surface.app,
                          color: brand.neutral[500],
                        }}
                      >
                        <HistoryRoundedIcon sx={{ fontSize: iconSize.sm }} />
                      </Avatar>
                      {index < activities.length - 1 && (
                        <Box sx={{ width: 1, minHeight: 48, flex: 1, bgcolor: 'divider' }} />
                      )}
                    </Stack>
                    <Box sx={{ minWidth: 0, flex: 1, pb: index < activities.length - 1 ? 2 : 0 }}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography sx={{ fontSize: 13, fontWeight: 800 }}>
                          {activity.title}
                        </Typography>
                        <Typography
                          component="time"
                          dateTime={activity.occurredAt}
                          color="text.disabled"
                          sx={{ flexShrink: 0, fontSize: 10 }}
                        >
                          {formatRelativeDate(activity.occurredAt)}
                        </Typography>
                      </Stack>
                      <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: 11.5 }}>
                        {activity.detail}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Paper component="section" elevation={0} sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
              <Typography component="h2" sx={{ mb: 1.4, fontSize: 16, fontWeight: 800 }}>
                Próximas ações
              </Typography>
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ minHeight: 120, p: 2, borderRadius: `${radius.sm}px`, bgcolor: surface.app }}
              >
                <CalendarMonthOutlinedIcon sx={{ color: 'text.disabled' }} />
                <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                  Nenhuma próxima ação cadastrada
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Paper
        component="footer"
        elevation={0}
        sx={{
          position: 'sticky',
          bottom: 0,
          zIndex: 5,
          mx: { xs: 1, sm: 2.5, lg: 3.5 },
          mt: 1,
          p: { xs: 1.4, sm: 1.7 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${radius.md}px`,
          boxShadow: shadows.popover,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          gap={1}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <Button
              variant="contained"
              startIcon={<SellOutlinedIcon />}
              endIcon={<ExpandMoreRoundedIcon />}
              disabled={isMutating}
              onClick={(event: MouseEvent<HTMLButtonElement>) =>
                setStageMenuAnchor(event.currentTarget)
              }
            >
              Mover de etapa
            </Button>
            {opportunity.status !== 'RECUSADA' && (
              <Button
                color="error"
                variant="outlined"
                disabled={isMutating}
                onClick={() => setNextStatus('RECUSADA')}
              >
                Descartar lead
              </Button>
            )}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1}>
            <Button startIcon={<EditOutlinedIcon />} disabled={isMutating} onClick={openEditDialog}>
              Editar dados
            </Button>
            <Button
              color="inherit"
              startIcon={<ArchiveOutlinedIcon />}
              disabled={isMutating || Boolean(opportunity.arquivadaEm)}
              onClick={() => setArchiveOpen(true)}
            >
              {opportunity.arquivadaEm ? 'Arquivada' : 'Arquivar'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Menu
        anchorEl={stageMenuAnchor}
        open={Boolean(stageMenuAnchor)}
        onClose={() => setStageMenuAnchor(null)}
      >
        {opportunityStages
          .filter(({ status }) => status !== opportunity.status)
          .map((option) => (
            <MenuItem key={option.status} onClick={() => requestStatusChange(option.status)}>
              <Box
                sx={{ width: 8, height: 8, mr: 1.2, borderRadius: '50%', bgcolor: option.color }}
              />
              {option.label}
            </MenuItem>
          ))}
      </Menu>

      <Dialog
        open={Boolean(nextStatus)}
        onClose={() => !updateOpportunity.isPending && setNextStatus(null)}
      >
        <DialogTitle sx={{ letterSpacing: 0 }}>Confirmar mudança de etapa</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {nextStatus
              ? `Mover ${opportunity.interessadoNome} de ${stage.label} para ${opportunityStageByStatus[nextStatus].label}?`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={updateOpportunity.isPending} onClick={() => setNextStatus(null)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={updateOpportunity.isPending}
            onClick={confirmStatusChange}
          >
            {updateOpportunity.isPending ? <CircularProgress size={20} /> : 'Confirmar mudança'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editOpen}
        onClose={() => !updateOpportunity.isPending && setEditOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ letterSpacing: 0 }}>Editar oportunidade</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
                pt: 1,
              }}
            >
              <TextField
                label="Nome"
                required
                value={editForm.interessadoNome}
                onChange={(event) =>
                  setEditForm({ ...editForm, interessadoNome: event.target.value })
                }
              />
              <TextField
                label="E-mail"
                type="email"
                required
                value={editForm.interessadoEmail}
                onChange={(event) =>
                  setEditForm({ ...editForm, interessadoEmail: event.target.value })
                }
              />
              <TextField
                label="Telefone"
                value={editForm.interessadoTelefone}
                onChange={(event) =>
                  setEditForm({ ...editForm, interessadoTelefone: event.target.value })
                }
              />
              <TextField
                label="Valor proposto"
                type="number"
                required
                inputProps={{ min: 0, step: 100 }}
                value={editForm.valorProposto}
                onChange={(event) =>
                  setEditForm({ ...editForm, valorProposto: event.target.value })
                }
              />
              <TextField
                label="Prazo do contrato (meses)"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={editForm.prazoContratoMeses}
                onChange={(event) =>
                  setEditForm({ ...editForm, prazoContratoMeses: event.target.value })
                }
              />
              <TextField
                label="Início pretendido"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={editForm.inicioPretendido}
                onChange={(event) =>
                  setEditForm({ ...editForm, inicioPretendido: event.target.value })
                }
              />
              <FormControl>
                <InputLabel id="guarantee-label">Garantia</InputLabel>
                <Select
                  labelId="guarantee-label"
                  label="Garantia"
                  value={editForm.garantiaContratual}
                  onChange={(event) =>
                    setEditForm({
                      ...editForm,
                      garantiaContratual: event.target.value as Opportunity['garantiaContratual'],
                    })
                  }
                >
                  <MenuItem value="NENHUMA">Não informada</MenuItem>
                  <MenuItem value="FIADOR">Fiador</MenuItem>
                  <MenuItem value="CAUCAO">Caução</MenuItem>
                  <MenuItem value="SEGURO_FIANCA">Seguro-fiança</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Condições especiais"
                helperText="Separe as condições por vírgulas."
                value={editForm.condicoesEspeciais}
                onChange={(event) =>
                  setEditForm({ ...editForm, condicoesEspeciais: event.target.value })
                }
              />
              <TextField
                label="Observações"
                multiline
                minRows={3}
                value={editForm.observacoes}
                onChange={(event) => setEditForm({ ...editForm, observacoes: event.target.value })}
                sx={{ gridColumn: { sm: '1 / -1' } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={updateOpportunity.isPending} onClick={() => setEditOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={updateOpportunity.isPending}
            onClick={saveOpportunity}
          >
            {updateOpportunity.isPending ? <CircularProgress size={20} /> : 'Salvar alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={archiveOpen}
        onClose={() => !archiveOpportunity.isPending && setArchiveOpen(false)}
      >
        <DialogTitle sx={{ letterSpacing: 0 }}>Arquivar oportunidade?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            A oportunidade deixará de aparecer no pipeline ativo, mas continuará armazenada no CRM.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={archiveOpportunity.isPending} onClick={() => setArchiveOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={archiveOpportunity.isPending}
            onClick={confirmArchive}
          >
            {archiveOpportunity.isPending ? (
              <CircularProgress size={20} />
            ) : (
              'Arquivar oportunidade'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
