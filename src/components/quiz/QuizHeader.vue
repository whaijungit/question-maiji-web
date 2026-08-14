<template>
  <header class="bg-white border-b border-slate-200 h-14 px-4 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm z-20">
    <div class="flex items-center space-x-3">
      <div class="bg-amber-500 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
        <AppIcon name="graduation-cap" :size="16" />
      </div>
      <div class="hidden sm:block">
        <h1 class="font-bold text-slate-900 text-sm leading-tight">麦咭机器人编程题目系统</h1>
        <!-- <p class="text-[11px] text-slate-500">Python 海龟实操 (LSP 智能提示) 与单选校验</p> -->
      </div>
    </div>

    <div class="flex items-center space-x-3">
      <div class="flex items-center space-x-2">
        <label class="hidden md:inline text-xs font-semibold text-slate-500">当前大纲：</label>
        <select :value="activeCategoryIndex" @change="emit('switch-category', Number(($event.target as HTMLSelectElement).value))"
          class="bg-slate-50 border border-slate-300 text-slate-800 text-base rounded-xl focus:ring-2 focus:ring-amber-500 p-2 outline-none font-medium transition-all shadow-sm max-w-[180px] sm:max-w-[240px]">
          <option v-for="(cat, idx) in categories" :key="idx" :value="idx">
            {{ cat.category || `分类 ${idx + 1}` }}
          </option>
        </select>
      </div>

      <!-- 题目标题搜索入口（独立弹窗） -->
      <button @click="emit('open-search')" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-medium">
        <AppIcon name="search" :size="12" />
        <span class="hidden sm:inline">搜索题目</span>
      </button>

      <button @click="emit('open-config')" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors text-xs flex items-center gap-1.5 font-medium">
        <AppIcon name="settings" :size="12" />
        <span class="hidden sm:inline">题库配置</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { QuizCategory } from '@/types/quiz'

defineProps<{
  categories: QuizCategory[]
  activeCategoryIndex: number
}>()

const emit = defineEmits<{
  (e: 'switch-category', idx: number): void
  (e: 'open-config'): void
  (e: 'open-search'): void
}>()
</script>
