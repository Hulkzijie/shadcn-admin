export type QaRole = 'user' | 'assistant'

/** 提问框中添加的附件（图片等可预览文件保留本地对象 URL） */
export type QaAttachment = {
  id: string
  name: string
  size: number
  type: string
  /** 图片类附件的本地预览地址 */
  previewUrl?: string
}

export type QaMessage = {
  id: string
  role: QaRole
  content: string
  timestamp: number
  attachments?: QaAttachment[]
  /** 由语音输入或语音通话产生的消息 */
  viaVoice?: boolean
}

export type QaSession = {
  id: string
  conversationId: string
  sessionId: string
  title: string
  createdAt: string
  messages: QaMessage[]
}

/** 语音通话中的一轮问答，用于在通话界面内展示对话记录 */
export type QaVoiceExchange = {
  id: string
  question: string
  answer: string
}

/** 语音通话状态：聆听 / 思考 / 播报回答 */
export type QaVoicePhase = 'listening' | 'thinking' | 'speaking'
