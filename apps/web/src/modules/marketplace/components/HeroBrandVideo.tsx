import { Box } from '@mui/material'

import { gradients } from '@shared/theme/tokens'

export function HeroBrandVideo() {
  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 0,
        display: { xs: 'none', lg: 'flex' },
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { lg: 285, xl: 430 },
        height: { lg: 285, xl: 430 },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: { lg: 975, xl: 1521 },
          maxWidth: 'none',
          height: { lg: 371, xl: 559 },
          transform: 'translate(-50%, -50%)',
          overflow: 'hidden',
          pointerEvents: 'none',
          WebkitMaskImage: gradients.videoEdgeMask,
          maskImage: gradients.videoEdgeMask,
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: { xs: 760, lg: 700, xl: 1168 },
            height: { lg: 386, xl: 644 },
            maxWidth: '140vw',
            transform: {
              lg: 'translate(-50%, calc(-43% - 70px))',
              xl: 'translate(-50%, calc(-42% - 78px))',
            },
            '@media (min-width: 1200px) and (max-height: 950px)': {
              transform: 'translate(-50%, calc(-38% - 40px))',
            },
            WebkitMaskImage: gradients.videoCenterMask,
            maskImage: gradients.videoCenterMask,
          }}
        >
          <Box
            component="video"
            src="/videologo-chroma.webm"
            autoPlay
            muted
            playsInline
            aria-hidden="true"
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'blur(46px)',
              opacity: 0.72,
              transform: 'scale(1.12)',
              transformOrigin: 'center',
            }}
          />
          <Box
            component="video"
            src="/videologo-chroma.webm"
            autoPlay
            muted
            playsInline
            aria-label="Animação da marca Ketris"
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              opacity: 1,
              transform: 'scale(1)',
              transformOrigin: 'center',
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
