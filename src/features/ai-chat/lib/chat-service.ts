import { useAuthStore } from '@/stores/auth-store'
import { fastapiClient } from '@/lib/api/fastapi-client'
import type {
  ChatMessage,
  ChatRole,
  ConversationListResponse,
  ConversationMessagesResponse,
  CreateConversationResponse,
} from '../data/chat-types'

/** 创建一个持久化会话。会话 ID 必须由后端生成，不能使用前端自增 ID。 */
export async function createConversation(
  title?: string
): Promise<CreateConversationResponse> {
  const { data } = await fastapiClient.post<CreateConversationResponse>(
    '/api/conversations',
    title ? { title } : {}
  )
  return data
}

/** 进入聊天页面时读取当前用户的历史会话列表。 */
export async function getConversations(): Promise<
  ConversationListResponse['items']
> {
  const { data } =
    await fastapiClient.get<ConversationListResponse>('/api/conversations')
  return data.items
}

/** 删除会话及其服务端保存的全部历史消息。 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  await fastapiClient.delete(
    `/api/conversations/${encodeURIComponent(conversationId)}`
  )
}

/**
 * 创建一条聊天消息（id / timestamp 在此生成，避免组件内调用不纯函数）。
 */
export function createMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: Date.now(),
  }
}

/** 读取会话历史；历史以服务端 message_id 和 created_at 为准。 */
export async function getConversationMessages(
  conversationId: string,
  before?: string
): Promise<ChatMessage[]> {
  const { data } = await fastapiClient.get<ConversationMessagesResponse>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
    { params: { limit: 100, ...(before ? { before } : {}) } }
  )
  return data.items.map((message) => ({
    id: message.message_id,
    role: message.role,
    content: message.content,
    timestamp: Date.parse(message.created_at) || Date.now(),
  }))
}

/**
 * 发送消息并获取 AI 回复。
 * TODO: 接入真实 AI 接口时替换此实现，例如调用 OpenAI 兼容的
 * `/v1/chat/completions`（可通过 Vite dev server proxy 转发避免 API Key 暴露），
 * 将 messages 映射为 [{ role, content }] 后请求即可，无需改动页面组件。
 */
export async function sendChatMessage(
  conversationId: string,
  content: string,
  onDelta?: (content: string) => void
): Promise<string> {
  const { data } = await fastapiClient.post<{
    task_id: string
    assistant_message: { content: string }
  }>(`/api/conversations/${conversationId}/messages`, { content })

  const baseUrl = import.meta.env.VITE_FASTAPI_API ?? '/py-api'
  const headers: HeadersInit = { Accept: 'text/event-stream' }
  const accessToken = useAuthStore.getState().auth.accessToken
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(
    `${baseUrl}/api/conversations/stream/${encodeURIComponent(data.task_id)}`,
    { headers }
  )
  if (!response.ok) throw new Error(`流式请求失败 (${response.status})`)

  // SSE 事件以空行分隔；最终答案优先取 final 事件，兼容只返回 delta 的服务端。
  const reader = response.body?.getReader()
  if (!reader) return data.assistant_message.content
  const decoder = new TextDecoder()
  let buffer = ''
  let answer = ''
  let finalAnswer = ''

  const consume = (block: string) => {
    let event = 'message'
    let payload = ''
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim()
      if (line.startsWith('data:')) payload += line.slice(5).trim()
    }
    if (!payload) return
    try {
      const parsed = JSON.parse(payload) as { answer?: string; delta?: string }
      if (event === 'delta') {
        answer += parsed.delta ?? parsed.answer ?? ''
        onDelta?.(answer)
      }
      if (event === 'final') {
        finalAnswer = parsed.answer ?? ''
        onDelta?.(finalAnswer)
      }
    } catch {
      // 忽略不完整或非 JSON 的 SSE 数据块
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    blocks.forEach(consume)
    // 后端发送 final 后仍保持 SSE 连接，收到最终答案即可结束本次读取。
    if (finalAnswer) {
      await reader.cancel()
      break
    }
    if (done) break
  }
  if (buffer.trim()) consume(buffer)
  return finalAnswer || answer || data.assistant_message.content
}
