export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  timestamp: number
}

export type AiSession = {
  id: string
  conversationId: string
  sessionId: string
  taskId: string
  title: string
  createdAt: string
  messages: ChatMessage[]
}

export type CreateConversationResponse = {
  conversation_id: string
  session_id: string
  task_id: string
  title: string
  created_at: string
}

export type ConversationMessageResponse = {
  message_id: string
  task_id: string
  role: ChatRole
  content: string
  created_at: string
}

export type ConversationMessagesResponse = {
  items: ConversationMessageResponse[]
  next_before: string | null
}

export type ConversationSummary = {
  conversation_id: string
  session_id: string
  title: string
  last_message: string | null
  updated_at: string
}

export type ConversationListResponse = {
  items: ConversationSummary[]
}
