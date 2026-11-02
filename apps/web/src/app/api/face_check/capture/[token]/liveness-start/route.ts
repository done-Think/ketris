import { captureHandler } from '@server/face_check/http/controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10
export const POST = captureHandler('liveness-start')
