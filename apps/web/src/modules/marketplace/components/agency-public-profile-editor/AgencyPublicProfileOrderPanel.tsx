import { Controller } from 'react-hook-form'
import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded'
import { useTranslations } from 'next-intl'

import { alpha, iconSize, motion, radius, shadows } from '@shared/theme/tokens'

import { agencyPublicProfileSectionOptions } from '../../data/agency-public-profile-editor'
import type {
  AgencyPublicProfileOrderPanelProps,
  AgencyPublicProfileSectionSlotKey,
} from '../../types/agency-public-profile-editor'
import { agencyEditorPanelSx, getAgencySectionOption } from './agency-public-profile-editor-shared'

export function AgencyPublicProfileOrderPanel({
  control,
  draggedPosition,
  finishLongPress,
  isTouchLikeDevice,
  moveLongPress,
  pressedPosition,
  profileDraft,
  resetLongPress,
  setDraggedPosition,
  startLongPress,
  swapSectionPositions,
  updateSectionOrder,
}: AgencyPublicProfileOrderPanelProps) {
  const t = useTranslations('marketplace.agencyProfileEditor')

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1.4 }}>
        {t('profileOrder')}
      </Typography>
      <Box sx={agencyEditorPanelSx}>
        <Stack spacing={1.3}>
          {profileDraft.sectionOrder.map((sectionKey, index) => {
            const option = getAgencySectionOption(sectionKey)
            const selected = draggedPosition === index
            const pressed = pressedPosition === index

            return (
              <Box
                key={`${sectionKey}-${index}`}
                data-profile-preview-position={index}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                }}
                onDrop={(event) => {
                  const draggedPositionData = event.dataTransfer.getData('text/plain')
                  const sourcePosition =
                    draggedPositionData === '' ? draggedPosition : Number(draggedPositionData)

                  if (sourcePosition !== null && Number.isInteger(sourcePosition)) {
                    swapSectionPositions(sourcePosition, index)
                  }
                  setDraggedPosition(null)
                }}
                sx={{
                  borderRadius: `${radius.sm}px`,
                  boxShadow: pressed ? shadows.crmCardHover : 'none',
                  opacity: selected ? 0.62 : 1,
                  overflow: 'visible',
                  position: 'relative',
                  transition: motion.transition.sortableItem,
                  transform: pressed ? 'scale(0.992)' : 'none',
                  '@keyframes agencyOrderLongPressProgress': {
                    from: { transform: 'scaleX(0)' },
                    to: { transform: 'scaleX(1)' },
                  },
                  '&::after': pressed
                    ? {
                        animation: 'agencyOrderLongPressProgress 2s linear forwards',
                        bgcolor: profileDraft.primaryColor,
                        bottom: -3,
                        content: '""',
                        height: 4,
                        left: 0,
                        position: 'absolute',
                        transformOrigin: 'left',
                        width: '100%',
                        zIndex: 2,
                      }
                    : undefined,
                }}
              >
                <Controller
                  control={control}
                  name="sectionOrder"
                  render={({ fieldState }) => (
                    <FormControl fullWidth error={Boolean(fieldState.error)}>
                      <InputLabel id={`agency-section-order-${index}`}>
                        {t('position', { position: index + 1 })}
                      </InputLabel>
                      <Select
                        labelId={`agency-section-order-${index}`}
                        label={t('position', { position: index + 1 })}
                        value={sectionKey}
                        onChange={(event) =>
                          updateSectionOrder(
                            index,
                            event.target.value as AgencyPublicProfileSectionSlotKey,
                          )
                        }
                        startAdornment={
                          <Box
                            draggable={!isTouchLikeDevice}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move'
                              event.dataTransfer.setData('text/plain', String(index))
                              setDraggedPosition(index)
                            }}
                            onDragEnd={() => setDraggedPosition(null)}
                            onPointerDown={startLongPress(index)}
                            onPointerMove={moveLongPress}
                            onPointerUp={finishLongPress}
                            onPointerCancel={resetLongPress}
                            sx={{
                              cursor: 'grab',
                              display: 'grid',
                              placeItems: 'center',
                              mr: 0.8,
                              position: 'relative',
                              touchAction: isTouchLikeDevice ? 'none' : 'auto',
                              userSelect: 'none',
                              zIndex: 3,
                              '@keyframes agencyOrderDragPulse': {
                                '0%, 100%': {
                                  filter: `drop-shadow(0 0 0 ${alpha.magenta[8]})`,
                                  transform: 'scale(1)',
                                },
                                '50%': {
                                  filter: `drop-shadow(0 0 5px ${alpha.magenta[36]})`,
                                  transform: 'scale(1.18)',
                                },
                              },
                              ...(isTouchLikeDevice
                                ? { animation: 'agencyOrderDragPulse 1.8s ease-in-out infinite' }
                                : {}),
                            }}
                          >
                            <DragIndicatorRoundedIcon
                              sx={{ color: 'text.secondary', fontSize: iconSize.md }}
                            />
                          </Box>
                        }
                      >
                        {agencyPublicProfileSectionOptions.map((section) => (
                          <MenuItem key={section.key} value={section.key}>
                            {t(`sections.${section.key}.label`)}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {fieldState.error?.message ??
                          (option ? t(`sections.${option.key}.description`) : undefined)}
                      </FormHelperText>
                    </FormControl>
                  )}
                />
              </Box>
            )
          })}
        </Stack>
      </Box>
    </Box>
  )
}
