import { Dialog, DialogContent, DialogTitle, IconButton, Stack } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

import { iconSize, surface } from '@shared/theme/tokens'

import type { AgencyPublicProfilePreviewDialogProps } from '../../types/agency-public-profile-editor'
import { AgencyPublicProfileMiniSection } from './AgencyPublicProfilePreviewSections'

export function AgencyPublicProfilePreviewDialog({
  isOpen,
  onClose,
  profileDraft,
  visibleSectionOrder,
}: AgencyPublicProfilePreviewDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pr: 6 }}>
        Visualização do perfil da imobiliária
        <IconButton
          aria-label="Fechar visualização"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 10 }}
        >
          <CloseRoundedIcon sx={{ fontSize: iconSize.xl }} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: surface.app }}>
        <Stack spacing={1.8}>
          {visibleSectionOrder.map((sectionKey) => (
            <AgencyPublicProfileMiniSection
              key={sectionKey}
              profileDraft={profileDraft}
              sectionKey={sectionKey}
            />
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
