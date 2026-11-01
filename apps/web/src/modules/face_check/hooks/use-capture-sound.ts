import { useCallback, useEffect, useRef } from 'react'

export function useCaptureSound() {
  const context = useRef<AudioContext | null>(null)

  const prepare = useCallback(() => {
    try {
      if (!window.AudioContext) return
      if (!context.current || context.current.state === 'closed')
        context.current = new AudioContext()
      if (context.current.state === 'suspended')
        void context.current.resume().catch(() => undefined)
    } catch {
      context.current = null
    }
  }, [])

  const play = useCallback(() => {
    const audio = context.current
    if (!audio || audio.state !== 'running') return
    try {
      const tone = audio.createOscillator()
      const volume = audio.createGain()
      const start = audio.currentTime
      tone.type = 'sine'
      tone.frequency.setValueAtTime(880, start)
      volume.gain.setValueAtTime(0, start)
      volume.gain.linearRampToValueAtTime(0.06, start + 0.005)
      volume.gain.linearRampToValueAtTime(0, start + 0.1)
      tone.connect(volume)
      volume.connect(audio.destination)
      tone.onended = () => {
        tone.disconnect()
        volume.disconnect()
      }
      tone.start(start)
      tone.stop(start + 0.1)
    } catch {
      return
    }
  }, [])

  useEffect(
    () => () => {
      const audio = context.current
      context.current = null
      if (audio && audio.state !== 'closed') void audio.close().catch(() => undefined)
    },
    [],
  )

  return { prepare, play }
}
