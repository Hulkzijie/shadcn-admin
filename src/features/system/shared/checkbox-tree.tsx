import { useMemo, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type TreeNode } from './api'

/**
 * 勾选树节点。
 * 后端 Long 型 id 会序列化为字符串，这里统一用字符串保存，避免 19 位 id 精度丢失。
 */
export interface CheckboxTreeNode {
  id: string
  label: string
  children?: CheckboxTreeNode[]
}

/** 把后端菜单/部门树转换为字符串 id 的勾选树节点 */
// eslint-disable-next-line react-refresh/only-export-components
export function normalizeTree(
  nodes: TreeNode[] | undefined
): CheckboxTreeNode[] {
  if (!nodes?.length) return []
  return nodes.map((node) => ({
    id: String(node.id),
    label: node.label,
    children: node.children?.length ? normalizeTree(node.children) : undefined,
  }))
}

function collectIds(nodes: CheckboxTreeNode[]): string[] {
  return nodes.flatMap((node) => [node.id, ...collectIds(node.children ?? [])])
}

/** 父子联动时，根据子节点状态回写父节点 */
function syncAncestors(nodes: CheckboxTreeNode[], checked: Set<string>) {
  for (const node of nodes) {
    const children = node.children ?? []
    if (!children.length) continue
    syncAncestors(children, checked)
    if (children.every((child) => checked.has(child.id))) checked.add(node.id)
    else checked.delete(node.id)
  }
}

/** 非严格模式（父子联动）下，父节点选中即代表其子孙全部选中 */
// eslint-disable-next-line react-refresh/only-export-components
export function buildInitialChecked(
  nodes: CheckboxTreeNode[],
  checkedKeys: (number | string)[] | undefined,
  strict: boolean
) {
  const checked = new Set((checkedKeys ?? []).map(String))
  if (strict) return checked
  const expand = (list: CheckboxTreeNode[]) => {
    for (const node of list) {
      if (checked.has(node.id)) {
        collectIds(node.children ?? []).forEach((id) => checked.add(id))
      }
      expand(node.children ?? [])
    }
  }
  expand(nodes)
  // 回写父节点状态，保证仅勾选叶子时父节点也能正确显示/半选
  syncAncestors(nodes, checked)
  return checked
}

type CheckboxTreePanelProps = {
  nodes: CheckboxTreeNode[]
  checked: Set<string>
  onCheckedChange: (next: Set<string>) => void
  linked: boolean
  onLinkedChange: (linked: boolean) => void
  heightClassName?: string
}

export function CheckboxTreePanel({
  nodes,
  checked,
  onCheckedChange,
  linked,
  onLinkedChange,
  heightClassName = 'h-64',
}: CheckboxTreePanelProps) {
  const allIds = useMemo(() => collectIds(nodes), [nodes])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allIds))

  const allChecked = allIds.length > 0 && allIds.every((id) => checked.has(id))

  const toggleNode = (node: CheckboxTreeNode, next: boolean) => {
    const nextChecked = new Set(checked)
    if (linked) {
      collectIds([node]).forEach((id) => {
        if (next) nextChecked.add(id)
        else nextChecked.delete(id)
      })
      syncAncestors(nodes, nextChecked)
    } else if (next) {
      nextChecked.add(node.id)
    } else {
      nextChecked.delete(node.id)
    }
    onCheckedChange(nextChecked)
  }

  const toggleExpanded = (id: string) => {
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpanded(next)
  }

  const renderNodes = (list: CheckboxTreeNode[], depth: number): ReactNode =>
    list.map((node) => {
      const children = node.children ?? []
      const childIds = collectIds(children)
      const isChecked = checked.has(node.id)
      const indeterminate = !isChecked && childIds.some((id) => checked.has(id))
      const isOpen = expanded.has(node.id)
      return (
        <div key={node.id}>
          <div
            className='flex items-center gap-1.5 py-1 text-sm'
            style={{ paddingLeft: depth * 16 }}
          >
            {children.length > 0 ? (
              <button
                type='button'
                onClick={() => toggleExpanded(node.id)}
                className='text-muted-foreground'
              >
                {isOpen ? (
                  <ChevronDown className='size-4' />
                ) : (
                  <ChevronRight className='size-4' />
                )}
              </button>
            ) : (
              <span className='inline-block size-4' />
            )}
            <Checkbox
              checked={indeterminate ? 'indeterminate' : isChecked}
              onCheckedChange={(value) => toggleNode(node, value === true)}
            />
            <span className='select-none'>{node.label}</span>
          </div>
          {isOpen && renderNodes(children, depth + 1)}
        </div>
      )
    })

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-4 text-sm'>
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0'
          onClick={() => setExpanded(new Set(allIds))}
        >
          展开全部
        </Button>
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0'
          onClick={() => setExpanded(new Set())}
        >
          收起全部
        </Button>
        <Button
          type='button'
          variant='link'
          size='sm'
          className='h-auto p-0'
          onClick={() =>
            onCheckedChange(allChecked ? new Set() : new Set(allIds))
          }
        >
          {allChecked ? '全不选' : '全选'}
        </Button>
        <label className='ms-auto flex items-center gap-2'>
          <Checkbox
            checked={linked}
            onCheckedChange={(value) => onLinkedChange(value === true)}
          />
          父子联动
        </label>
      </div>
      <ScrollArea className={`${heightClassName} rounded-md border p-2`}>
        {nodes.length ? (
          renderNodes(nodes, 0)
        ) : (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            暂无数据
          </p>
        )}
      </ScrollArea>
    </div>
  )
}
