<template>
  <!-- 浮窗运行效果面板（可拖拽 + 8 向缩放） -->
  <div v-show="visible" ref="modalRef" class="absolute bg-white rounded-xl shadow-2xl border border-slate-300 flex flex-col z-30 overflow-hidden"
    :style="{ width: position.width + 'px', height: position.height + 'px', top: position.top + 'px', left: position.left + 'px' }">
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
import { ref, watch } from 'vue'
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
const originalHeight = ref(380)

const position = ref<DragResizePosition>({ left: 40, top: 60, width: 480, height: 380 })

// 运行按钮位于容器右下角（bottom-6 right-6，高约 42px）；
// 每次打开弹窗时默认吸附到按钮上方，避免初始状态遮挡编辑器
watch(() => props.visible, (isVisible) => {
  if (isVisible) positionAboveRunButton()
})

function positionAboveRunButton() {
  const container = modalRef.value?.parentElement
  if (!container) return
  const rect = container.getBoundingClientRect()

  const width = Math.max(280, Math.min(480, rect.width - 48))
  const top = Math.max(8, rect.height - 24 - 42 - 12 - position.value.height)
  const left = Math.max(8, rect.width - 24 - width)

  position.value.width = width
  position.value.top = top
  position.value.left = left
}

const { startDrag, startResize } = useDragResize({
  getElement: () => modalRef.value,
  getContainer: () => modalRef.value?.parentElement ?? null,
  position,
  minWidth: 350,
  minHeight: 200,
  isMinimized: () => isMinimized.value,
  onResizeEnd: () => {
    // 最小化状态下画布隐藏，无尺寸意义，恢复时另行通知
    if (!isMinimized.value) emit('resize-end')
  }
})

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
  if (isMinimized.value) {
    originalHeight.value = position.value.height
    position.value.height = 40
  } else {
    position.value.height = originalHeight.value
    // 恢复窗口后通知尺寸变化，画布需按新尺寸重绘
    emit('resize-end')
  }
}

// 暴露画布节点供外部执行器挂载
defineExpose({ canvasEl: canvasRef })
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
