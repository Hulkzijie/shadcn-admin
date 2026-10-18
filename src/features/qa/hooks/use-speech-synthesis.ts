import { useCallback, useEffect, useRef, useState } from 'react'

type SpeakOptions = {
  lang?: string
  rate?: number
  /** 播报结束（含被取消）时回调 */
  onEnd?: () => void
}

/** 基于 speechSynthesis 的语音合成封装，用于朗读回答 */
export function useSpeechSynthesis() {
  const [supported] = useState(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window
  )
  const [speaking, setSpeaking] = useState(false)
  // 持有引用，避免 utterance 被回收导致 onend 不触发
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      const content = text.trim()
      if (!supported || !content) {
        options.onEnd?.()
        return
      }
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(content)
      utterance.lang = options.lang ?? 'zh-CN'
      utterance.rate = options.rate ?? 1
      const finish = () => {
        setSpeaking(false)
        options.onEnd?.()
      }
      utterance.onend = finish
      utterance.onerror = finish
      utteranceRef.current = utterance
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [supported]
  )

  useEffect(
    () => () => {
      if (supported) window.speechSynthesis.cancel()
    },
    [supported]
  )

  return { supported, speaking, speak, cancel }
}
