import { Box, Stack, Tooltip, Typography } from '@mui/material'

import type { DirectoryCardMetricsProps } from '../../types/card'
import {
  styles,
  getBoxStyles,
  getTypographyStyles,
  getTypographyStyles2,
  getTypographyStyles3,
} from '../../styles/directory-card-metrics.styles'

export function DirectoryCardMetrics({
  gridTemplateColumns,
  labelFontWeight,
  metrics,
  valueFontWeight,
}: DirectoryCardMetricsProps) {
  return (
    <Box sx={getBoxStyles({ gridTemplateColumns })}>
      {metrics.map(({ icon: Icon, label, showTooltip, value }) => (
        <Tooltip
          key={label}
          title={showTooltip ? value : ''}
          placement="bottom-start"
          disableHoverListener={!showTooltip}
        >
          <Box sx={styles.box}>
            {Icon ? (
              <Stack direction="row" alignItems="center" spacing={0.45}>
                <Icon sx={styles.icon} />
                <Typography sx={getTypographyStyles({ labelFontWeight })}>{label}</Typography>
              </Stack>
            ) : (
              <Typography sx={getTypographyStyles2({ labelFontWeight })}>{label}</Typography>
            )}
            <Typography noWrap sx={getTypographyStyles3({ valueFontWeight })}>
              {value}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}
