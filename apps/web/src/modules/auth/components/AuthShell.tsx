import { getAuthShellStyles } from '../styles/auth-shell.styles'
import { Box } from '@mui/material'

import ketrisLogoTransparent from '@shared/assets/ketris-logo-transparent.png'
import { AppLogo } from '@shared/components/ui'

import type { AuthShellProps } from '../types/auth-shell'
import { AuthBrandPanel } from './AuthBrandPanel'

export function AuthShell({
  brandDescription,
  children,
  contentMaxWidth = 560,
  footer,
  mobileVariant = 'plain',
}: AuthShellProps) {
  const styles = getAuthShellStyles(mobileVariant, contentMaxWidth)

  return (
    <Box sx={styles.box1}>
      <AuthBrandPanel description={brandDescription} mobileBackdrop={mobileVariant !== 'plain'} />

      {mobileVariant === 'backdrop' && (
        <Box sx={styles.box2}>
          <AppLogo src={ketrisLogoTransparent} variant="transparent" width={76} />
        </Box>
      )}

      <Box component="main" sx={styles.box3}>
        <Box sx={styles.box4}>
          {mobileVariant === 'card' && (
            <Box sx={styles.box5}>
              <AppLogo src={ketrisLogoTransparent} variant="transparent" width={88} />
            </Box>
          )}

          {children}

          {footer && <Box sx={styles.box6}>{footer}</Box>}
        </Box>
      </Box>
    </Box>
  )
}
