import { fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CreatePropertyDashboardPage } from '../../components/CreatePropertyDashboardPage'
import { editableProperty } from '../fixtures/editable-property'

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  publish: vi.fn(),
  queue: vi.fn(),
  push: vi.fn(),
  snackbar: vi.fn(),
}))
vi.mock('../../hooks/use-properties', () => ({
  useCreateProperty: () => ({ mutateAsync: mocks.create, isPending: false }),
  usePublishProperty: () => ({ mutateAsync: mocks.publish, isPending: false }),
  usePropertyMediaUploadsPending: () => false,
}))
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { role: 'OWNER', tenantId: 'tenant-1' } }),
}))
vi.mock('@shared/lib/api/instagram-service', () => ({ instagramService: { queue: mocks.queue } }))
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: mocks.snackbar }) }))
vi.mock('../../components/CreatePropertyStepFields', () => ({
  CreatePropertyStepFields: () => null,
}))
vi.mock('../../schemas/create-dashboard-property-schema', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../schemas/create-dashboard-property-schema')>()
  const { editableProperty } = await import('../fixtures/editable-property')
  const { buildEditPropertyFormValues } =
    await import('../../utils/build-edit-property-form-values')
  return {
    ...actual,
    createDashboardPropertyDefaultValues: {
      ...buildEditPropertyFormValues(editableProperty),
      publishingOptions: ['publishAfterReview'],
      instagramEnabled: true,
      instagramCaption: 'Confirmed caption',
      instagramImageUrls: ['/photo.jpg'],
      media: [{ url: '/photo.jpg' }],
    },
  }
})

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
  vi.clearAllMocks()
  mocks.create.mockResolvedValue({ id: 'new-property' })
  mocks.publish.mockResolvedValue({ id: 'new-property', status: 'PUBLISHED' })
  mocks.queue.mockResolvedValue({ publication: { id: 'job' } })
})
afterEach(() => vi.unstubAllGlobals())

describe('Property website publication independent of Instagram', () => {
  it('publishes on the website before requesting the confirmed Instagram post', async () => {
    const { container } = render(<CreatePropertyDashboardPage />)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(mocks.push).toHaveBeenCalled())
    expect(mocks.publish).toHaveBeenCalledWith('new-property')
    expect(mocks.queue).toHaveBeenCalledWith('new-property', {
      caption: 'Confirmed caption',
      imageUrls: ['/photo.jpg'],
    })
    expect(mocks.publish.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.queue.mock.invocationCallOrder[0],
    )
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerUserId: null,
        type: 'house',
        purpose: 'BOTH',
        listing: expect.objectContaining({
          negotiationTerms: editableProperty.listing.negotiationTerms,
        }),
      }),
    )
  })
  it('keeps the property and navigates to its detail when Instagram rejects the request', async () => {
    mocks.queue.mockRejectedValue(new Error('provider unavailable'))
    const { container } = render(<CreatePropertyDashboardPage />)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith({
        pathname: '/dashboard/properties/[id]',
        params: { id: 'new-property' },
      }),
    )
    expect(mocks.publish).toHaveBeenCalledOnce()
    expect(mocks.create).toHaveBeenCalledOnce()
    expect(mocks.snackbar).toHaveBeenCalledWith(
      expect.stringContaining('O imóvel foi publicado no site.'),
      { variant: 'warning' },
    )
  })
  it('does not send to Instagram when website publication fails after saving the property', async () => {
    mocks.publish.mockRejectedValue(new Error('website validation failed'))
    const { container } = render(<CreatePropertyDashboardPage />)
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(mocks.push).toHaveBeenCalled())
    expect(mocks.queue).not.toHaveBeenCalled()
    expect(mocks.create).toHaveBeenCalledOnce()
    expect(mocks.snackbar).toHaveBeenCalledWith(expect.stringContaining('O imóvel foi salvo'), {
      variant: 'warning',
    })
  })
})
