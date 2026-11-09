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

  const toneAt = useCallback((frequency: number, duration: number) => {
    const audio = context.current
    if (!audio || audio.state !== 'running') return
    try {
      const tone = audio.createOscillator()
      const volume = audio.createGain()
      const start = audio.currentTime
      tone.type = 'sine'
      tone.frequency.setValueAtTime(frequency, start)
      volume.gain.setValueAtTime(0, start)
      volume.gain.linearRampToValueAtTime(0.06, start + 0.005)
      volume.gain.linearRampToValueAtTime(0, start + duration)
      tone.connect(volume)
      volume.connect(audio.destination)
      tone.onended = () => {
        tone.disconnect()
        volume.disconnect()
      }
      tone.start(start)
      tone.stop(start + duration)
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

  const play = useCallback(() => toneAt(880, 0.1), [toneAt])
  const tick = useCallback(() => toneAt(600, 0.06), [toneAt])

  return { prepare, play, tick }
}
