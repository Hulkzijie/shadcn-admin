import { useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  Bot,
  Check,
  Copy,
  FileText,
  MessageSquareQuote,
  Square,
  Volume2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { type QaAttachment, type QaMessage } from '../data/qa-types'
import { useSpeechSynthesis } from '../hooks/use-speech-synthesis'
import { formatFileSize } from '../lib/qa-service'

type QaThreadProps = {
  messages: QaMessage[]
  waiting: boolean
}

function AttachmentPreview({ attachment }: { attachment: QaAttachment }) {
  if (attachment.previewUrl) {
    return (
      <a
        href={attachment.previewUrl}
        target='_blank'
        rel='noreferrer'
        className='block size-16 overflow-hidden rounded-md border'
        title={attachment.name}
      >
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className='size-full object-cover'
        />
      </a>
    )
  }
  return (
    <div
      className='flex max-w-52 items-center gap-2 rounded-md border bg-card px-2 py-1.5'
      title={attachment.name}
    >
      <FileText className='size-4 shrink-0 text-muted-foreground' />
      <span className='min-w-0'>
        <span className='block truncate text-xs font-medium'>
          {attachment.name}
        </span>
        <span className='block text-xs text-muted-foreground'>
          {formatFileSize(attachment.size)}
        </span>
      </span>
    </div>
  )
}

/** 一问一答展示区：左侧问题气泡 + 右侧回答卡片，并支持朗读与复制 */
export function QaThread({ messages, waiting }: QaThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const copiedTimerRef = useRef<number | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const { supported: speechSupported, speak, cancel } = useSpeechSynthesis()

  const lastMessage = messages[messages.length - 1]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, waiting])

  useEffect(
    () => () => {
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current)
    },
    []
  )

  const toggleSpeak = (message: QaMessage) => {
    if (speakingId === message.id) {
      cancel()
      setSpeakingId(null)
      return
    }
    setSpeakingId(message.id)
    speak(message.content, {
      onEnd: () => setSpeakingId((id) => (id === message.id ? null : id)),
    })
  }

  const handleCopy = async (message: QaMessage) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id)
      if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      toast.error('复制失败，请手动选择文本复制')
    }
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col rounded-md border bg-card shadow-xs'>
      <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto p-4'>
        <div className='flex flex-col gap-5'>
          {messages.map((message) => {
            const streaming =
              waiting &&
              message.role === 'assistant' &&
              message.id === lastMessage?.id

            if (message.role === 'user') {
              return (
                <div
                  key={message.id}
                  className='flex max-w-[85%] flex-col items-end gap-2 self-end'
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div className='flex flex-wrap justify-end gap-2'>
                      {message.attachments.map((attachment) => (
                        <AttachmentPreview
                          key={attachment.id}
                          attachment={attachment}
                        />
                      ))}
                    </div>
                  )}
                  {message.content && (
                    <div className='rounded-[16px_16px_0_16px] bg-primary/90 px-3 py-2 text-primary-foreground/75 shadow-lg'>
                      <p className='wrap-break-word whitespace-pre-wrap'>
                        {message.content}
                      </p>
                    </div>
                  )}
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    {message.viaVoice && <span>语音提问</span>}
                    <time>{format(message.timestamp, 'HH:mm')}</time>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={message.id}
                className='flex max-w-[85%] flex-col gap-1 self-start'
              >
                <div className='flex items-start gap-2'>
                  <div className='mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted'>
                    <Bot className='size-4' />
                  </div>
                  <div className='rounded-[16px_16px_16px_0] bg-muted px-3 py-2 shadow-xs'>
                    {message.content ? (
                      <p className='wrap-break-word whitespace-pre-wrap'>
                        {message.content}
                        {streaming && <span className='animate-pulse'>▍</span>}
                      </p>
                    ) : (
                      <div className='flex flex-col gap-1 py-1'>
                        <Skeleton className='h-3 w-40' />
                        <Skeleton className='h-3 w-24' />
                      </div>
                    )}
                  </div>
                </div>
                <div className='ms-8 flex items-center gap-1'>
                  <time className='text-xs text-muted-foreground'>
                    {format(message.timestamp, 'HH:mm')}
                  </time>
                  {message.content && (
                    <>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='size-7'
                        aria-label={
                          speakingId === message.id ? '停止朗读' : '朗读回答'
                        }
                        disabled={!speechSupported}
                        onClick={() => toggleSpeak(message)}
                      >
                        {speakingId === message.id ? (
                          <Square className='size-3.5' />
                        ) : (
                          <Volume2 className='size-4' />
                        )}
                      </Button>
                      <Button
                        type='button'
                        size='icon'
                        variant='ghost'
                        className='size-7'
                        aria-label='复制回答'
                        onClick={() => void handleCopy(message)}
                      >
                        {copiedId === message.id ? (
                          <Check className='size-4 text-emerald-600' />
                        ) : (
                          <Copy className='size-4' />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {messages.length === 0 && (
            <div className='flex flex-col items-center gap-2 py-16 text-center text-muted-foreground'>
              <MessageSquareQuote className='size-8' />
              <p className='text-sm'>输入问题开始一问一答</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
