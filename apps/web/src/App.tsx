import ApartmentIcon from '@mui/icons-material/Apartment';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessIcon from '@mui/icons-material/Business';
import HandshakeIcon from '@mui/icons-material/Handshake';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PaymentsIcon from '@mui/icons-material/Payments';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SearchIcon from '@mui/icons-material/Search';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  CssBaseline,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
  createTheme,
} from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#155EEF' },
    secondary: { main: '#047857' },
    background: { default: '#F7F8FA', paper: '#FFFFFF' },
    text: { primary: '#111827', secondary: '#526071' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: 48, lineHeight: 1.05, fontWeight: 800, letterSpacing: 0 },
    h2: { fontSize: 30, lineHeight: 1.2, fontWeight: 750, letterSpacing: 0 },
    h3: { fontSize: 20, lineHeight: 1.3, fontWeight: 700, letterSpacing: 0 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
});

const modules = [
  { title: 'Marketplace', text: 'Busca, mapa, favoritos e leads integrados.', icon: <SearchIcon /> },
  { title: 'CRM', text: 'Pipeline de lead ate contrato com historico completo.', icon: <PeopleAltIcon /> },
  { title: 'Contratos', text: 'Geracao, versoes, assinatura digital e auditoria.', icon: <RequestQuoteIcon /> },
  { title: 'Financeiro', text: 'PIX, boleto, split, comissoes e conciliacao.', icon: <PaymentsIcon /> },
  { title: 'Manutencao', text: 'Chamados, fotos, orcamentos e acompanhamento.', icon: <HomeWorkIcon /> },
  { title: 'IA', text: 'Descricoes, precificacao, documentos e atendimento.', icon: <AutoAwesomeIcon /> },
];

const actors = [
  'Proprietarios',
  'Corretores',
  'Imobiliarias',
  'Construtoras',
  'Locatarios',
  'Parceiros financeiros',
];

const pipeline = ['Cadastro', 'Publicacao', 'Leads', 'Visitas', 'Proposta', 'Contrato', 'Assinatura', 'Pagamento'];

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppBar position="sticky" elevation={0} color="inherit" sx={{ borderBottom: '1px solid #E5E7EB' }}>
          <Toolbar sx={{ gap: 2 }}>
            <ApartmentIcon color="primary" />
            <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
              Ketris
            </Typography>
            <Button variant="contained" startIcon={<BusinessIcon />}>Entrar no painel</Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Chip label="SaaS multi-tenant imobiliario" color="secondary" sx={{ width: 'fit-content' }} />
                <Typography variant="h1">
                  A infraestrutura digital do mercado imobiliario.
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 680 }}>
                  Uma plataforma para publicar imoveis, operar CRM, gerar contratos, controlar pagamentos,
                  gerenciar manutencoes e conectar todos os participantes do ciclo imobiliario.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button size="large" variant="contained" startIcon={<HandshakeIcon />}>Criar tenant</Button>
                  <Button size="large" variant="outlined" startIcon={<SearchIcon />}>Ver marketplace</Button>
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB' }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">Operacao hoje</Typography>
                    <Typography variant="h2">248 imoveis ativos</Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    {pipeline.map((item, index) => (
                      <Box key={item}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={700}>{item}</Typography>
                          <Typography color="text.secondary">{82 - index * 7}%</Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={82 - index * 7}
                          sx={{ mt: 0.75, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 6 }} />

          <Grid container spacing={2}>
            {actors.map((actor) => (
              <Grid item xs={6} md={2} key={actor}>
                <Paper elevation={0} sx={{ p: 2, minHeight: 88, border: '1px solid #E5E7EB' }}>
                  <Typography fontWeight={800}>{actor}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5} sx={{ mt: 3 }}>
            {modules.map((module) => (
              <Grid item xs={12} md={4} key={module.title}>
                <Paper elevation={0} sx={{ p: 2.5, height: '100%', border: '1px solid #E5E7EB' }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ color: 'primary.main' }}>{module.icon}</Box>
                    <Typography variant="h3">{module.title}</Typography>
                    <Typography color="text.secondary">{module.text}</Typography>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
