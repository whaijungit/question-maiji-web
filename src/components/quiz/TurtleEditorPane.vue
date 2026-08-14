<template>
  <!-- 模式 A：海龟编辑器 LSP 分屏视图 -->
  <div class="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 overflow-hidden">

    <!-- 左栏：Monaco Python 海龟编辑器 -->
    <div class="lg:col-span-7 h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      <div class="h-10 bg-slate-50 border-b border-slate-200 px-3 flex items-center justify-between text-xs flex-shrink-0">
        <div class="flex items-center space-x-2 text-slate-700 font-medium">
          <AppIcon name="code" :size="12" class="text-amber-600" />
          <span class="text-amber-600 space-x-2 text-slate-700">海龟智能编辑器</span>
        </div>
        <button @click="emit('reset-code')" class="text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1">
          <AppIcon name="rotate-cw" :size="12" />
          <span>重置代码</span>
        </button>
      </div>

      <!-- Monaco 挂载节点 -->
      <div ref="editorHostRef" class="flex-1 min-h-0 w-full h-full relative"></div>

      <!-- 运行按钮 -->
      <button @click="runPython" class="absolute bottom-6 right-6 bg-[#ff8c1a] hover:bg-[#d97e00] text-white font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2 z-20 text-xs md:text-sm">
        <AppIcon name="play" :size="14" />
        <span>运行代码</span>
      </button>

      <!-- 浮窗运行效果面板 -->
      <TurtleCanvasModal ref="canvasModalRef" :visible="isModalVisible" @close="closeModal" @resize-end="handleResizeEnd" />
    </div>

    <!-- 右栏：题目描述与参考 -->
    <div class="lg:col-span-5 h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
        <span class="bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-lg text-xs border border-amber-200">
          题目 #{{ question?.id || (activeQuestionIndex + 1) }}
        </span>
        <span class="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-lg text-xs border border-purple-200">
          海龟实操题 (LSP)
        </span>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar py-3 space-y-4">
        <h2 class="text-sm md:text-base font-semibold text-slate-800 leading-relaxed">
          {{ question?.title }}
        </h2>

        <div v-if="answerRecord.submitted" class="bg-slate-50 border border-amber-200 rounded-xl p-3.5 space-y-3">
          <div class="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <AppIcon name="circle-check" :size="12" class="text-amber-600" />
            <span>参考答案与自动校验面板</span>
          </div>
          <div v-if="question?.referenceCode" class="space-y-1">
            <div class="flex items-center justify-between text-[11px] text-slate-500">
              <span class="font-semibold text-slate-600">💡 参考标准代码：</span>
              <button @click="copyRefCode(question.referenceCode)" class="text-amber-600 hover:underline flex items-center gap-1">
                <AppIcon name="copy" :size="11" /> 复制
              </button>
            </div>
            <pre class="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-36 custom-scrollbar">{{ question.referenceCode }}</pre>
          </div>

          <div class="pt-2 border-t border-slate-200 space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-slate-600">🤖 自动校验：编辑器代码与参考答案比对</span>
              <button @click="autoVerify"
                class="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500 hover:bg-purple-600 text-white transition-all flex items-center gap-1">
                <AppIcon name="rotate-cw" :size="11" />
                重新校验
              </button>
            </div>
            <p v-if="verifyError" class="text-[11px] text-rose-600">{{ verifyError }}</p>
            <p v-else-if="verifyResult" :class="['text-[11px] font-bold flex items-center gap-1', verifyResult.matched ? 'text-emerald-700' : 'text-rose-600']">
              <AppIcon :name="verifyResult.matched ? 'circle-check' : 'circle-x'" :size="12" />
              参考答案覆盖 {{ Math.round(verifyResult.similarity * 100) }}%，判定：{{ verifyResult.matched ? '与答案一致' : '与答案不一致' }}
            </p>
          </div>
        </div>
      </div>

      <QuestionNavFooter :submitted="answerRecord.submitted" submit-label="提交并解锁参考"
        @prev="emit('prev')" @submit="emit('submit')" @next="emit('next')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRef, nextTick, watch } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import QuestionNavFooter from './QuestionNavFooter.vue'
import TurtleCanvasModal from './TurtleCanvasModal.vue'
import { useMonacoEditor } from '@/composables/useMonacoEditor'
import { useToast } from '@/composables/useToast'
import { TurtleRunner } from '@/utils/turtleRunner'
import { verifyCodeAgainstReference, type VerifyResult } from '@/utils/verifyCode'
import type { QuizQuestion, AnswerRecord } from '@/types/quiz'

const props = defineProps<{
  code: string
  question: QuizQuestion | undefined
  answerRecord: AnswerRecord
  activeQuestionIndex: number
}>()

const emit = defineEmits<{
  (e: 'update:code', code: string): void
  (e: 'reset-code'): void
  (e: 'mark-self-grade', isCorrect: boolean): void
  (e: 'prev'): void
  (e: 'submit'): void
  (e: 'next'): void
}>()

const editorHostRef = ref<HTMLElement | null>(null)
const canvasModalRef = ref<InstanceType<typeof TurtleCanvasModal> | null>(null)
const isModalVisible = ref(false)

// 自动校验状态
const verifyResult = ref<VerifyResult | null>(null)
const verifyError = ref('')

const toast = useToast()

const { getValue } = useMonacoEditor({
  host: editorHostRef,
  value: toRef(props, 'code'),
  onChange: (code) => emit('update:code', code),
  onRun: runPython
})

/** 最近一次成功发起运行的代码（用于弹窗尺寸变化后重绘） */
const lastRunCode = ref<string | null>(null)

function runPython() {
  lastRunCode.value = getValue()
  executeCode(lastRunCode.value)
}

/** 执行代码到浮窗画布；silent 用于尺寸重绘等场景，不弹提示 */
function executeCode(code: string, silent = false) {
  isModalVisible.value = true
  nextTick(() => {
    TurtleRunner.run({
      code,
      targetCanvas: canvasModalRef.value?.canvasEl ?? null,
      onPrint: (text) => console.log('Python Print:', text),
      onSuccess: () => {
        if (!silent) toast.success('代码运行完成')
      },
      onError: (err) => {
        console.error('Python Error:', err)
        if (!silent) toast.error('运行出错：' + (err.length > 100 ? err.slice(0, 100) + '…' : err))
      }
    })
  })
}

/** 弹窗尺寸变化后，按新尺寸静默重跑上次代码，让画布宽高跟随 */
function handleResizeEnd() {
  if (lastRunCode.value === null) return
  nextTick(() => executeCode(lastRunCode.value!, true))
}

function closeModal() {
  isModalVisible.value = false
  TurtleRunner.stop()
}

function copyRefCode(code: string) {
  navigator.clipboard
    .writeText(code)
    .then(() => toast.success('参考代码已复制到剪贴板！'))
    .catch(() => toast.error('复制失败，请手动复制'))
}

function autoVerify() {
  const refCode = props.question?.referenceCode
  if (!refCode) {
    verifyError.value = '该题没有参考答案代码，无法校验'
    return
  }
  verifyError.value = ''
  const result = verifyCodeAgainstReference(getValue(), refCode)
  verifyResult.value = result
  // 校验结果直接写入判分（替换原手动判定）
  emit('mark-self-grade', result.matched)
}

// 提交解锁参考后自动执行一次校验
watch(() => props.answerRecord.submitted, (submitted) => {
  if (submitted) autoVerify()
})
</script>
