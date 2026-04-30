'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, AlertCircle } from 'lucide-react'

/**
 * Web Speech API types — they're not in lib.dom yet on all TS targets, so
 * we declare the minimal shape we use. Browser support: Chrome, Safari,
 * Edge (most LATAM users). Firefox doesn't support it; we degrade gracefully.
 */
type SpeechRecognitionResultList = ArrayLike<{
  isFinal: boolean
  0: { transcript: string }
}>

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

type State =
  | { stage: 'idle' }
  | { stage: 'listening' }
  | { stage: 'unsupported' }
  | { stage: 'error'; message: string }

/**
 * Mic button that streams transcription into a textarea via `onTranscript`.
 *
 * Behavior:
 * - Click once to start, click again to stop
 * - Streams interim results so the agent sees text appear as they speak
 * - Appends final segments to whatever was already in the field — never wipes
 *   user-typed content
 * - If the browser doesn't support Web Speech API, the button stays disabled
 *   with a tooltip
 */
export function VoiceDictate({
  onTranscript,
  lang = 'es-PA',
}: {
  /** Called with the appended transcript chunk (final results only) */
  onTranscript: (chunk: string) => void
  lang?: string
}) {
  const [state, setState] = useState<State>({ stage: 'idle' })
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  // Probe support on mount
  useEffect(() => {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setState({ stage: 'unsupported' })
    }
  }, [])

  function start() {
    const Ctor = getSpeechRecognition()
    if (!Ctor) {
      setState({ stage: 'unsupported' })
      return
    }
    const r = new Ctor()
    r.continuous = true
    r.interimResults = false
    r.lang = lang

    r.onresult = (e) => {
      // Concatenate any final results we haven't emitted yet
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        if (result?.isFinal) {
          const transcript = result[0]?.transcript?.trim()
          if (transcript) {
            // Append a leading space so chunks don't run together
            onTranscript((transcript.endsWith('.') ? transcript : transcript) + ' ')
          }
        }
      }
    }

    r.onerror = (e) => {
      const message =
        e.error === 'not-allowed'
          ? 'Permiso de micrófono denegado.'
          : e.error === 'no-speech'
            ? 'No detectamos audio. Probá de nuevo.'
            : `Error de reconocimiento: ${e.error}`
      setState({ stage: 'error', message })
    }

    r.onend = () => {
      setState((prev) =>
        prev.stage === 'listening' ? { stage: 'idle' } : prev,
      )
    }

    try {
      r.start()
      recognitionRef.current = r
      setState({ stage: 'listening' })
    } catch (err) {
      setState({
        stage: 'error',
        message: err instanceof Error ? err.message : 'Error iniciando dictado',
      })
    }
  }

  function stop() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setState({ stage: 'idle' })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  if (state.stage === 'unsupported') {
    return (
      <button
        type="button"
        disabled
        title="Tu navegador no soporta dictado por voz. Probá en Chrome o Safari."
        className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-bone/30 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-steel"
      >
        <MicOff className="h-3 w-3" strokeWidth={1.5} />
        Dictado n/d
      </button>
    )
  }

  const listening = state.stage === 'listening'

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={listening ? stop : start}
        className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
          listening
            ? 'border-signal bg-signal text-paper'
            : 'border-bone text-steel hover:border-ink hover:text-ink'
        }`}
        aria-pressed={listening}
        aria-label={listening ? 'Parar dictado' : 'Iniciar dictado'}
      >
        {listening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paper opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-paper" />
            </span>
            Grabando · stop
          </>
        ) : (
          <>
            <Mic className="h-3 w-3" strokeWidth={1.5} />
            Dictar
          </>
        )}
      </button>

      {state.stage === 'error' && (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-signal">
          <AlertCircle className="h-3 w-3" strokeWidth={1.5} />
          {state.message}
        </span>
      )}
    </div>
  )
}
