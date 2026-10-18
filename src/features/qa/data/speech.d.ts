/**
 * TypeScript 标准 DOM 库只声明了 SpeechRecognitionEvent / SpeechRecognitionResult
 * 等辅助类型，并没有声明构造函数 SpeechRecognition 与 webkit 前缀版本。
 * 这里补充声明，页面即可直接使用语音识别能力。
 */
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => void) | null
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

interface Window {
  SpeechRecognition?: typeof SpeechRecognition
  webkitSpeechRecognition?: typeof SpeechRecognition
}
