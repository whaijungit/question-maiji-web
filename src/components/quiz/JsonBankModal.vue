<template>
  <!-- 自定义 JSON 题库弹窗 -->
  <div v-if="visible" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 class="font-bold text-sm md:text-base text-slate-800"><AppIcon name="code" :size="16" class="text-amber-600" /> 自定义 JSON 题库配置</h3>
        <button @click="emit('update:visible', false)" class="text-slate-400 hover:text-slate-600"><AppIcon name="x" :size="18" /></button>
      </div>

      <!-- Monaco JSON 编辑器 -->
      <div ref="jsonEditorHostRef" class="h-72 w-full rounded-xl border border-slate-800 overflow-hidden"></div>

      <div class="flex justify-end space-x-3 pt-2">
        <button @click="emit('update:visible', false)" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs">取消</button>
        <button @click="emit('apply')" class="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs">载入新题库</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useMonacoEditor } from '@/composables/useMonacoEditor'

const props = defineProps<{
  visible: boolean
  jsonText: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'update:jsonText', text: string): void
  (e: 'apply'): void
}>()

const jsonEditorHostRef = ref<HTMLElement | null>(null)

// JSON 编辑（无运行/注释快捷键；弹窗关闭销毁、打开重建；
// 字号不低于 16px，避免 iOS 聚焦时自动放大页面）
useMonacoEditor({
  host: jsonEditorHostRef,
  value: toRef(props, 'jsonText'),
  onChange: (code) => emit('update:jsonText', code),
  language: 'json',
  enableActions: false,
  fontSize: 16
})
</script>
