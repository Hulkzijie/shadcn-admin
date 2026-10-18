import { useCallback, useEffect, useRef, useState } from 'react'

export type UseSpeechRecognitionOptions = {
  lang?: string
  /** 持续聆听（语音通调用 true，一次性语音输入用 false） */
  continuous?: boolean
  interimResults?: boolean
  /** 每次拿到「已确认」的识别文本时回调 */
  onResult?: (transcript: string) => void
}

const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

/**
 * 基于 Web Speech API 的语音识别封装。
 * start / stop 为稳定引用，可作为 effect 依赖使用。
 */
export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const [supported] = useState(() => Boolean(getRecognitionCtor()))
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  /** 是否希望保持聆听；浏览器静音后自行结束识别时据此自动重启 */
  const activeRef = useRef(false)
  const optionsRef = useRef(options)

  // 始终读取最新的配置与回调，避免识别实例持有过期闭包
  useEffect(() => {
    optionsRef.current = options
  })

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current
    const Ctor = getRecognitionCtor()
    if (!Ctor) return null

    const recognition = new Ctor()

    recognition.onstart = () => {
      setListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) finalText += text
        else interimText += text
      }
      setInterim(interimText)
      if (finalText.trim()) {
        setInterim('')
        optionsRef.current.onResult?.(finalText.trim())
      }
    }

    recognition.onerror = (event) => {
      // 静音、主动中止都会触发 error，不属于需要提示的异常
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(event.error)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      setInterim('')
      if (activeRef.current && optionsRef.current.continuous) {
        try {
          recognition.start()
        } catch {
          // 重复 start 会被浏览器拒绝，忽略
        }
      }
    }

    recognitionRef.current = recognition
    return recognition
  }, [])

  const start = useCallback(() => {
    const recognition = ensureRecognition()
    if (!recognition) {
      setError('unsupported')
      return
    }
    const current = optionsRef.current
    recognition.lang = current.lang ?? 'zh-CN'
    recognition.continuous = current.continuous ?? true
    recognition.interimResults = current.interimResults ?? true
    activeRef.current = true
    try {
      recognition.start()
    } catch {
      // 已在聆听中，忽略重复启动
    }
  }, [ensureRecognition])

  const stop = useCallback(() => {
    activeRef.current = false
    recognitionRef.current?.stop()
  }, [])

  const reset = useCallback(() => {
    setInterim('')
    setError(null)
  }, [])

  useEffect(
    () => () => {
      activeRef.current = false
      recognitionRef.current?.abort()
    },
    []
  )

  return { supported, listening, interim, error, start, stop, reset }
}
