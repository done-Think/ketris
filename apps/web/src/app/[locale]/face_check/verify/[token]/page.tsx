import type { Metadata } from 'next'
import { FaceCheckCapturePage } from '@modules/face_check'
import { ScopedMessages } from '@/i18n/scoped-messages'
import { privateMetadata } from '@/i18n/seo'

export const metadata: Metadata = { ...privateMetadata, referrer: 'no-referrer' }
export const dynamic = 'force-dynamic'

export default async function FaceCheckCaptureRoute({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return (
    <ScopedMessages namespaces={['face_check']}>
      <FaceCheckCapturePage token={token} />
    </ScopedMessages>
  )
}
