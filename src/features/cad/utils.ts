import L from 'leaflet'

let elementClickHandled = false
let elementIdSeed = 0

/** 阻止图元事件冒泡到地图，避免同时触发画布的空白点击逻辑 */
export function stopElementEvent(event: L.LeafletMouseEvent): void {
  if (event.originalEvent) {
    L.DomEvent.stopPropagation(event.originalEvent)
  }
}

/** 图元点击后置位，地图 click 消费后忽略本次点击，避免清空选中 */
export function markElementClick(): void {
  elementClickHandled = true
}

export function consumeElementClick(): boolean {
  const handled = elementClickHandled
  elementClickHandled = false
  return handled
}

export function createElementId(prefix = 'cad'): string {
  elementIdSeed += 1
  return `${prefix}-${Date.now().toString(36)}-${elementIdSeed}`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
