// 通用浮窗拖拽 + 8 向缩放逻辑（与具体 UI 解耦）
import type { Ref } from 'vue'

export interface DragResizePosition {
  left: number
  top: number
  width: number
  height: number
}

export interface DragResizeOptions {
  /** 被拖拽/缩放的元素 */
  getElement: () => HTMLElement | null
  /** 约束容器（用于边界夹紧，通常为浮窗的定位父级） */
  getContainer: () => HTMLElement | null
  /** 元素位置状态（会被直接修改） */
  position: Ref<DragResizePosition>
  minWidth?: number
  minHeight?: number
  /** 最小化状态：折叠时高度固定为头部高度，仅允许拖拽移动 */
  isMinimized?: () => boolean
  /** 缩放手势结束回调（拖拽移动不会触发） */
  onResizeEnd?: () => void
}

export function useDragResize(options: DragResizeOptions) {
  const { getElement, getContainer, position, isMinimized } = options
  const minW = options.minWidth ?? 350
  const minH = options.minHeight ?? 200
  const minimizedH = 40

  let isMouseDown = false
  let handlerType = ''
  let startX = 0, startY = 0, startLeft = 0, startTop = 0, startWidth = 0, startHeight = 0

  const startDrag = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    initDragState(e, 'header')
  }

  const startResize = (e: MouseEvent, direction: string) => {
    initDragState(e, direction)
  }

  function initDragState(e: MouseEvent, type: string) {
    const el = getElement()
    if (!el) return
    isMouseDown = true
    handlerType = type
    startX = e.clientX
    startY = e.clientY
    startLeft = el.offsetLeft
    startTop = el.offsetTop
    startWidth = el.offsetWidth
    startHeight = el.offsetHeight

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onMouseMove(e: MouseEvent) {
    if (!isMouseDown) return
    const container = getContainer()
    if (!container) return
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    let newWidth = startWidth, newHeight = startHeight, newLeft = startLeft, newTop = startTop
    const minimized = isMinimized?.() ?? false
    const activeMinH = minimized ? minimizedH : minH

    switch (handlerType) {
      case 'header':
        newLeft = startLeft + dx
        newTop = startTop + dy
        break
      case 'e':
        newWidth = Math.max(minW, startWidth + dx)
        break
      case 'w':
        newWidth = Math.max(minW, startWidth - dx)
        if (startWidth - dx > minW) newLeft = startLeft + dx
        break
      case 's':
        newHeight = Math.max(activeMinH, startHeight + dy)
        break
      case 'n':
        newHeight = Math.max(activeMinH, startHeight - dy)
        if (startHeight - dy > activeMinH) newTop = startTop + dy
        break
      case 'se':
        newWidth = Math.max(minW, startWidth + dx)
        newHeight = Math.max(activeMinH, startHeight + dy)
        break
      case 'sw':
        newWidth = Math.max(minW, startWidth - dx)
        if (startWidth - dx > minW) newLeft = startLeft + dx
        newHeight = Math.max(activeMinH, startHeight + dy)
        break
      case 'ne':
        newWidth = Math.max(minW, startWidth + dx)
        newHeight = Math.max(activeMinH, startHeight - dy)
        if (startHeight - dy > activeMinH) newTop = startTop + dy
        break
      case 'nw':
        newWidth = Math.max(minW, startWidth - dx)
        if (startWidth - dx > minW) newLeft = startLeft + dx
        if (startHeight - dy > activeMinH) newTop = startTop + dy
        break
    }

    // 夹紧在容器边界内
    const containerRect = container.getBoundingClientRect()
    if (newLeft < 0) newLeft = 0
    if (newTop < 0) newTop = 0
    if (newLeft + newWidth > containerRect.width) newWidth = containerRect.width - newLeft
    if (newTop + newHeight > containerRect.height) newHeight = containerRect.height - newTop

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
