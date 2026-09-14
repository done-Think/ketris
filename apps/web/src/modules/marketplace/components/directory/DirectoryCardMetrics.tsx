import { Box, Stack, Tooltip, Typography } from '@mui/material'

import { iconSize, radius, surface } from '@shared/theme/tokens'

import type { DirectoryCardMetricsProps } from '../../types/card'

export function DirectoryCardMetrics({
  gridTemplateColumns,
  labelFontWeight,
  metrics,
  valueFontWeight,
}: DirectoryCardMetricsProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns,
        gap: 1,
        mt: 2,
      }}
    >
      {metrics.map(({ icon: Icon, label, showTooltip, value }) => (
        <Tooltip
          key={label}
          title={showTooltip ? value : ''}
          placement="bottom-start"
          disableHoverListener={!showTooltip}
        >
          <Box
            sx={{
              minWidth: 0,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: `${radius.sm}px`,
              px: 1,
              py: 1,
              bgcolor: surface.app,
            }}
          >
            {Icon ? (
              <Stack direction="row" alignItems="center" spacing={0.45}>
                <Icon sx={{ color: 'text.secondary', fontSize: iconSize.xs }} />
                <Typography
                  sx={{ color: 'text.secondary', fontSize: 10, fontWeight: labelFontWeight }}
                >
                  {label}
                </Typography>
              </Stack>
            ) : (
              <Typography
                sx={{ color: 'text.secondary', fontSize: 10, fontWeight: labelFontWeight }}
              >
                {label}
              </Typography>
            )}
            <Typography
              noWrap
              sx={{
                fontSize: 12,
                fontWeight: valueFontWeight,
                lineHeight: 1.25,
                mt: 0.25,
              }}
            >
              {value}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Box>
  )
}
