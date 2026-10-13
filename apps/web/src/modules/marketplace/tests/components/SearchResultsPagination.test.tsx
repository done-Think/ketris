import { ThemeProvider } from '@mui/material'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { theme } from '@shared/theme/theme'

import { SearchResultsPagination } from '../../components/search-results/SearchResultsPagination'

function renderSearchResultsPagination({
  currentPage = 1,
  setCurrentPage = vi.fn(),
  totalPages = 1,
} = {}) {
  render(
    <ThemeProvider theme={theme}>
      <SearchResultsPagination
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />
    </ThemeProvider>,
  )

  return { setCurrentPage }
}

describe('SearchResultsPagination', () => {
  it('shows only the pages available for the current result set', () => {
    renderSearchResultsPagination({ totalPages: 1 })

    expect(screen.getByRole('button', { name: '1' })).toBeVisible()
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '3' })).not.toBeInTheDocument()
  })

  it('selects another page when it is available', () => {
    const { setCurrentPage } = renderSearchResultsPagination({ currentPage: 1, totalPages: 2 })

    fireEvent.click(screen.getByRole('button', { name: '2' }))

    expect(setCurrentPage).toHaveBeenCalledWith(2)
  })
})
