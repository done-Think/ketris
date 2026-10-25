import { useEffect, useState } from 'react'

export function useAvatarPreview(file: File | null) {
  const [preview, setPreview] = useState<string | undefined>()
  useEffect(() => {
    if (!file) {
      setPreview(undefined)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return preview
}
