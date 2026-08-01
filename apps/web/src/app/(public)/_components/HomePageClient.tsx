'use client'

import { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'

import { SiteFooter } from './SiteFooter'
import { MiniPropertiesSection } from './MiniPropertiesSection'
import { FeaturedPropertiesSection } from './FeaturedPropertiesSection'
import { HomeHeader } from './HomeHeader'
import { ProfileModal } from './ProfileModal'
import { HeroSection } from './HeroSection'
import {
  formatCurrency,
  normalizeSearchText,
  priceLimit,
  searchFilterOrder,
  searchOptions,
  type SearchFilterKey,
  type TextSearchFilterKey,
} from './_homeData'

// Home / marketplace público — renderizada no servidor (SEO).
export default function HomePageClient() {
  const [selectedSearch, setSelectedSearch] = useState<Record<SearchFilterKey, string>>({
    location: searchOptions.location.values[0],
    propertyType: searchOptions.propertyType.values[0],
    priceRange: searchOptions.priceRange.values[1],
  })
  const [priceRange, setPriceRange] = useState<[number, number]>([2500, 6000])
  const [activeSearchMenu, setActiveSearchMenu] = useState<SearchFilterKey | null>(null)
  const [searchDraft, setSearchDraft] = useState<Record<TextSearchFilterKey, string>>({
    location: '',
    propertyType: '',
  })
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const desktopSearchRef = useRef<HTMLDivElement | null>(null)
  const mobileSearchRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!activeSearchMenu) return

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedDesktopSearch = desktopSearchRef.current?.contains(target)
      const clickedMobileSearch = mobileSearchRef.current?.contains(target)

      if (!clickedDesktopSearch && !clickedMobileSearch) closeSearchMenu()
    }

    document.addEventListener('click', closeOnOutsideClick)
    return () => document.removeEventListener('click', closeOnOutsideClick)
  }, [activeSearchMenu])

  const openSearchMenu = (key: SearchFilterKey) => {
    setActiveSearchMenu((current) => (current === key ? null : key))
  }

  const closeSearchMenu = () => {
    setActiveSearchMenu(null)
  }

  const selectSearchValue = (key: SearchFilterKey, value: string) => {
    setSelectedSearch((current) => ({ ...current, [key]: value }))
    if (key !== 'priceRange') {
      setSearchDraft((current) => ({ ...current, [key]: value }))
    }
    closeSearchMenu()
  }

  const filterSearchOptions = (key: TextSearchFilterKey) => {
    const query = normalizeSearchText(searchDraft[key])
    if (!query) return searchOptions[key].values

    return searchOptions[key].values.filter((value) => normalizeSearchText(value).includes(query))
  }

  const getSearchValue = (key: SearchFilterKey) => {
    if (key === 'priceRange') return `${priceRange[0]}-${priceRange[1]}`
    const typedValue = searchDraft[key].trim()
    return typedValue || selectedSearch[key]
  }

  const priceRangeLabel = `${formatCurrency(priceRange[0])} - ${formatCurrency(priceRange[1])}`

  const updatePriceRange = (nextRange: [number, number]) => {
    const [minValue, maxValue] = nextRange
    const normalizedMin = Math.max(priceLimit.min, Math.min(minValue, priceLimit.max))
    const normalizedMax = Math.max(priceLimit.min, Math.min(maxValue, priceLimit.max))
    const orderedRange: [number, number] =
      normalizedMin <= normalizedMax
        ? [normalizedMin, normalizedMax]
        : [normalizedMax, normalizedMin]

    setPriceRange(orderedRange)
    setSelectedSearch((current) => ({
      ...current,
      priceRange: `${orderedRange[0]}-${orderedRange[1]}`,
    }))
  }

  const searchHref = `/imoveis?${searchFilterOrder
    .map((key) => {
      return `${searchOptions[key].query}=${encodeURIComponent(getSearchValue(key))}`
    })
    .join('&')}`

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        overflowX: 'clip',
        bgcolor: '#F7F8FA',
      }}
    >
      <HomeHeader
        profileButtonRef={profileButtonRef}
        onToggleProfile={() => setIsProfileOpen((current) => !current)}
      />

      <ProfileModal
        open={isProfileOpen}
        anchorRef={profileButtonRef}
        onClose={() => setIsProfileOpen(false)}
      />

      <HeroSection
        selectedSearch={selectedSearch}
        priceRange={priceRange}
        priceRangeLabel={priceRangeLabel}
        activeSearchMenu={activeSearchMenu}
        searchDraft={searchDraft}
        searchHref={searchHref}
        desktopSearchRef={desktopSearchRef}
        mobileSearchRef={mobileSearchRef}
        openSearchMenu={openSearchMenu}
        closeSearchMenu={closeSearchMenu}
        selectSearchValue={selectSearchValue}
        updatePriceRange={updatePriceRange}
        filterSearchOptions={filterSearchOptions}
        setSearchDraft={setSearchDraft}
      />

      <FeaturedPropertiesSection />

      <MiniPropertiesSection />

      <SiteFooter />
    </Box>
  )
}
