<template>
  <div class="h-screen max-h-screen overflow-hidden flex flex-col bg-slate-100 text-slate-800" data-theme="purple">

    <!-- 1. 顶栏 Navigation Header -->
    <QuizHeader :categories="categories" :active-category-index="activeCategoryIndex"
      @switch-category="switchCategory" @open-config="showJsonModal = true" @open-search="showSearchModal = true" />

    <!-- 2. 主界面容器：按题型分发到对应面板 -->
    <main class="flex-1 min-h-0 p-3 md:p-4 overflow-hidden relative">

      <!-- 模式 A：海龟编辑器 LSP 分屏视图 -->
      <TurtleEditorPane v-if="currentQuestion?.type === 'iframe_editor'" :key="currentAnswerKey"
        v-model:code="currentEditorCode" :question="currentQuestion" :answer-record="currentAnswerRecord"
        :active-question-index="activeQuestionIndex"
        @reset-code="resetEditorCode" @mark-self-grade="markSelfGrade"
        @prev="prevQuestion" @submit="handleSubmit" @next="nextQuestion" />

      <!-- 模式 B：单选题居中卡片视图 -->
      <SingleChoicePane v-else :question="currentQuestion" :answer-record="currentAnswerRecord"
        :active-question-index="activeQuestionIndex"
        @select="selectChoice" @prev="prevQuestion" @submit="handleSubmit" @next="nextQuestion" />
    </main>

    <!-- 3. 题号 Pills 导航栏（底部） -->
    <QuestionPillsBar :category-name="currentCategory?.category || '大纲加载中...'" :questions="currentQuestions"
      :active-category-index="activeCategoryIndex" :active-question-index="activeQuestionIndex"
      :stats="stats" :answers="userAnswers"
      @go-to="goToQuestion" @open-wrong="showWrongModal = true" />

    <!-- 4. 题目标题搜索弹窗 -->
    <QuestionSearchModal v-model:visible="showSearchModal" :categories="categories" @jump="jumpToQuestion" />

    <!-- 5. 自定义 JSON 题库弹窗 -->
    <JsonBankModal v-model:visible="showJsonModal" v-model:json-text="jsonInputStr" @apply="applyJsonBank" />

    <!-- 5. 错题列表弹窗 -->
    <WrongQuestionsModal v-model:visible="showWrongModal" :items="wrongQuestionsList" @jump="jumpToWrongQuestion" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQuiz } from '@/composables/useQuiz'
import { useToast } from '@/composables/useToast'
import QuizHeader from '@/components/quiz/QuizHeader.vue'
import JsonBankModal from '@/components/quiz/JsonBankModal.vue'
import QuestionSearchModal from '@/components/quiz/QuestionSearchModal.vue'
import { registerPythonTurtleLsp } from '@/utils/services/turtleLsp'
import SingleChoicePane from '@/components/quiz/SingleChoicePane.vue'
import TurtleEditorPane from '@/components/quiz/TurtleEditorPane.vue'
import QuestionPillsBar from '@/components/quiz/QuestionPillsBar.vue'
import WrongQuestionsModal from '@/components/quiz/WrongQuestionsModal.vue'

// 答题状态（单一数据源）
const {
  categories, activeCategoryIndex, activeQuestionIndex, jsonInputStr, userAnswers,
  currentCategory, currentQuestions, currentQuestion, currentAnswerKey, currentAnswerRecord,
  currentEditorCode, stats, wrongQuestionsList,
  initBank, switchCategory, goToQuestion, prevQuestion, nextQuestion, jumpToQuestion,
  selectChoice, submitCurrentQuestion, markSelfGrade, resetEditorCode,
  applyNewJsonBank, loadProgressFromLocal
} = useQuiz()

// 弹窗显隐（纯 UI 编排状态）
const showJsonModal = ref(false)
const showWrongModal = ref(false)

const toast = useToast()

function applyJsonBank() {
  const result = applyNewJsonBank()
  if (result.ok) {
    showJsonModal.value = false
    toast.success('新题库已载入')
  } else if (result.error) {
    toast.error(result.error)
  }
}

function handleSubmit() {
  const submitted = submitCurrentQuestion()
  if (!submitted) {
    toast.warning('请先选择一个选项再提交')
    return
  }
  if (currentQuestion.value?.type === 'iframe_editor') {
    toast.success('提交成功，已解锁参考答案')
  } else if (currentAnswerRecord.value.isCorrect) {
    toast.success('提交成功，回答正确！')
  } else {
    toast.error('提交成功，回答错误，看看解析吧')
  }
}

function jumpToWrongQuestion(catIdx: number, qIdx: number) {
  showWrongModal.value = false
  jumpToQuestion(catIdx, qIdx)
}

onMounted(async () => {
  registerPythonTurtleLsp()
  loadProgressFromLocal()

  try {
    const res = await fetch('./question.json')
    const data = await res.json()
    initBank(data)
  } catch (e) {
    console.warn('未检测到本地 question.json，请手动通过配置载入。')
  }
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
