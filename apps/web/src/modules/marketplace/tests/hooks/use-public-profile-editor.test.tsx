import { zodResolver } from '@hookform/resolvers/zod'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { usePublicProfileEditor } from '../../hooks/use-public-profile-editor'

const enqueueSnackbar = vi.fn()
vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }))

type Values = { name: string; phone: string }
type Profile = { status: 'DRAFT' | 'PUBLISHED'; name: string; phone: string | null }

const schema = z.object({ name: z.string(), phone: z.string() })
const publishSchema = z.object({ name: z.string().min(1, 'Nome obrigatório'), phone: z.string() })

function mutation() {
  return {
    mutate: vi.fn((_vars: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.()),
    isPending: false,
  }
}

let save: ReturnType<typeof mutation>
let publish: ReturnType<typeof mutation>
let unpublish: ReturnType<typeof mutation>

function renderEditor(profile: Profile | null) {
  return renderHook(() =>
    usePublicProfileEditor<Values, Values, Profile>({
      profile,
      toFormValues: (current) => ({ name: current?.name ?? '', phone: current?.phone ?? '' }),
      toDraft: (values) => values,
      resolver: zodResolver(schema),
      publishSchema,
      save,
      publish,
      unpublish,
      messages: (key) => key,
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  save = mutation()
  publish = mutation()
  unpublish = mutation()
})

describe('usePublicProfileEditor', () => {
  it('starts from the saved profile and leaves edit mode after saving', async () => {
    const { result } = renderEditor({ status: 'DRAFT', name: 'Horizonte', phone: null })
    expect(result.current.draft).toEqual({ name: 'Horizonte', phone: '' })

    act(() => result.current.startEditing())
    expect(result.current.isEditing).toBe(true)
    await act(() => result.current.submit())

    expect(save.mutate).toHaveBeenCalledWith({ name: 'Horizonte', phone: '' }, expect.anything())
    expect(result.current.isEditing).toBe(false)
    expect(enqueueSnackbar).toHaveBeenCalledWith('saveSuccess', { variant: 'success' })
  })

  it('refuses to publish an incomplete profile and points at the missing field', async () => {
    const { result } = renderEditor({ status: 'DRAFT', name: '', phone: null })

    act(() => result.current.togglePublished())

    await waitFor(() =>
      expect(result.current.form.getFieldState('name').error?.message).toBe('Nome obrigatório'),
    )
    expect(result.current.isEditing).toBe(true)
    expect(save.mutate).not.toHaveBeenCalled()
    expect(publish.mutate).not.toHaveBeenCalled()
  })

  it('saves before publishing, and unpublishes a published profile', async () => {
    const draft = renderEditor({ status: 'DRAFT', name: 'Horizonte', phone: null })
    act(() => draft.result.current.togglePublished())
    await waitFor(() => expect(publish.mutate).toHaveBeenCalled())
    expect(save.mutate.mock.invocationCallOrder[0]).toBeLessThan(
      publish.mutate.mock.invocationCallOrder[0],
    )

    const published = renderEditor({ status: 'PUBLISHED', name: 'Horizonte', phone: null })
    expect(published.result.current.isPublished).toBe(true)
    act(() => published.result.current.togglePublished())
    expect(unpublish.mutate).toHaveBeenCalled()
    expect(enqueueSnackbar).toHaveBeenCalledWith('unpublishSuccess', { variant: 'success' })
  })
})
