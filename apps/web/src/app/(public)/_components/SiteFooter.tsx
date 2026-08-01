import {
  Box,
  Container,
  Divider,
  IconButton,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined'
import InstagramIcon from '@mui/icons-material/Instagram'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import Link from 'next/link'

import { footerColumns } from './_homeData'

export function SiteFooter() {
  return (
    <Box component="footer" sx={{ bgcolor: '#212631', color: '#FFFFFF' }}>
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'minmax(260px, 1fr) minmax(520px, 0.95fr)',
            },
            gap: { xs: 1.25, md: 7 },
            py: { xs: 2.4, md: 7 },
          }}
        >
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box
              component={Link}
              href="/"
              aria-label="Ketris"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                width: { xs: 92, md: 102 },
                mb: { xs: 0.6, md: 2 },
                textDecoration: 'none',
              }}
            >
              <Box
                component="img"
                src="/ketris-logo-footer.png"
                alt="Ketris"
                sx={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                }}
              />
            </Box>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.62)',
                fontSize: { xs: 12, md: 13 },
                maxWidth: { xs: 310, md: 360 },
                mx: { xs: 'auto', md: 0 },
              }}
            >
              Tecnologia e simplificação de ponta a ponta no mercado imobiliário corporativo e
              residencial.
            </Typography>
            <Stack
              direction="row"
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              spacing={1.2}
              sx={{ mt: { xs: 0.8, md: 3 } }}
            >
              {[
                ['Instagram', InstagramIcon],
                ['Facebook', FacebookOutlinedIcon],
                ['LinkedIn', LinkedInIcon],
              ].map(([label, Icon]) => (
                <IconButton
                  key={label as string}
                  aria-label={label as string}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.78)',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: '#FFFFFF',
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 17 }} />
                </IconButton>
              ))}
            </Stack>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(120px, 1fr))' },
              gap: { xs: 1.25, md: 6 },
              justifySelf: { md: 'end' },
              width: '100%',
              maxWidth: { md: 620 },
            }}
          >
            {footerColumns.map((column) => (
              <Box key={column.title} sx={{ textAlign: { xs: 'center', md: 'right' } }}>
                <Typography sx={{ fontSize: 12, fontWeight: 900, mb: { xs: 0.5, md: 2 } }}>
                  {column.title}
                </Typography>
                <Stack
                  direction={{ xs: 'row', md: 'column' }}
                  spacing={{ xs: 0.8, md: 1.25 }}
                  useFlexGap
                  flexWrap="wrap"
                  alignItems={{ md: 'flex-end' }}
                  justifyContent={{ xs: 'center', md: 'flex-start' }}
                >
                  {column.links.map((item) => (
                    <MuiLink
                      key={item}
                      component={Link}
                      href="/imoveis"
                      underline="none"
                      sx={{
                        color: 'rgba(255,255,255,0.56)',
                        fontSize: { xs: 11, md: 12 },
                        whiteSpace: 'nowrap',
                        '&:hover': { color: '#FFFFFF' },
                      }}
                    >
                      {item}
                    </MuiLink>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'center', sm: 'center' }}
          justifyContent="space-between"
          spacing={{ xs: 1.4, sm: 2 }}
          sx={{ py: { xs: 2, md: 3 }, textAlign: { xs: 'center', sm: 'left' } }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            © 2026 Ketris Tecnologias Ltda. Todos os direitos reservados.
          </Typography>
          <Stack direction="row" spacing={3}>
            {['Termos de Uso', 'Política de Privacidade'].map((item) => (
              <MuiLink
                key={item}
                component={Link}
                href="/"
                underline="none"
                sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              >
                {item}
              </MuiLink>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
