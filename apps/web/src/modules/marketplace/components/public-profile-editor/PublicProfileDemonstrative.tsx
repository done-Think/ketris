import { Box, Divider, Stack, Typography } from '@mui/material'

import { alpha, radius, shadows, surface } from '@shared/theme/tokens'

import type { PublicProfileDemonstrativeProps } from '../../types/public-profile-editor'
import { getSectionOption, sectionIcons } from './public-profile-editor-shared'
import { PublicProfileMiniSection } from './PublicProfilePreviewSections'

export function PublicProfileDemonstrative({
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
  visibleSectionOrder,
}: PublicProfileDemonstrativeProps) {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1.4 }}>
        Demonstrativo
      </Typography>
      <Box
        sx={{
          bgcolor: profileDraft.backgroundColor,
          border: '1px solid',
          borderColor: alpha.graphite[8],
          borderRadius: `${radius.sm}px`,
          boxShadow: shadows.propertyCard,
          overflow: 'hidden',
          p: { xs: 1.4, md: 1.8 },
        }}
      >
        {visibleSectionOrder.length > 0 ? (
          <Stack spacing={1.6}>
            {visibleSectionOrder.map((sectionKey) => {
              const option = getSectionOption(sectionKey)
              const Icon = sectionIcons[sectionKey]
              const sectionPosition = profileDraft.sectionOrder.indexOf(sectionKey)
              const selected = draggedPosition === sectionPosition
              const pressed = pressedPosition === sectionPosition

              return (
                <Box
                  key={sectionKey}
                  data-profile-preview-position={sectionPosition}
                  draggable={!isTouchLikeDevice}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(sectionPosition))
                    setDraggedPosition(sectionPosition)
                  }}
                  onDragEnd={() => setDraggedPosition(null)}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(event) => {
                    const draggedPositionData = event.dataTransfer.getData('text/plain')
                    const sourcePosition =
                      draggedPositionData === '' ? draggedPosition : Number(draggedPositionData)

                    if (sourcePosition !== null && Number.isInteger(sourcePosition)) {
                      swapSectionPositions(sourcePosition, sectionPosition)
                    }
                    setDraggedPosition(null)
                  }}
                  sx={{
                    borderRadius: `${radius.sm}px`,
                    boxShadow: pressed ? shadows.crmCardHover : 'none',
                    opacity: selected ? 0.62 : 1,
                    outline: selected || pressed ? `2px solid ${profileDraft.primaryColor}` : 0,
                    outlineOffset: 4,
                    overflow: 'visible',
                    position: 'relative',
                    transform: pressed ? 'scale(0.992)' : 'none',
                    transition:
                      'box-shadow 160ms ease, opacity 160ms ease, outline-color 160ms ease, transform 160ms ease',
                    '@keyframes profileLongPressProgress': {
                      from: { transform: 'scaleX(0)' },
                      to: { transform: 'scaleX(1)' },
                    },
                    '&::after': pressed
                      ? {
                          animation: 'profileLongPressProgress 2s linear forwards',
                          bgcolor: profileDraft.primaryColor,
                          bottom: 0,
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
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.9 }}>
                    <Stack
                      direction="row"
                      spacing={0.7}
                      alignItems="center"
                      sx={{
                        border: '1px solid',
                        borderColor: alpha.graphite[8],
                        borderRadius: radius.full,
                        bgcolor: surface.paper,
                        color: surface.darkText,
                        cursor: 'grab',
                        px: 1,
                        py: 0.45,
                        flex: '0 0 auto',
                        position: 'relative',
                        touchAction: isTouchLikeDevice ? 'none' : 'auto',
                        userSelect: 'none',
                        zIndex: 3,
                        '@keyframes profilePositionPillPulse': {
                          '0%, 100%': {
                            boxShadow: `0 0 0 0 ${alpha.magenta[14]}`,
                            transform: 'scale(1)',
                          },
                          '50%': {
                            boxShadow: `0 0 0 7px ${alpha.magenta[8]}`,
                            transform: 'scale(1.018)',
                          },
                        },
                        ...(isTouchLikeDevice
                          ? { animation: 'profilePositionPillPulse 1.8s ease-in-out infinite' }
                          : {}),
                      }}
                      onPointerDown={startLongPress(sectionPosition)}
                      onPointerMove={moveLongPress}
                      onPointerUp={finishLongPress}
                      onPointerCancel={resetLongPress}
                    >
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: radius.full,
                          bgcolor: profileDraft.primaryColor,
                          color: surface.lightText,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <Icon sx={{ fontSize: 14 }} />
                      </Box>
                      <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
                        {selected
                          ? 'Solte para mover'
                          : pressed
                            ? 'Preparando...'
                            : `Posição ${sectionPosition + 1}: ${option?.label}`}
                      </Typography>
                    </Stack>
                    <Divider sx={{ flex: 1, borderColor: alpha.graphite[10] }} />
                  </Stack>
                  <PublicProfileMiniSection profileDraft={profileDraft} sectionKey={sectionKey} />
                </Box>
              )
            })}
          </Stack>
        ) : (
          <Box
            sx={{
              border: '1px dashed',
              borderColor: alpha.graphite[18],
              borderRadius: `${radius.sm}px`,
              bgcolor: surface.paper,
              p: 2,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ color: 'text.secondary', fontWeight: 800 }}>
              Nenhuma seção selecionada para exibição.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
