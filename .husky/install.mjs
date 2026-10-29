import { existsSync } from 'node:fs'

const { NODE_ENV, CI, VERCEL, HUSKY } = process.env

if (
  NODE_ENV === 'production' ||
  (CI && CI !== 'false' && CI !== '0') ||
  VERCEL === '1' ||
  HUSKY === '0' ||
  !existsSync('.git')
) {
  process.exit(0)
}

const { default: install } = await import('husky')
const error = install()
if (error) throw new Error(error)
