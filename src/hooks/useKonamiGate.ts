import { useEffect, useState } from 'react'

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
] as const

const STORAGE_KEY = 'llmbench-konami-activated'

type WebkitAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

export function useKonamiGate() {
  const [activated, setActivated] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setActivated(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || activated) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      setProgress((currentProgress) => {
        const expectedKey = KONAMI_SEQUENCE[currentProgress]
        const nextProgress = event.code === expectedKey ? currentProgress + 1 : event.code === KONAMI_SEQUENCE[0] ? 1 : 0

        if (nextProgress === KONAMI_SEQUENCE.length) {
          playRetroUnlockSound()
          window.sessionStorage.setItem(STORAGE_KEY, 'true')
          setActivated(true)
          return 0
        }

        return nextProgress
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activated])

  return { activated, progress, sequenceLength: KONAMI_SEQUENCE.length }
}

export function clearKonamiActivation() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(STORAGE_KEY)
}

function playRetroUnlockSound() {
  if (typeof window === 'undefined') {
    return
  }

  const AudioCtor = window.AudioContext || (window as WebkitAudioWindow).webkitAudioContext
  if (!AudioCtor) {
    return
  }

  const audioContext = new AudioCtor()
  const startAt = audioContext.currentTime + 0.03
  const notes = [
    { frequency: 329.63, offset: 0, duration: 0.12 },
    { frequency: 392.0, offset: 0.12, duration: 0.12 },
    { frequency: 523.25, offset: 0.24, duration: 0.12 },
    { frequency: 659.25, offset: 0.36, duration: 0.18 },
    { frequency: 523.25, offset: 0.56, duration: 0.12 },
    { frequency: 783.99, offset: 0.7, duration: 0.24 },
  ]

  for (const note of notes) {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(note.frequency, startAt + note.offset)
    gainNode.gain.setValueAtTime(0.0001, startAt + note.offset)
    gainNode.gain.exponentialRampToValueAtTime(0.12, startAt + note.offset + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + note.offset + note.duration)
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    oscillator.start(startAt + note.offset)
    oscillator.stop(startAt + note.offset + note.duration)
  }

  const noiseDuration = 0.09
  const bufferSize = Math.floor(audioContext.sampleRate * noiseDuration)
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
  const channel = noiseBuffer.getChannelData(0)
  for (let index = 0; index < bufferSize; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize)
  }

  for (const offset of [0, 0.36, 0.7]) {
    const source = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    source.buffer = noiseBuffer
    gainNode.gain.setValueAtTime(0.045, startAt + offset)
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + offset + noiseDuration)
    source.connect(gainNode)
    gainNode.connect(audioContext.destination)
    source.start(startAt + offset)
  }

  window.setTimeout(() => {
    void audioContext.close()
  }, 1800)
}