import {
  createConversation,
  deleteConversation,
  getConversationMessages,
  getConversations,
  sendChatMessage,
} from '@/features/ai-chat/lib/chat-service'
import type { QaAttachment, QaMessage, QaRole } from '../data/qa-types'

/** 智能问答与 AI 聊天复用同一套会话后端接口 */
export {
  createConversation,
  deleteConversation,
  getConversations,
  sendChatMessage,
}

/** 读取会话历史（历史消息不含附件信息，附件只在当前会话内存中展示） */
export async function loadMessages(
  conversationId: string
): Promise<QaMessage[]> {
  return getConversationMessages(conversationId)
}

/**
 * 把附件清单拼进提问文本。
 * TODO: 待后端提供面向问答的附件上传接口后，改为上传文件并传递文件 id。
 */
export function buildPrompt(
  content: string,
  attachments: QaAttachment[]
): string {
  if (attachments.length === 0) return content
  const lines = attachments.map(
    (file) => `- ${file.name}（${formatFileSize(file.size)}）`
  )
  return [content, '', '【本次提问的附件】', ...lines].join('\n')
}

/** 创建一条问答消息（id / timestamp 在此生成，避免组件内调用不纯函数） */
export function createQaMessage(
  role: QaRole,
  content: string,
  attachments?: QaAttachment[],
  viaVoice?: boolean
): QaMessage {
  return {
    id: createId(),
    role,
    content,
    timestamp: Date.now(),
    attachments:
      attachments && attachments.length > 0 ? attachments : undefined,
    viaVoice: viaVoice || undefined,
  }
}

/** 文件大小格式化，如 1.2 MB */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

/** 生成前端本地 id（消息 / 附件 / 草稿会话） */
export function createId(prefix?: string): string {
  return prefix ? `${prefix}-${crypto.randomUUID()}` : crypto.randomUUID()
}
