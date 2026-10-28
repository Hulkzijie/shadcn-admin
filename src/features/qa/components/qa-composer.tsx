import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import {
  AudioLines,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Send,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { type QaAttachment } from '../data/qa-types'
import { useSpeechRecognition } from '../hooks/use-speech-recognition'
import { createId, formatFileSize } from '../lib/qa-service'

type QaComposerProps = {
  disabled?: boolean
  autoFocus?: boolean
  /** 发送提问；附件随文本一并交给页面 */
  onSend: (content: string, attachments: QaAttachment[]) => void
  /** 打开实时语音通话 */
  onOpenVoiceCall: () => void
}

const ACCEPT = 'image/*,.pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx'

/** 提问框：附件上传 + 语音输入 + 语音通话入口 */
export function QaComposer({
  disabled = false,
  autoFocus = false,
  onSend,
  onOpenVoiceCall,
}: QaComposerProps) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<QaAttachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /** 输入框仍持有的对象 URL，移除附件或提交时回收 */
  const ownedUrlsRef = useRef<string[]>([])

  const {
    supported: micSupported,
    listening,
    interim,
    start,
    stop,
  } = useSpeechRecognition({
    continuous: false,
    onResult: (transcript) =>
      setInput((prev) => (prev ? `${prev}${transcript}` : transcript)),
  })

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  useEffect(
    () => () => {
      ownedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    },
    []
  )

  const releaseUrl = (url?: string) => {
    if (!url) return
    URL.revokeObjectURL(url)
    ownedUrlsRef.current = ownedUrlsRef.current.filter((item) => item !== url)
  }

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const next = Array.from(files).map<QaAttachment>((file) => {
      const previewUrl = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined
      if (previewUrl) ownedUrlsRef.current.push(previewUrl)
      return {
        id: createId(),
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl,
      }
    })
    setAttachments((prev) => [...prev, ...next])
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id)
      releaseUrl(target?.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }

  const submit = () => {
    const content = input.trim()
    if (disabled || (!content && attachments.length === 0)) return
    if (listening) stop()
    onSend(content, attachments)
    setInput('')
    setAttachments([])
    // 附件已转交消息展示，其对象 URL 不再由输入框回收
    ownedUrlsRef.current = []
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  const canSend = !disabled && (Boolean(input.trim()) || attachments.length > 0)

  return (
    <div className='flex flex-none flex-col gap-2 rounded-md border bg-card p-3 shadow-xs'>
      {attachments.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className='flex items-center gap-2 rounded-md border bg-muted/40 p-1 pe-2'
            >
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className='size-8 rounded object-cover'
                />
              ) : (
                <span className='flex size-8 items-center justify-center'>
                  <FileText className='size-4 text-muted-foreground' />
                </span>
              )}
              <span className='max-w-40 min-w-0'>
                <span className='block truncate text-xs font-medium'>
                  {attachment.name}
                </span>
                <span className='block text-xs text-muted-foreground'>
                  {formatFileSize(attachment.size)}
                </span>
              </span>
              <button
                type='button'
                aria-label={`移除附件 ${attachment.name}`}
                className='rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
                onClick={() => removeAttachment(attachment.id)}
              >
                <X className='size-3.5' />
              </button>
            </div>
          ))}
        </div>
      )}

      {listening && (
        <p className='flex items-center gap-2 text-xs text-primary'>
          <span className='size-2 animate-pulse rounded-full bg-primary' />
          正在聆听… {interim || '请开始说话'}
        </p>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
        <Textarea
          ref={textareaRef}
          placeholder='输入你的问题，或点击麦克风语音输入…'
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          disabled={disabled}
          className='max-h-40 min-h-10'
        />

        <div className='flex items-center gap-1'>
          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept={ACCEPT}
            className='hidden'
            onChange={(event) => {
              addFiles(event.target.files)
              // 重置以便再次选择同一文件
              event.target.value = ''
            }}
          />
          <Button
            type='button'
            size='icon'
            variant='ghost'
            aria-label='添加附件'
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className='size-4' />
          </Button>

          <Button
            type='button'
            size='icon'
            variant={listening ? 'default' : 'ghost'}
            aria-label={listening ? '停止语音输入' : '语音输入'}
            disabled={disabled || !micSupported}
            onClick={() => (listening ? stop() : start())}
          >
            {listening ? (
              <MicOff className='size-4' />
            ) : (
              <Mic className='size-4' />
            )}
          </Button>

          <Button
            type='button'
            size='icon'
            variant='ghost'
            aria-label='实时语音通话'
            disabled={disabled}
            onClick={onOpenVoiceCall}
          >
            <AudioLines className='size-4' />
          </Button>

          <span className='ms-auto hidden text-xs text-muted-foreground sm:block'>
            Enter 发送 / Shift+Enter 换行
          </span>

          <Button type='submit' size='icon' disabled={!canSend}>
            <Send className='size-4' />
            <span className='sr-only'>发送</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
