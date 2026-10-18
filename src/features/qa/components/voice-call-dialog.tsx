import { useCallback, useEffect, useRef, useState } from 'react'
import { Hand, LoaderCircle, Mic, MicOff, PhoneOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type QaVoiceExchange, type QaVoicePhase } from '../data/qa-types'
import { useSpeechRecognition } from '../hooks/use-speech-recognition'
import { useSpeechSynthesis } from '../hooks/use-speech-synthesis'
import { createId } from '../lib/qa-service'

type VoiceCallDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 提交一个问题并返回完整回答文本 */
  onAsk: (question: string) => Promise<string>
}

const BAR_HEIGHTS = [14, 26, 40, 52, 40, 26, 14, 30, 44, 30]

const PHASE_META: Record<
  QaVoicePhase,
  { label: string; hint: string; tone: string; bar: string }
> = {
  listening: {
    label: '正在聆听…',
    hint: '免按住，直接说出你的问题',
    tone: 'text-primary',
    bar: 'bg-primary',
  },
  thinking: {
    label: '正在思考…',
    hint: 'AI 正在组织回答',
    tone: 'text-amber-600',
    bar: 'bg-amber-500',
  },
  speaking: {
    label: '正在回答…',
    hint: '点击「打断」可随时打断',
    tone: 'text-emerald-600',
    bar: 'bg-emerald-500',
  },
}

/**
 * 实时语音通话：持续聆听 → 自动提交问题 → 语音播报回答 → 自动恢复聆听。
 * 播报期间暂停识别，避免把 AI 自己的声音当作新提问。
 */
export function VoiceCallDialog({
  open,
  onOpenChange,
  onAsk,
}: VoiceCallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>实时语音通话</DialogTitle>
          <DialogDescription>
            直接开口提问，AI 会用语音回答；回答播报时可随时打断。
          </DialogDescription>
        </DialogHeader>
        {/* 内容随弹窗开合挂载/卸载，保证每次通话从干净的初始状态开始 */}
        <VoiceCallSession onAsk={onAsk} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function VoiceCallSession({
  onAsk,
  onClose,
}: {
  onAsk: (question: string) => Promise<string>
  onClose: () => void
}) {
  const [phase, setPhase] = useState<QaVoicePhase>('listening')
  const [exchanges, setExchanges] = useState<QaVoiceExchange[]>([])
  const [muted, setMuted] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const phaseRef = useRef<QaVoicePhase>('listening')
  const mutedRef = useRef(false)
  const busyRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    supported: ttsSupported,
    speak,
    cancel: cancelSpeech,
  } = useSpeechSynthesis()

  const goto = useCallback((next: QaVoicePhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const {
    supported: micSupported,
    listening,
    interim,
    error: micError,
    start,
    stop,
  } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (transcript) => {
      if (busyRef.current || mutedRef.current) return
      void handleUtterance(transcript)
    },
  })

  const handleUtterance = async (question: string) => {
    busyRef.current = true
    // 思考与播报期间停止识别，避免录入 AI 自身的播报内容
    stop()
    setNotice(null)
    goto('thinking')
    try {
      const answer = await onAsk(question)
      setExchanges((prev) => [...prev, { id: createId(), question, answer }])
      goto('speaking')
      await new Promise<void>((resolve) => {
        speak(answer, { onEnd: () => resolve() })
      })
    } catch {
      setNotice('回答失败，请再说一次。')
    } finally {
      busyRef.current = false
      goto('listening')
      if (!mutedRef.current) start()
    }
  }

  // 挂载即开始聆听，卸载时停止识别与播报
  useEffect(() => {
    start()
    return () => {
      stop()
      cancelSpeech()
    }
  }, [start, stop, cancelSpeech])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [exchanges, interim])

  const toggleMute = () => {
    const next = !mutedRef.current
    mutedRef.current = next
    setMuted(next)
    if (next) {
      stop()
    } else if (phaseRef.current === 'listening') {
      start()
    }
  }

  const interrupt = () => {
    // cancelSpeech 触发播报的 onEnd，进而恢复聆听
    cancelSpeech()
    goto('listening')
  }

  if (!micSupported) {
    return (
      <p className='rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground'>
        当前浏览器不支持语音识别，请使用最新版 Chrome / Edge 打开本页面。
      </p>
    )
  }

  const meta = PHASE_META[phase]
  const barColor = muted ? 'bg-muted-foreground/30' : meta.bar

  return (
    <>
      <div className='flex flex-col items-center gap-3 rounded-md border bg-muted/30 py-6'>
        <div className='flex h-14 items-end gap-1.5'>
          {BAR_HEIGHTS.map((height, index) => (
            <span
              key={index}
              className={cn(
                'w-1.5 rounded-full transition-all duration-300',
                barColor,
                !muted && 'animate-pulse'
              )}
              style={{
                height: muted ? '8px' : `${height}px`,
                animationDelay: `${index * 100}ms`,
              }}
            />
          ))}
        </div>
        <p className={cn('text-sm font-medium', meta.tone)}>
          {muted ? '已静音' : meta.label}
        </p>
        <p className='text-xs text-muted-foreground'>
          {muted ? '点击麦克风恢复聆听' : meta.hint}
        </p>
      </div>

      <ScrollArea className='h-44 rounded-md border p-3'>
        <div ref={scrollRef} className='flex flex-col gap-2 pe-3'>
          {exchanges.length === 0 && !interim && (
            <p className='py-8 text-center text-xs text-muted-foreground'>
              通话记录会显示在这里
            </p>
          )}
          {exchanges.map((exchange) => (
            <div key={exchange.id} className='flex flex-col gap-2'>
              <p className='self-end rounded-[12px_12px_0_12px] bg-primary/90 px-2.5 py-1.5 text-sm text-primary-foreground/80'>
                {exchange.question}
              </p>
              <p className='self-start rounded-[12px_12px_12px_0] bg-muted px-2.5 py-1.5 text-sm'>
                {exchange.answer}
              </p>
            </div>
          ))}
          {interim && (
            <p className='self-end rounded-[12px_12px_0_12px] border border-dashed px-2.5 py-1.5 text-sm text-muted-foreground'>
              {interim}
            </p>
          )}
        </div>
      </ScrollArea>

      {(notice || micError) && (
        <p className='text-xs text-destructive'>
          {notice ?? '语音识别出错，请重试。'}
        </p>
      )}

      {!ttsSupported && (
        <p className='text-xs text-muted-foreground'>
          当前浏览器不支持语音合成，回答将只以文字展示。
        </p>
      )}

      <div className='flex items-center justify-center gap-3'>
        <Button
          type='button'
          size='icon'
          variant={muted ? 'secondary' : 'default'}
          aria-label={muted ? '恢复聆听' : '静音'}
          className='size-11 rounded-full'
          onClick={toggleMute}
        >
          {muted ? <MicOff /> : <Mic />}
        </Button>

        <Button
          type='button'
          variant='outline'
          className='h-11 rounded-full'
          disabled={phase !== 'speaking'}
          onClick={interrupt}
        >
          <Hand /> 打断
        </Button>

        <Button
          type='button'
          size='icon'
          variant='destructive'
          aria-label='结束通话'
          className='size-11 rounded-full'
          onClick={onClose}
        >
          <PhoneOff />
        </Button>
      </div>

      {listening && !muted && (
        <p className='flex items-center justify-center gap-1 text-xs text-muted-foreground'>
          <LoaderCircle className='size-3 animate-spin' />
          麦克风已开启
        </p>
      )}
    </>
  )
}
