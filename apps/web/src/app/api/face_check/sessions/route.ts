import { consoleHandler } from '@server/face_check/http/controller'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = consoleHandler('sessions-list')
export const POST = consoleHandler('sessions-create')
