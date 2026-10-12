import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const localUploadsRoot = path.join(process.cwd(), '.local', 'uploads')

function resolveLocalUploadPath(scope: string, key: string) {
  const basePath = path.join(localUploadsRoot, scope)
  const filePath = path.resolve(basePath, key)

  if (!filePath.startsWith(path.resolve(basePath))) {
    throw new Error('Caminho de mídia local inválido.')
  }

  return filePath
}

export async function writeLocalUpload(scope: string, key: string, body: Buffer) {
  const filePath = resolveLocalUploadPath(scope, key)

  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, body)
}

export async function readLocalUpload(scope: string, key: string) {
  const filePath = resolveLocalUploadPath(scope, key)

  return readFile(filePath)
}

export function getContentTypeFromMediaKey(key: string) {
  const extension = path.extname(key).toLowerCase()

  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'

  return 'application/octet-stream'
}
