import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { fastapiClient } from '@/lib/api/fastapi-client'
import type { PipelineDsl } from '../data/pipeline-types'

export type DryRunIssue = {
  code: string
  message: string
  nodeId?: string | null
}

export type DryRunValidation = {
  valid: boolean
  blocking: DryRunIssue[]
  warnings: DryRunIssue[]
}

export type DryRunArtifact = {
  artifactId: string
  nodeId: string
  artifactType: string
  name: string
  storageUrl: string
  sizeBytes: number
  meta: Record<string, unknown>
}

export type DryRunNodeRun = {
  nodeId: string
  /** 后端返回的字段名是 nodeKind，这里统一映射为 kind。 */
  kind: string
  label: string
  status: string
  attempt: number
  durationMs: number
  inputArtifactId?: string | null
  outputArtifactId?: string | null
  logsUrl?: string | null
  error?: { code?: string; message?: string } | null
  artifacts: DryRunArtifact[]
}

export type DryRunRun = {
  runId: string
  status: string
  progress: number
  currentNodeId?: string | null
  errorCode?: string | null
  errorMessage?: string | null
  traceId?: string
  startedAt?: number | null
  endedAt?: number | null
  nodeRuns: DryRunNodeRun[]
}

export type DryRunResult = {
  pipelineId: string
  validation: DryRunValidation
  run: DryRunRun
}

/** 试运行失败时保留后端错误码与阻断项，便于面板直接展示。 */
export class DryRunError extends Error {
  readonly code?: string
  readonly blocking: DryRunIssue[]

  constructor(
    message: string,
    options: { code?: string; blocking?: DryRunIssue[] } = {}
  ) {
    super(message)
    this.name = 'DryRunError'
    this.code = options.code
    this.blocking = options.blocking ?? []
  }
}

/**
 * 把画布 DSL 压缩成后端可解析的结构。
 * 后端只读取 data.kind / enabled / config / retry，position、样式等展示信息不提交。
 */
export function toDryRunDsl(dsl: PipelineDsl) {
  return {
    nodes: dsl.nodes.map((node) => ({
      id: node.id,
      data: {
        kind: node.data.kind,
        label: node.data.label,
        enabled: node.data.enabled,
        config: node.data.config ?? {},
        retry: node.data.retry ?? {},
      },
    })),
    edges: dsl.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      ...(typeof edge.label === 'string' ? { label: edge.label } : {}),
    })),
  }
}

/** 内网接口所需的身份头；未配置 VITE_INTERNAL_TOKEN 时由后端按本地开发模式放行。 */
function internalHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = import.meta.env.VITE_INTERNAL_TOKEN
  if (token) headers['X-Internal-Token'] = token

  const userId = useAuthStore.getState().auth.user?.userId
  if (userId !== undefined && userId !== null) {
    headers['X-User-Id'] = String(userId)
  }
  const tenantId = import.meta.env.VITE_APP_TENANT_ID
  if (tenantId) headers['X-Tenant-Id'] = tenantId
  return headers
}

function normalizeResult(data: DryRunResult): DryRunResult {
  return {
    pipelineId: data.pipelineId,
    validation: {
      valid: data.validation?.valid ?? false,
      blocking: data.validation?.blocking ?? [],
      warnings: data.validation?.warnings ?? [],
    },
    run: {
      ...data.run,
      nodeRuns: (data.run?.nodeRuns ?? []).map((node) => {
        // 后端 NodeRunRecord 的字段名是 nodeKind，这里统一映射为 kind。
        const raw = node as DryRunNodeRun & { nodeKind?: string }
        return {
          ...node,
          kind: raw.kind || raw.nodeKind || '',
          durationMs: node.durationMs ?? 0,
          artifacts: node.artifacts ?? [],
        }
      }),
    },
  }
}

function toDryRunError(error: unknown): DryRunError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data as
      | {
          code?: string
          message?: string
          detail?: { blocking?: DryRunIssue[] }
        }
      | undefined

    if (status === 401 || status === 403) {
      return new DryRunError(
        '试运行接口未授权：请配置 VITE_INTERNAL_TOKEN，或改由 Java 桥接层转发',
        { code: data?.code }
      )
    }
    const blocking = data?.detail?.blocking
    return new DryRunError(data?.message ?? error.message, {
      code: data?.code,
      blocking: Array.isArray(blocking) ? blocking : [],
    })
  }
  return new DryRunError(error instanceof Error ? error.message : '试运行失败')
}

/**
 * 试运行当前编排（PRD 8.6）。
 * 不传 fileText 时后端使用内置示例文本，保证保存前也能跑通链路。
 */
export async function runPipelineDryRun(params: {
  pipelineId: string
  dsl: PipelineDsl
  fileText?: string
  fileName?: string
  stopAtNodeId?: string
}): Promise<DryRunResult> {
  const body = {
    dsl: toDryRunDsl(params.dsl),
    // 试运行固定不写正式向量库
    writeVector: false,
    ...(params.fileText
      ? { fileText: params.fileText, fileName: params.fileName }
      : {}),
    ...(params.stopAtNodeId ? { stopAtNodeId: params.stopAtNodeId } : {}),
  }

  try {
    const { data } = await fastapiClient.post<DryRunResult>(
      `/internal/v1/kb-pipelines/${encodeURIComponent(params.pipelineId)}/dry-run`,
      body,
      { headers: internalHeaders(), timeout: 120_000 }
    )
    return normalizeResult(data)
  } catch (error) {
    throw toDryRunError(error)
  }
}
