<template>
  <!-- 浮窗运行效果面板（百分比定位：容器随窗口变化时按比例联动；可拖拽 + 8 向缩放 + 最小化） -->
  <div v-show="visible" ref="modalRef" class="absolute bg-white rounded-xl shadow-2xl border border-slate-300 flex flex-col z-30 overflow-hidden"
    :style="{ width: position.width + '%', height: position.height + '%', top: position.top + '%', left: position.left + '%' }">
    <div class="resizer n" @mousedown.prevent="startResize($event, 'n')"></div>
    <div class="resizer s" @mousedown.prevent="startResize($event, 's')"></div>
    <div class="resizer e" @mousedown.prevent="startResize($event, 'e')"></div>
    <div class="resizer w" @mousedown.prevent="startResize($event, 'w')"></div>
    <div class="resizer nw" @mousedown.prevent="startResize($event, 'nw')"></div>
    <div class="resizer ne" @mousedown.prevent="startResize($event, 'ne')"></div>
    <div class="resizer sw" @mousedown.prevent="startResize($event, 'sw')"></div>
    <div class="resizer se" @mousedown.prevent="startResize($event, 'se')"></div>

    <div @mousedown.prevent="startDrag" class="h-10 bg-slate-100 border-b border-slate-200 px-3 flex items-center justify-between cursor-move flex-shrink-0 select-none">
      <span class="text-xs font-bold text-slate-700 flex items-center gap-1.5">
        <AppIcon name="palette" :size="12" class="text-amber-600" />
        <span>海龟绘图运行效果</span>
      </span>
      <div class="flex items-center space-x-1">
        <button @click="toggleMinimize" class="w-6 h-6 rounded hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">
          <AppIcon name="minus" :size="12" />
        </button>
        <button @click="emit('close')" class="w-6 h-6 rounded hover:bg-rose-100 hover:text-rose-600 text-slate-500 flex items-center justify-center text-xs">
          <AppIcon name="x" :size="12" />
        </button>
      </div>
    </div>

    <!-- 画布目标：灰色底 + 网格背景（Skulpt 画布透明时网格透出） -->
    <div v-show="!isMinimized" ref="canvasRef" class="flex-1 bg-slate-100 relative overflow-hidden turtle-grid"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useDragResize, type DragResizePosition } from '@/composables/useDragResize'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  /** 弹窗尺寸变化结束（父级可据此重新渲染画布） */
  (e: 'resize-end'): void
}>()

const modalRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

const isMinimized = ref(false)
/** 最小化前的原始高度（百分比） */
const originalHeight = ref(50)

// 位置/尺寸均为相对容器的百分比（打开时会重新定位到运行按钮上方）
const position = ref<DragResizePosition>({ left: 30, top: 30, width: 40, height: 50 })

// 每次打开弹窗时默认吸附到容器左下角
watch(() => props.visible, (isVisible) => {
  if (isVisible) positionBottomLeft()
})

function getContainerRect() {
  const container = modalRef.value?.parentElement
  if (!container) return null
  const rect = container.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 ? rect : null
}

function positionBottomLeft() {
  const rect = getContainerRect()
  if (!rect) return

  // 默认宽度 70%（容器百分比）、高度 200px，吸附左下角，距边缘 12px
  const heightPx = Math.min(200, rect.height - 24)
  const widthPct = Math.min(70, 100 - (24 / rect.width) * 100)

  position.value.width = widthPct
  position.value.height = (heightPx / rect.height) * 100
  position.value.left = (12 / rect.width) * 100
  position.value.top = ((rect.height - 12 - heightPx) / rect.height) * 100
}

const { startDrag, startResize } = useDragResize({
  getContainer: () => modalRef.value?.parentElement ?? null,
  position,
  minWidth: 120,
  minHeight: 120,
  isMinimized: () => isMinimized.value,
  onResizeEnd: () => {
    // 最小化状态下画布隐藏，无尺寸意义，恢复时另行通知
    if (!isMinimized.value) emit('resize-end')
  }
})

function toggleMinimize() {
  const rect = getContainerRect()
  isMinimized.value = !isMinimized.value
  if (isMinimized.value) {
    originalHeight.value = position.value.height
    if (rect) position.value.height = Math.min(position.value.height, (40 / rect.height) * 100)
  } else {
    position.value.height = originalHeight.value
    // 恢复窗口后通知尺寸变化，画布需按新尺寸重绘
    emit('resize-end')
  }
}

// 容器（编辑器区域）随窗口变化时，通知父级按新尺寸重绘画布（防抖 + 跳过首次触发）
let containerObserver: ResizeObserver | undefined
let resizeTimer: number | undefined
watch(() => props.visible, (visible) => {
  containerObserver?.disconnect()
  containerObserver = undefined
  if (visible) {
    const container = modalRef.value?.parentElement
    if (!container) return
    let isFirst = true
    containerObserver = new ResizeObserver(() => {
      if (isFirst) {
        isFirst = false
        return
      }
      if (resizeTimer !== undefined) clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (!isMinimized.value) emit('resize-end')
      }, 300)
    })
    containerObserver.observe(container)
  }
})

onBeforeUnmount(() => {
  containerObserver?.disconnect()
  if (resizeTimer !== undefined) clearTimeout(resizeTimer)
})

/** 从最小化状态还原（代码运行完成后自动展开；未最小化时不做任何事） */
function restore() {
  if (!isMinimized.value) return
  isMinimized.value = false
  position.value.height = originalHeight.value
  // 画布重新可见且尺寸恢复：通知父级按新尺寸重绘
  emit('resize-end')
}

// 暴露画布节点与还原方法供外部使用
defineExpose({ canvasEl: canvasRef, restore })
</script>

<style scoped>
/* 画布区网格背景（20px 方格） */
.turtle-grid {
  background-image:
    linear-gradient(to right, rgba(100, 116, 139, 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(100, 116, 139, 0.25) 1px, transparent 1px);
  background-size: 20px 20px;
}

.resizer { position: absolute; background: transparent; z-index: 1001; }
.resizer.n { top: -4px; left: 0; width: 100%; height: 8px; cursor: n-resize; }
.resizer.s { bottom: -4px; left: 0; width: 100%; height: 8px; cursor: s-resize; }
.resizer.e { right: -4px; top: 0; width: 8px; height: 100%; cursor: e-resize; }
.resizer.w { left: -4px; top: 0; width: 8px; height: 100%; cursor: w-resize; }
.resizer.nw { top: -6px; left: -6px; width: 12px; height: 12px; cursor: nw-resize; }
.resizer.ne { top: -6px; right: -6px; width: 12px; height: 12px; cursor: ne-resize; }
.resizer.sw { bottom: -6px; left: -6px; width: 12px; height: 12px; cursor: sw-resize; }
.resizer.se { bottom: -6px; right: -6px; width: 12px; height: 12px; cursor: se-resize; }
</style>
