import { type Dispatch, type Ref, type SetStateAction } from 'react'
import {
  Box,
  Button,
  Container,
  IconButton,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import Link from 'next/link'

import {
  formatCurrency,
  priceLimit,
  searchFilterOrder,
  searchOptions,
  textSearchFilterOrder,
  type SearchFilterKey,
  type TextSearchFilterKey,
} from './_homeData'

type HeroSectionProps = {
  selectedSearch: Record<SearchFilterKey, string>
  priceRange: [number, number]
  priceRangeLabel: string
  activeSearchMenu: SearchFilterKey | null
  searchDraft: Record<TextSearchFilterKey, string>
  searchHref: string
  desktopSearchRef: Ref<HTMLDivElement>
  mobileSearchRef: Ref<HTMLDivElement>
  openSearchMenu: (key: SearchFilterKey) => void
  closeSearchMenu: () => void
  selectSearchValue: (key: SearchFilterKey, value: string) => void
  updatePriceRange: (nextRange: [number, number]) => void
  filterSearchOptions: (key: TextSearchFilterKey) => readonly string[]
  setSearchDraft: Dispatch<SetStateAction<Record<TextSearchFilterKey, string>>>
}

export function HeroSection({
  selectedSearch,
  priceRange,
  priceRangeLabel,
  activeSearchMenu,
  searchDraft,
  searchHref,
  desktopSearchRef,
  mobileSearchRef,
  openSearchMenu,
  closeSearchMenu,
  selectSearchValue,
  updatePriceRange,
  filterSearchOptions,
  setSearchDraft,
}: HeroSectionProps) {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        zIndex: 5,
        color: '#FFFFFF',
        minHeight: { xs: 332, md: 315, xl: 455 },
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible',
        width: '100%',
        backgroundColor: '#0D0F14',
        backgroundImage:
          'linear-gradient(100deg, rgba(13, 15, 20, 0.98) 0%, rgba(13, 15, 20, 0.9) 48%, rgba(83, 9, 50, 0.72) 100%), url("https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=1800&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 3fr) minmax(0, 2fr)' },
            alignItems: 'center',
            gap: { xs: 2.4, lg: 4, xl: 7 },
            py: { xs: 2.5, md: 4.2, xl: 8 },
            isolation: 'isolate',
            textAlign: { xs: 'center', md: 'left' },
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography
              variant="h1"
              sx={{
                maxWidth: { xs: 420, md: 700, xl: 760 },
                color: '#FFFFFF',
                fontSize: { xs: '1.6rem', md: '2.45rem', xl: '3.35rem' },
                letterSpacing: 0,
                mb: { xs: 0.9, md: 1.7, xl: 2.5 },
                mx: { xs: 'auto', md: 0 },
              }}
            >
              <Box component="span" sx={{ display: 'block' }}>
                A infraestrutura digital
              </Box>
              <Box component="span" sx={{ display: 'block' }}>
                do mercado imobiliário
              </Box>
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.72)',
                mb: { xs: 1.5, md: 3, xl: 4.8 },
                maxWidth: { xs: 360, md: 690, xl: 760 },
                fontSize: { xs: 13.6, md: 13.5, xl: 16 },
                mx: { xs: 'auto', md: 0 },
                whiteSpace: { md: 'nowrap' },
              }}
            >
              Aluguel e venda de imóveis com tecnologia de ponta, processos ágeis e total confiança.
            </Typography>

            <Stack
              ref={desktopSearchRef}
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'stretch', md: 'center' }}
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '8px',
                p: { md: 0.8, xl: 1.3 },
                width: '100%',
                maxWidth: { md: 820, lg: '100%', xl: '100%' },
                boxSizing: 'border-box',
                boxShadow: {
                  md: '0 16px 42px rgba(0,0,0,0.22)',
                  xl: '0 24px 70px rgba(0,0,0,0.28)',
                },
                display: { xs: 'none', md: 'flex' },
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {searchFilterOrder.map((key, index) => (
                <Box
                  key={key}
                  sx={{
                    flex:
                      key === 'location'
                        ? { md: '1.35 1 0', xl: '1.35 1 0' }
                        : key === 'priceRange'
                          ? { md: '1.45 1 0', xl: '1.45 1 0' }
                          : '1 1 0',
                    minWidth: 0,
                    position: 'relative',
                    borderRight: index < 2 ? { xs: 0, md: '1px solid' } : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Button
                    fullWidth
                    onClick={(event) => {
                      event.stopPropagation()
                      openSearchMenu(key)
                    }}
                    endIcon={<KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minWidth: 0,
                      minHeight: { md: 40, xl: 55 },
                      px: { xs: 1, md: 1.25, xl: 2 },
                      py: { md: 0.35, xl: 0.6 },
                      color: 'text.primary',
                      borderRadius: '8px',
                      textAlign: 'left',
                      textTransform: 'none',
                      '& .MuiButton-endIcon': {
                        color: 'text.disabled',
                        ml: 1,
                      },
                      '&:hover': {
                        bgcolor: 'rgba(243, 2, 116, 0.06)',
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: 'text.disabled',
                          fontSize: { md: 8.5, xl: 10 },
                          fontWeight: 800,
                          lineHeight: 1.2,
                          textTransform: 'uppercase',
                        }}
                      >
                        {searchOptions[key].label}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'text.primary',
                          fontSize: { md: 12, xl: 13.5 },
                          fontWeight: 900,
                          lineHeight: 1.35,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {key === 'priceRange' ? priceRangeLabel : selectedSearch[key]}
                      </Typography>
                    </Box>
                  </Button>
                  {activeSearchMenu === key && (
                    <Box
                      onClick={(event) => event.stopPropagation()}
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: key === 'priceRange' ? 'auto' : 0,
                        right: key === 'priceRange' ? 0 : 'auto',
                        width: '100%',
                        maxWidth: 'calc(100vw - 32px)',
                        zIndex: 50,
                        display: { xs: 'none', md: 'block' },
                        borderRadius: '8px',
                        bgcolor: '#FFFFFF',
                        color: 'text.primary',
                        boxShadow: '0 18px 48px rgba(13,15,20,0.18)',
                        overflow: key === 'priceRange' ? 'visible' : 'hidden',
                      }}
                    >
                      {key === 'priceRange' ? (
                        <Box sx={{ px: 1.3, py: 1.5 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1.5 }}
                          >
                            <Typography
                              sx={{ color: 'text.primary', fontSize: 14, fontWeight: 900 }}
                            >
                              Faixa de preço
                            </Typography>
                            <IconButton
                              aria-label="Fechar faixa de preço"
                              size="small"
                              onClick={closeSearchMenu}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                          <Stack direction="row" spacing={0.8} sx={{ mb: 2 }}>
                            <TextField
                              label="Mínimo"
                              type="number"
                              value={priceRange[0]}
                              onChange={(event) =>
                                updatePriceRange([
                                  Number(event.target.value || priceLimit.min),
                                  priceRange[1],
                                ])
                              }
                              size="small"
                              fullWidth
                              sx={{ '& .MuiInputBase-input': { px: 1.2 } }}
                              inputProps={{
                                min: priceLimit.min,
                                max: priceLimit.max,
                                step: priceLimit.step,
                              }}
                            />
                            <TextField
                              label="Máximo"
                              type="number"
                              value={priceRange[1]}
                              onChange={(event) =>
                                updatePriceRange([
                                  priceRange[0],
                                  Number(event.target.value || priceLimit.min),
                                ])
                              }
                              size="small"
                              fullWidth
                              sx={{ '& .MuiInputBase-input': { px: 1.2 } }}
                              inputProps={{
                                min: priceLimit.min,
                                max: priceLimit.max,
                                step: priceLimit.step,
                              }}
                            />
                          </Stack>
                          <Box sx={{ px: 1 }}>
                            <Slider
                              getAriaLabel={() => 'Faixa de preço'}
                              value={priceRange}
                              onChange={(_, nextValue) =>
                                updatePriceRange(nextValue as [number, number])
                              }
                              valueLabelDisplay="auto"
                              valueLabelFormat={(value) => formatCurrency(value)}
                              min={priceLimit.min}
                              max={priceLimit.max}
                              step={priceLimit.step}
                              disableSwap
                            />
                          </Box>
                          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                              {formatCurrency(priceLimit.min)}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                              {formatCurrency(priceLimit.max)}
                            </Typography>
                          </Stack>
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={closeSearchMenu}
                            sx={{ mt: 1.8, minHeight: 38, borderRadius: '8px' }}
                          >
                            Aplicar
                          </Button>
                        </Box>
                      ) : textSearchFilterOrder.includes(key as TextSearchFilterKey) ? (
                        <Box>
                          <Box sx={{ p: 1 }}>
                            <TextField
                              autoFocus
                              fullWidth
                              size="small"
                              placeholder={
                                key === 'location'
                                  ? 'Digite cidade ou bairro'
                                  : 'Digite o tipo de imóvel'
                              }
                              value={searchDraft[key as TextSearchFilterKey]}
                              onChange={(event) =>
                                setSearchDraft((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                              onKeyDown={(event) => {
                                if (event.key !== 'Enter') return
                                const [firstOption] = filterSearchOptions(
                                  key as TextSearchFilterKey,
                                )
                                if (firstOption) selectSearchValue(key, firstOption)
                              }}
                            />
                          </Box>
                          <Box
                            sx={{
                              maxHeight: { md: 82, xl: 132 },
                              overflowY: 'auto',
                              pb: 0.5,
                            }}
                          >
                            {filterSearchOptions(key as TextSearchFilterKey).length ? (
                              filterSearchOptions(key as TextSearchFilterKey).map((value) => (
                                <MenuItem
                                  key={value}
                                  selected={selectedSearch[key] === value}
                                  onClick={() => selectSearchValue(key, value)}
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: 13,
                                    fontWeight: selectedSearch[key] === value ? 900 : 700,
                                    '&.Mui-selected': {
                                      bgcolor: 'rgba(243, 2, 116, 0.1)',
                                      color: '#212631',
                                    },
                                    '&.Mui-selected:hover': {
                                      bgcolor: 'rgba(243, 2, 116, 0.14)',
                                    },
                                    '&:hover': {
                                      bgcolor: 'rgba(33, 38, 49, 0.06)',
                                    },
                                  }}
                                >
                                  {value}
                                </MenuItem>
                              ))
                            ) : (
                              <Typography
                                sx={{
                                  color: 'text.secondary',
                                  px: 2,
                                  py: 1.5,
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                Nenhum resultado
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      ) : null}
                    </Box>
                  )}
                </Box>
              ))}
              {false && activeSearchMenu && (
                <Box
                  onClick={(event) => event.stopPropagation()}
                  sx={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left:
                      activeSearchMenu === 'location'
                        ? 8
                        : activeSearchMenu === 'propertyType'
                          ? '31%'
                          : '57%',
                    width: activeSearchMenu === 'priceRange' ? 360 : 240,
                    maxWidth: 'calc(100vw - 32px)',
                    zIndex: 20,
                    display: { xs: 'none', md: 'block' },
                    borderRadius: '8px',
                    bgcolor: '#FFFFFF',
                    color: 'text.primary',
                    boxShadow: '0 18px 48px rgba(13,15,20,0.18)',
                    overflow: activeSearchMenu === 'priceRange' ? 'visible' : 'hidden',
                  }}
                >
                  {activeSearchMenu === 'priceRange' ? (
                    <Box sx={{ px: 2.2, py: 2 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1.5 }}
                      >
                        <Typography sx={{ color: 'text.primary', fontSize: 14, fontWeight: 900 }}>
                          Faixa de preço
                        </Typography>
                        <IconButton
                          aria-label="Fechar faixa de preço"
                          size="small"
                          onClick={closeSearchMenu}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Stack direction="row" spacing={1.2} sx={{ mb: 2.2 }}>
                        <TextField
                          label="Mínimo"
                          type="number"
                          value={priceRange[0]}
                          onChange={(event) =>
                            updatePriceRange([
                              Number(event.target.value || priceLimit.min),
                              priceRange[1],
                            ])
                          }
                          size="small"
                          fullWidth
                          inputProps={{
                            min: priceLimit.min,
                            max: priceLimit.max,
                            step: priceLimit.step,
                          }}
                        />
                        <TextField
                          label="Máximo"
                          type="number"
                          value={priceRange[1]}
                          onChange={(event) =>
                            updatePriceRange([
                              priceRange[0],
                              Number(event.target.value || priceLimit.min),
                            ])
                          }
                          size="small"
                          fullWidth
                          inputProps={{
                            min: priceLimit.min,
                            max: priceLimit.max,
                            step: priceLimit.step,
                          }}
                        />
                      </Stack>
                      <Slider
                        getAriaLabel={() => 'Faixa de preço'}
                        value={priceRange}
                        onChange={(_, nextValue) => updatePriceRange(nextValue as [number, number])}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => formatCurrency(value)}
                        min={priceLimit.min}
                        max={priceLimit.max}
                        step={priceLimit.step}
                        disableSwap
                      />
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                        <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                          {formatCurrency(priceLimit.min)}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>
                          {formatCurrency(priceLimit.max)}
                        </Typography>
                      </Stack>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={closeSearchMenu}
                        sx={{ mt: 2, minHeight: 38, borderRadius: '8px' }}
                      >
                        Aplicar
                      </Button>
                    </Box>
                  ) : (
                    searchOptions[activeSearchMenu as SearchFilterKey].values.map((value) => (
                      <MenuItem
                        key={value}
                        selected={selectedSearch[activeSearchMenu as SearchFilterKey] === value}
                        onClick={() =>
                          selectSearchValue(activeSearchMenu as SearchFilterKey, value)
                        }
                        sx={{
                          color: 'text.primary',
                          fontSize: 13,
                          fontWeight:
                            selectedSearch[activeSearchMenu as SearchFilterKey] === value
                              ? 900
                              : 700,
                          '&.Mui-selected': {
                            bgcolor: 'rgba(243, 2, 116, 0.1)',
                            color: '#212631',
                          },
                          '&.Mui-selected:hover': {
                            bgcolor: 'rgba(243, 2, 116, 0.14)',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(33, 38, 49, 0.06)',
                          },
                        }}
                      >
                        {value}
                      </MenuItem>
                    ))
                  )}
                </Box>
              )}
              <Button
                component={Link}
                href={searchHref}
                variant="contained"
                sx={{
                  flex: { md: '0 0 104px', xl: '0 0 118px' },
                  minWidth: { md: 104, xl: 118 },
                  minHeight: { md: 40, xl: 55 },
                  ml: { md: 0.7, xl: 0.9 },
                  px: 0,
                  borderRadius: '8px',
                  fontSize: { md: 12, xl: 14 },
                }}
              >
                Buscar
              </Button>
            </Stack>

            <Box
              ref={mobileSearchRef}
              sx={{
                display: { xs: 'block', md: 'none' },
                bgcolor: '#FFFFFF',
                borderRadius: '8px',
                p: 1,
                maxWidth: 360,
                mx: 'auto',
                boxShadow: '0 18px 45px rgba(0,0,0,0.24)',
              }}
            >
              <Button
                fullWidth
                onClick={(event) => {
                  event.stopPropagation()
                  openSearchMenu('location')
                }}
                startIcon={<SearchOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  justifyContent: 'flex-start',
                  minHeight: 36,
                  px: 1.4,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px',
                  color: 'text.secondary',
                  bgcolor: '#FFFFFF',
                  textAlign: 'left',
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#F7F8FA' },
                  '& .MuiButton-startIcon': {
                    color: 'primary.main',
                  },
                }}
              >
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: 13.6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Buscar por bairro, cidade...
                </Typography>
              </Button>
              {activeSearchMenu === 'location' && (
                <Box
                  sx={{
                    mt: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      placeholder="Digite cidade ou bairro"
                      value={searchDraft.location}
                      onChange={(event) =>
                        setSearchDraft((current) => ({
                          ...current,
                          location: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        const [firstOption] = filterSearchOptions('location')
                        if (firstOption) selectSearchValue('location', firstOption)
                      }}
                    />
                  </Box>
                  <Box sx={{ maxHeight: 132, overflowY: 'auto', pb: 0.5 }}>
                    {filterSearchOptions('location').length ? (
                      filterSearchOptions('location').map((value) => (
                        <MenuItem
                          key={value}
                          selected={selectedSearch.location === value}
                          onClick={() => selectSearchValue('location', value)}
                          sx={{
                            color: 'text.primary',
                            justifyContent: 'center',
                            fontSize: 14.4,
                            fontWeight: selectedSearch.location === value ? 900 : 700,
                            '&.Mui-selected': {
                              bgcolor: 'rgba(243, 2, 116, 0.1)',
                              color: '#212631',
                            },
                            '&.Mui-selected:hover': {
                              bgcolor: 'rgba(243, 2, 116, 0.14)',
                            },
                            '&:hover': {
                              bgcolor: 'rgba(33, 38, 49, 0.06)',
                            },
                          }}
                        >
                          {value}
                        </MenuItem>
                      ))
                    ) : (
                      <Typography
                        sx={{
                          color: 'text.secondary',
                          px: 2,
                          py: 1.5,
                          fontSize: 14.4,
                          fontWeight: 700,
                          textAlign: 'center',
                        }}
                      >
                        Nenhum resultado
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              <Button
                component={Link}
                href={searchHref}
                variant="contained"
                fullWidth
                sx={{ mt: 0.9, minHeight: 36, borderRadius: '8px', fontSize: 14.4 }}
              >
                Buscar
              </Button>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 3, xl: 5 }}
              justifyContent={{ sm: 'center', lg: 'flex-start' }}
              alignItems={{ sm: 'center', lg: 'baseline' }}
              sx={{
                mt: { sm: 3.2, xl: 5 },
                display: { xs: 'none', sm: 'flex' },
                width: '100%',
                maxWidth: { sm: 620, xl: 760 },
                transform: { sm: 'translateY(20px)', lg: 'none' },
              }}
            >
              {[
                ['2.500+', 'imóveis ativos'],
                ['180+', 'corretores parceiros'],
                ['45+', 'cidades atendidas'],
              ].map(([value, label]) => (
                <Stack key={label} direction="row" alignItems="baseline" spacing={1}>
                  <Typography
                    sx={{ color: 'primary.main', fontSize: { sm: 20, xl: 28 }, fontWeight: 900 }}
                  >
                    {value}
                  </Typography>
                  <Typography
                    sx={{ color: 'rgba(255,255,255,0.78)', fontSize: { sm: 11, xl: 13 } }}
                  >
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

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
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 10%, rgba(0,0,0,0.42) 24%, #000 34%, #000 66%, rgba(0,0,0,0.42) 76%, rgba(0,0,0,0.06) 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 7%, #000 18%, #000 82%, rgba(0,0,0,0.55) 93%, transparent 100%)',
                maskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 10%, rgba(0,0,0,0.42) 24%, #000 34%, #000 66%, rgba(0,0,0,0.42) 76%, rgba(0,0,0,0.06) 90%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 7%, #000 18%, #000 82%, rgba(0,0,0,0.55) 93%, transparent 100%)',
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
                  WebkitMaskImage:
                    'radial-gradient(ellipse at center, #000 38%, rgba(0,0,0,0.68) 52%, rgba(0,0,0,0.18) 66%, transparent 78%)',
                  maskImage:
                    'radial-gradient(ellipse at center, #000 38%, rgba(0,0,0,0.68) 52%, rgba(0,0,0,0.18) 66%, transparent 78%)',
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
        </Box>
      </Container>
    </Box>
  )
}
