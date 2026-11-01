import { consoleHandler } from '@server/face_check/http/controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = consoleHandler('settings-get')
export const PUT = consoleHandler('settings-put')
