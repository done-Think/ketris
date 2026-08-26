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

import { alpha, iconSize, motion, radius, shadows } from '@shared/theme/tokens'

import { publicProfileSectionOptions } from '../../data/public-profile-editor'
import type {
  PublicProfileOrderPanelProps,
  PublicProfileSectionSlotKey,
} from '../../types/public-profile-editor'
import { editorPanelSx, getSectionOption } from './public-profile-editor-shared'

export function PublicProfileOrderPanel({
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
}: PublicProfileOrderPanelProps) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1.4 }}>
        Ordem do perfil
      </Typography>
      <Box sx={editorPanelSx}>
        <Stack spacing={1.3}>
          {profileDraft.sectionOrder.map((sectionKey, index) => {
            const option = getSectionOption(sectionKey)
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
                  '@keyframes profileOrderLongPressProgress': {
                    from: { transform: 'scaleX(0)' },
                    to: { transform: 'scaleX(1)' },
                  },
                  '&::after': pressed
                    ? {
                        animation: 'profileOrderLongPressProgress 2s linear forwards',
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
                      <InputLabel id={`section-order-${index}`}>Posição {index + 1}</InputLabel>
                      <Select
                        labelId={`section-order-${index}`}
                        label={`Posição ${index + 1}`}
                        value={sectionKey}
                        onChange={(event) =>
                          updateSectionOrder(
                            index,
                            event.target.value as PublicProfileSectionSlotKey,
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
                              '@keyframes profileOrderDragPulse': {
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
                                ? { animation: 'profileOrderDragPulse 1.8s ease-in-out infinite' }
                                : {}),
                            }}
                          >
                            <DragIndicatorRoundedIcon
                              sx={{ color: 'text.secondary', fontSize: iconSize.md }}
                            />
                          </Box>
                        }
                      >
                        {publicProfileSectionOptions.map((section) => (
                          <MenuItem key={section.key} value={section.key}>
                            {section.label}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {fieldState.error?.message ?? option?.description}
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
