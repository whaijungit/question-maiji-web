// 通用浮窗拖拽 + 8 向缩放逻辑（百分比制：位置/尺寸均相对容器 0-100%，
// 容器随窗口变化时浮窗按比例联动，不会跑出可视区域）
import type { Ref } from 'vue'

export interface DragResizePosition {
  /** 相对容器宽度的百分比 0-100 */
  left: number
  /** 相对容器高度的百分比 0-100 */
  top: number
  /** 相对容器宽度的百分比 0-100 */
  width: number
  /** 相对容器高度的百分比 0-100 */
  height: number
}

export interface DragResizeOptions {
  /** 约束容器（百分比参照物，用于换算与边界夹紧） */
  getContainer: () => HTMLElement | null
  /** 元素位置状态（百分比制，会被直接修改） */
  position: Ref<DragResizePosition>
  /** 最小宽度（px） */
  minWidth?: number
  /** 最小高度（px） */
  minHeight?: number
  /** 最小化状态：折叠时高度固定为头部高度，仅允许拖拽移动 */
  isMinimized?: () => boolean
  /** 缩放手势结束回调（拖拽移动不会触发） */
  onResizeEnd?: () => void
}

export function useDragResize(options: DragResizeOptions) {
  const { getContainer, position, isMinimized } = options
  const minW = options.minWidth ?? 350
  const minH = options.minHeight ?? 200

  let isMouseDown = false
  let handlerType = ''
  // 拖拽起始值：鼠标坐标（px）与位置状态（百分比）
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, startWidth = 0, startHeight = 0

  const startDrag = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    initDragState(e, 'header')
  }

  const startResize = (e: MouseEvent, direction: string) => {
    initDragState(e, direction)
  }

  function initDragState(e: MouseEvent, type: string) {
    isMouseDown = true
    handlerType = type
    startX = e.clientX
    startY = e.clientY
    startLeft = position.value.left
    startTop = position.value.top
    startWidth = position.value.width
    startHeight = position.value.height

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    if (!isMouseDown) return
    const container = getContainer()
    if (!container) return
    const rect = container.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    // 鼠标位移换算为容器百分比
    const dxPct = ((e.clientX - startX) / rect.width) * 100
    const dyPct = ((e.clientY - startY) / rect.height) * 100
    // 最小尺寸（px）换算为容器百分比
    const minWPct = Math.min(100, (minW / rect.width) * 100)
    const minHPct = Math.min(100, (minH / rect.height) * 100)

    let newWidth = startWidth, newHeight = startHeight, newLeft = startLeft, newTop = startTop
    const minimized = isMinimized?.() ?? false

    switch (handlerType) {
      case 'header':
        newLeft = startLeft + dxPct
        newTop = startTop + dyPct
        break
      case 'e':
        newWidth = Math.max(minWPct, startWidth + dxPct)
        break
      case 'w':
        newWidth = Math.max(minWPct, startWidth - dxPct)
        if (startWidth - dxPct > minWPct) newLeft = startLeft + dxPct
        break
      case 's':
        newHeight = Math.max(minHPct, startHeight + dyPct)
        break
      case 'n':
        newHeight = Math.max(minHPct, startHeight - dyPct)
        if (startHeight - dyPct > minHPct) newTop = startTop + dyPct
        break
      case 'se':
        newWidth = Math.max(minWPct, startWidth + dxPct)
        newHeight = Math.max(minHPct, startHeight + dyPct)
        break
      case 'sw':
        newWidth = Math.max(minWPct, startWidth - dxPct)
        if (startWidth - dxPct > minWPct) newLeft = startLeft + dxPct
        newHeight = Math.max(minHPct, startHeight + dyPct)
        break
      case 'ne':
        newWidth = Math.max(minWPct, startWidth + dxPct)
        newHeight = Math.max(minHPct, startHeight - dyPct)
        if (startHeight - dyPct > minHPct) newTop = startTop + dyPct
        break
      case 'nw':
        newWidth = Math.max(minWPct, startWidth - dxPct)
        if (startWidth - dxPct > minWPct) newLeft = startLeft + dxPct
        if (startHeight - dyPct > minHPct) newTop = startTop + dyPct
        break
    }

    // 夹紧在容器边界内（百分比空间）
    newWidth = Math.min(100, newWidth)
    newHeight = Math.min(100, newHeight)
    newLeft = Math.min(Math.max(0, newLeft), Math.max(0, 100 - newWidth))
    newTop = Math.min(Math.max(0, newTop), Math.max(0, 100 - newHeight))

    position.value.left = newLeft
    position.value.top = newTop
    position.value.width = newWidth
    // 最小化状态下只允许通过拖拽标题栏移动，高度保持不变
    if (!minimized || handlerType === 'header') {
      position.value.height = newHeight
    }
  }

  function onMouseUp() {
    isMouseDown = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    // 缩放结束通知（拖拽标题栏移动不算）
    if (handlerType !== 'header') {
      options.onResizeEnd?.()
    }
  }

  return { startDrag, startResize }
}
