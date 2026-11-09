import { FaceCheckSessionDetailPage } from '@modules/face_check'

export default async function FaceCheckSessionRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <FaceCheckSessionDetailPage id={id} />
}
