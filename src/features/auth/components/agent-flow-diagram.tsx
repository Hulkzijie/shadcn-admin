import {
  Bot,
  Cpu,
  Database,
  FolderInput,
  Globe,
  MessagesSquare,
  Plug,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type FlowNode = {
  id: string
  label: string
  icon: LucideIcon
  /** 子节点在中心 Agent 坐标系中的位置 */
  x: number
  y: number
  /** 从中心 Agent 指向子节点的连线路径 */
  path: string
  /** 连线渐变方向（跟随路径走向） */
  gradient: 'left' | 'right' | 'down'
  /** 脉冲动画相对起点的延迟（秒） */
  begin: number
  /** 是否渲染为持续流动的虚线管线 */
  pipeline?: boolean
}

const flowNodes: FlowNode[] = [
  {
    id: 'ingestion',
    label: '知识入库',
    icon: FolderInput,
    x: -230,
    y: 0,
    path: 'M0 0 h-200',
    gradient: 'left',
    begin: 0,
    pipeline: true,
  },
  {
    id: 'retrieval',
    label: '检索',
    icon: Search,
    x: 0,
    y: 130,
    path: 'M0 0 v120 a10 10 0 0 0 10 10 h0.01',
    gradient: 'down',
    begin: 0.16,
  },
  {
    id: 'mcp',
    label: 'MCP',
    icon: Plug,
    x: -270,
    y: -100,
    path: 'M0 -25 h-130 a10 10 0 0 1 -10 -10 v-55 a10 10 0 0 0 -10 -10 h-125',
    gradient: 'left',
    begin: 0.32,
  },
  {
    id: 'web-search',
    label: '联网搜索',
    icon: Globe,
    x: 240,
    y: -10,
    path: 'M0 -10 h240',
    gradient: 'right',
    begin: 0.48,
    pipeline: true,
  },
  {
    id: 'models',
    label: '模型',
    icon: Cpu,
    x: -200,
    y: 130,
    path: 'M0 40 h-100 a10 10 0 0 0 -10 10 v70 a10 10 0 0 1 -10 10 h-80',
    gradient: 'left',
    begin: 0.64,
  },
  {
    id: 'dataset',
    label: '数据集',
    icon: Database,
    x: 220,
    y: 120,
    path: 'M0 35 h110 a10 10 0 0 1 10 10 v75 a10 10 0 0 0 10 10 h100',
    gradient: 'right',
    begin: 0.8,
  },
  {
    id: 'chat',
    label: '对话',
    icon: MessagesSquare,
    x: 210,
    y: -100,
    path: 'M30 0 v-60 a10 10 0 0 1 10 -10 h90 a10 10 0 0 0 10 -10 v-10 a10 10 0 0 1 10 -10 h60',
    gradient: 'right',
    begin: 0.96,
  },
]

const connectorGradients = {
  left: 'url(#wc-flow-left)',
  right: 'url(#wc-flow-right)',
  down: 'url(#wc-flow-down)',
}

const pulseGradients = {
  left: 'url(#wc-pulse-left)',
  right: 'url(#wc-pulse-right)',
  down: 'url(#wc-pulse-down)',
}

/**
 * 登录页左侧的 Agent 编排动效图：
 * 渐变数据流 + 持续脉冲输送 + 呼吸光晕，展示一次 Agent 执行链路。
 */
export function AgentFlowDiagram({ className }: { className?: string }) {
  return (
    <svg
      viewBox='-300 -140 600 310'
      fill='none'
      preserveAspectRatio='xMidYMid meet'
      strokeLinecap='round'
      strokeLinejoin='round'
      role='img'
      aria-label='AI Agent 编排示意：从中心 Agent 出发，连接知识入库、检索、MCP、联网搜索、模型、数据集与对话'
      className={cn('block h-auto w-full', className)}
    >
      <defs>
        {/* 基础连线渐变：从主色淡出 */}
        <linearGradient id='wc-flow-left' x1='1' y1='0.5' x2='0' y2='0.5'>
          <stop stopColor='#8b6ef2' />
          <stop offset='0.75' stopColor='#8b6ef2' stopOpacity='0.45' />
          <stop offset='1' stopColor='#8b6ef2' stopOpacity='0' />
        </linearGradient>
        <linearGradient id='wc-flow-right' x1='0' y1='0.5' x2='1' y2='0.5'>
          <stop stopColor='#8b6ef2' />
          <stop offset='0.75' stopColor='#8b6ef2' stopOpacity='0.45' />
          <stop offset='1' stopColor='#8b6ef2' stopOpacity='0' />
        </linearGradient>
        <linearGradient id='wc-flow-down' x1='0.5' y1='0' x2='0.5' y2='1'>
          <stop stopColor='#8b6ef2' />
          <stop offset='0.5' stopColor='#8b6ef2' stopOpacity='0.45' />
          <stop offset='1' stopColor='#8b6ef2' stopOpacity='0' />
        </linearGradient>

        {/* 脉冲高亮渐变：保持可见度，末端不透明度更高 */}
        <linearGradient id='wc-pulse-left' x1='1' y1='0.5' x2='0' y2='0.5'>
          <stop stopColor='#e9e2ff' />
          <stop offset='0.6' stopColor='#b9a5ff' />
          <stop offset='1' stopColor='#8b6ef2' />
        </linearGradient>
        <linearGradient id='wc-pulse-right' x1='0' y1='0.5' x2='1' y2='0.5'>
          <stop stopColor='#e9e2ff' />
          <stop offset='0.6' stopColor='#b9a5ff' />
          <stop offset='1' stopColor='#8b6ef2' />
        </linearGradient>
        <linearGradient id='wc-pulse-down' x1='0.5' y1='0' x2='0.5' y2='1'>
          <stop stopColor='#e9e2ff' />
          <stop offset='0.6' stopColor='#b9a5ff' />
          <stop offset='1' stopColor='#8b6ef2' />
        </linearGradient>

        {/* 中心 Agent 与子节点配色 */}
        <linearGradient id='wc-agent-fill' x1='0' y1='0' x2='0' y2='1'>
          <stop stopColor='#2d3044' />
          <stop offset='1' stopColor='#1d1f2c' />
        </linearGradient>
        <linearGradient id='wc-agent-stroke' x1='0' y1='0' x2='1' y2='1'>
          <stop stopColor='#a48fff' />
          <stop offset='1' stopColor='#6e56cf' />
        </linearGradient>
        <linearGradient id='wc-agent-icon' x1='0' y1='0' x2='1' y2='1'>
          <stop stopColor='#e2d9ff' />
          <stop offset='1' stopColor='#8b6ef2' />
        </linearGradient>
        <linearGradient id='wc-node-icon' x1='0' y1='0' x2='0' y2='1'>
          <stop stopColor='#d3d6de' />
          <stop offset='1' stopColor='#6f7482' />
        </linearGradient>

        {/* 中心 Agent 呼吸光晕 */}
        <filter
          id='wc-breathing'
          x='-100%'
          y='-100%'
          width='300%'
          height='300%'
        >
          <feGaussianBlur stdDeviation='12'>
            <animate
              attributeName='stdDeviation'
              values='10;18;10'
              dur='5s'
              repeatCount='indefinite'
              calcMode='spline'
              keyTimes='0;0.5;1'
              keySplines='0.5 0 0.5 1;0.5 0 0.5 1'
            />
          </feGaussianBlur>
        </filter>

        {/* 脉冲硬发光 */}
        <filter
          id='wc-hard-glow'
          x='-100%'
          y='-100%'
          width='300%'
          height='300%'
          filterUnits='objectBoundingBox'
          primitiveUnits='userSpaceOnUse'
        >
          <feMorphology in='SourceGraphic' operator='dilate' radius='2' />
          <feGaussianBlur stdDeviation='4' />
          <feColorMatrix
            type='matrix'
            values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'
          />
          <feBlend in2='SourceGraphic' mode='lighten' />
        </filter>

        {/* 子节点顶部柔光斑 */}
        <filter
          id='wc-top-spotlight'
          x='-100%'
          y='-100%'
          width='300%'
          height='300%'
          filterUnits='objectBoundingBox'
          primitiveUnits='userSpaceOnUse'
        >
          <feSpecularLighting
            specularConstant='1.4'
            specularExponent='3'
            lightingColor='#a48fff'
            result='light'
          >
            <feSpotLight
              x='0'
              y='-80'
              z='200'
              pointsAtX='0'
              pointsAtY='-85'
              pointsAtZ='0'
              limitingConeAngle='15'
            >
              <animate
                attributeName='z'
                values='150;170;150'
                dur='5s'
                repeatCount='indefinite'
                calcMode='spline'
                keyTimes='0;0.5;1'
                keySplines='0.5 0 0.5 1;0.5 0 0.5 1'
              />
            </feSpotLight>
          </feSpecularLighting>
          <feGaussianBlur in='light' stdDeviation='10' result='blurredLight' />
          <feComposite in='blurredLight' in2='SourceGraphic' operator='atop' />
        </filter>
      </defs>

      {/* 基础连线：持续流动的管线 + 静态渐变连线 */}
      <g strokeWidth='1'>
        {flowNodes.map((node) => (
          <path
            key={node.id}
            d={node.path}
            stroke={connectorGradients[node.gradient]}
            strokeDasharray={node.pipeline ? '6 6' : undefined}
          >
            {node.pipeline && (
              <animate
                attributeName='stroke-dashoffset'
                values='100%;0%'
                dur='24s'
                repeatCount='indefinite'
              />
            )}
          </path>
        ))}
      </g>

      {/* 脉冲信号：沿各分支错时游走，模拟一次完整的 Agent 执行 */}
      <g
        strokeWidth='1.6'
        strokeDasharray='12 100%'
        strokeDashoffset='100%'
        filter='url(#wc-hard-glow)'
      >
        {flowNodes.map((node) => (
          <path
            key={node.id}
            d={node.path}
            stroke={pulseGradients[node.gradient]}
          >
            <animate
              id={node.begin === 0 ? 'wc-pulse-cycle' : undefined}
              attributeName='stroke-dashoffset'
              values='100%;0%'
              dur='3.2s'
              begin={
                node.begin === 0
                  ? '0s; wc-pulse-cycle.end+2.6s'
                  : `wc-pulse-cycle.begin+${node.begin}s`
              }
            />
          </path>
        ))}
      </g>

      {/* 中心 Agent */}
      <g>
        <rect
          x='-53'
          y='-53'
          width='106'
          height='106'
          rx='28'
          fill='#6e56cf'
          opacity='0.5'
          filter='url(#wc-breathing)'
        />
        <rect
          x='-50'
          y='-50'
          width='100'
          height='100'
          rx='22'
          fill='url(#wc-agent-fill)'
          stroke='url(#wc-agent-stroke)'
          strokeWidth='1.2'
        />
        <Bot
          x={-20}
          y={-36}
          width={40}
          height={40}
          stroke='url(#wc-agent-icon)'
          strokeWidth={1.4}
        />
        <text
          y={26}
          textAnchor='middle'
          fill='#d7d8de'
          fontSize={12}
          fontWeight={500}
        >
          AI Agent
        </text>
      </g>

      {/* 子节点 */}
      {flowNodes.map((node) => (
        <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
          <g filter='url(#wc-top-spotlight)'>
            <rect
              x='-30'
              y='-30'
              width='60'
              height='60'
              rx='16'
              fill='#232532'
              stroke='#ffffff1f'
            />
          </g>
          <node.icon
            x={-15}
            y={-27}
            width={30}
            height={30}
            stroke='url(#wc-node-icon)'
            strokeWidth={1.5}
          />
          <text y={19} textAnchor='middle' fill='#8b8d98' fontSize={11}>
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
