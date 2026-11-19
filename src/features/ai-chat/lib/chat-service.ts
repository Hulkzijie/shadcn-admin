import { useAuthStore } from '@/stores/auth-store'
import type {
  ChatMessage,
  ChatRole,
  ConversationListResponse,
  ConversationMessagesResponse,
  CreateConversationResponse,
} from '../data/chat-types'

/**
 * 会话服务：对接 Java 桥接的 `/ai/chat/stream`（SSE 透传 Python 智能面）。
 *
 * 后端当前只提供流式对话与知识库接口，没有会话/消息的增删查 API，
 * 因此会话列表与历史消息暂存在浏览器本地（按登录用户隔离），
 * `conversation_id` 直接作为 Python checkpointer 的 `sessionId`，保证多轮上下文连续。
 */

/** 与 axios 客户端保持一致，缺失会被后端鉴权拦截 */
const CLIENT_ID =
  import.meta.env.VITE_APP_CLIENT_ID ?? 'e5cd7e4891bf95d1d19206ce24a7b32e'

const STORAGE_PREFIX = 'wisecloud:ai-chat:v1'

type StoredMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

type StoredConversation = {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: StoredMessage[]
}

function storageKey(): string {
  const userId = useAuthStore.getState().auth.user?.userId
  return `${STORAGE_PREFIX}:${userId ?? 'anonymous'}`
}

function readAll(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(storageKey())
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as StoredConversation[]) : []
  } catch {
    return []
  }
}

function writeAll(conversations: StoredConversation[]): void {
  localStorage.setItem(storageKey(), JSON.stringify(conversations))
}

/** 创建一个持久化会话，返回的 ID 同时用作 checkpointer 的 thread_id。 */
export async function createConversation(
  title?: string
): Promise<CreateConversationResponse> {
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const conversation: StoredConversation = {
    id,
    title: title?.trim() || '新会话',
    createdAt: now,
    updatedAt: now,
    messages: [],
  }
  writeAll([...readAll(), conversation])
  return {
    conversation_id: id,
    session_id: id,
    task_id: '',
    title: conversation.title,
    created_at: now,
  }
}

/** 读取当前用户的历史会话列表，最近更新的在前。 */
export async function getConversations(): Promise<
  ConversationListResponse['items']
> {
  const items = [...readAll()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  )
  return items.map((conversation) => ({
    conversation_id: conversation.id,
    session_id: conversation.id,
    title: conversation.title,
    last_message:
      conversation.messages[conversation.messages.length - 1]?.content ?? null,
    updated_at: conversation.updatedAt,
  }))
}

/** 删除会话及其本地保存的历史消息。 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  writeAll(
    readAll().filter((conversation) => conversation.id !== conversationId)
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

/** 读取会话历史（按时间正序）。 */
export async function getConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const conversation = readAll().find((item) => item.id === conversationId)
  if (!conversation) return []
  const response: ConversationMessagesResponse = {
    items: conversation.messages.map((message) => ({
      message_id: message.id,
      task_id: '',
      role: message.role,
      content: message.content,
      created_at: message.createdAt,
    })),
    next_before: null,
  }
  return response.items.map((message) => ({
    id: message.message_id,
    role: message.role,
    content: message.content,
    timestamp: Date.parse(message.created_at) || Date.now(),
  }))
}

type ParsedFrame = { event: string; data: string }

function parseFrame(raw: string): ParsedFrame {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of raw.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart())
  }
  return { event, data: dataLines.join('\n') }
}

let messageSeq = 0

function nextMessageId(): string {
  messageSeq += 1
  return `msg-${Date.now()}-${messageSeq}`
}

/**
 * 发送消息并流式接收 AI 回复。
 *
 * 请求 `POST /ai/chat/stream`，SSE 事件契约：`start / token / citation /
 * tool_call / tool_result / end / error`；`token` 事件的 `content` 为增量片段，
 * 这里累加后通过 `onDelta` 回传完整文本，供界面做打字机效果。
 */
export async function sendChatMessage(
  conversationId: string,
  content: string,
  onDelta?: (content: string) => void
): Promise<string> {
  const conversations = readAll()
  const conversation = conversations.find((item) => item.id === conversationId)
  if (!conversation) throw new Error('会话不存在')

  const now = new Date().toISOString()
  conversation.messages.push({
    id: nextMessageId(),
    role: 'user',
    content,
    createdAt: now,
  })
  conversation.updatedAt = now
  writeAll(conversations)

  const baseUrl = import.meta.env.VITE_JAVA_API ?? '/java-api'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    clientid: CLIENT_ID,
  }
  const accessToken = useAuthStore.getState().auth.accessToken
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const response = await fetch(`${baseUrl}/ai/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId: conversationId, query: content }),
  })
  if (response.status === 401) throw new Error('登录状态已失效，请重新登录')
  if (!response.ok) throw new Error(`流式请求失败 (${response.status})`)

  const reader = response.body?.getReader()
  let answer = ''
  let streamError: string | null = null

  if (reader) {
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const frame = parseFrame(buffer.slice(0, boundary))
        buffer = buffer.slice(boundary + 2)
        if (frame.event === 'token') {
          const delta = (JSON.parse(frame.data || '{}') as { content?: string })
            .content
          if (delta) {
            answer += delta
            onDelta?.(answer)
          }
        } else if (frame.event === 'error') {
          const payload = JSON.parse(frame.data || '{}') as {
            code?: string
            message?: string
          }
          streamError = payload.message || payload.code || '对话生成失败'
        }
        boundary = buffer.indexOf('\n\n')
      }
    }
  }

  if (answer) {
    const latest = readAll()
    const target = latest.find((item) => item.id === conversationId)
    if (target) {
      const finishedAt = new Date().toISOString()
      target.messages.push({
        id: nextMessageId(),
        role: 'assistant',
        content: answer,
        createdAt: finishedAt,
      })
      target.updatedAt = finishedAt
      writeAll(latest)
    }
  }

  if (streamError) throw new Error(streamError)
  return answer
}
