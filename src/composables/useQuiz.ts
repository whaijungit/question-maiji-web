// 答题核心状态：题库、答题记录、统计、错题与本地持久化（不含任何 UI 逻辑）
import { ref, computed } from 'vue'
import type { AnswerRecord, QuizCategory, QuizQuestion, WrongQuestionItem } from '@/types/quiz'

// export const DEFAULT_TURTLE_CODE = '# 请在此编写 Python 海龟代码\nimport turtle\n\nt = turtle.Turtle()\n'
export const DEFAULT_TURTLE_CODE = ''

const STORAGE_KEY = 'offline_quiz_progress'

export function useQuiz() {
  // 状态定义
  const categories = ref<QuizCategory[]>([])
  const activeCategoryIndex = ref(0)
  const activeQuestionIndex = ref(0)
  const userAnswers = ref<Record<string, AnswerRecord>>({})
  /** 各题编辑器代码缓存（切换题目时保留编辑内容） */
  const editorCodes = ref<Record<string, string>>({})
  const jsonInputStr = ref('')

  const currentCategory = computed(() => categories.value[activeCategoryIndex.value])
  const currentQuestions = computed<QuizQuestion[]>(() => currentCategory.value?.questions || [])
  const currentQuestion = computed(() => currentQuestions.value[activeQuestionIndex.value])

  const currentAnswerKey = computed(() => `${activeCategoryIndex.value}-${activeQuestionIndex.value}`)

  const currentAnswerRecord = computed<AnswerRecord>(() => {
    return userAnswers.value[currentAnswerKey.value] || { submitted: false, selectedOption: null, isCorrect: false, hasSelfGraded: false }
  })

  /** 当前题编辑器代码：优先取缓存，其次题目初始代码，最后默认模板 */
  const currentEditorCode = computed({
    get: () => editorCodes.value[currentAnswerKey.value] ?? currentQuestion.value?.initialCode ?? DEFAULT_TURTLE_CODE,
    set: (code: string) => { editorCodes.value[currentAnswerKey.value] = code }
  })

  // 统计面板计算
  const stats = computed(() => {
    let total = 0, correct = 0, wrong = 0, unanswered = 0
    categories.value.forEach((cat, cIdx) => {
      (cat.questions ?? []).forEach((q, qIdx) => {
        total++
        const rec = userAnswers.value[`${cIdx}-${qIdx}`]
        if (rec && rec.submitted) {
          if (rec.isCorrect) correct++; else wrong++
        } else {
          unanswered++
        }
      })
    })
    return { total, correct, wrong, unanswered, done: correct + wrong }
  })

  // 错题汇总列表
  const wrongQuestionsList = computed<WrongQuestionItem[]>(() => {
    const list: WrongQuestionItem[] = []
    categories.value.forEach((cat, cIdx) => {
      (cat.questions ?? []).forEach((q, qIdx) => {
        const rec = userAnswers.value[`${cIdx}-${qIdx}`]
        if (rec && rec.submitted && !rec.isCorrect) {
          list.push({ catIdx: cIdx, qIdx, categoryName: cat.category || '', question: q })
        }
      })
    })
    return list
  })

  function initBank(data: QuizCategory[]) {
    categories.value = data
    jsonInputStr.value = JSON.stringify(data, null, 2)
    activeCategoryIndex.value = 0
    activeQuestionIndex.value = 0
  }

  function switchCategory(idx: number) {
    activeCategoryIndex.value = idx
    activeQuestionIndex.value = 0
  }

  function goToQuestion(idx: number) {
    activeQuestionIndex.value = idx
  }

  function prevQuestion() {
    if (activeQuestionIndex.value > 0) goToQuestion(activeQuestionIndex.value - 1)
  }

  function nextQuestion() {
    if (activeQuestionIndex.value < currentQuestions.value.length - 1) goToQuestion(activeQuestionIndex.value + 1)
  }

  function jumpToQuestion(catIdx: number, qIdx: number) {
    activeCategoryIndex.value = catIdx
    activeQuestionIndex.value = qIdx
  }

  function selectChoice(optIdx: number) {
    userAnswers.value[currentAnswerKey.value] = {
      ...currentAnswerRecord.value,
      selectedOption: optIdx
    }
    saveProgressToLocal()
  }

  /** 提交当前题，成功写入记录返回 true（单选未选选项时返回 false） */
  function submitCurrentQuestion(): boolean {
    const q = currentQuestion.value
    const rec = { ...currentAnswerRecord.value }

    if (q?.type === 'iframe_editor') {
      rec.submitted = true
      if (rec.isCorrect === undefined) rec.isCorrect = false
    } else {
      if (rec.selectedOption === null) return false
      rec.submitted = true
      rec.isCorrect = (rec.selectedOption === q?.answer)
    }

    userAnswers.value[currentAnswerKey.value] = rec
    saveProgressToLocal()
    return true
  }

  function markSelfGrade(isCorrect: boolean) {
    const rec = { ...currentAnswerRecord.value }
    rec.isCorrect = isCorrect
    rec.hasSelfGraded = true
    userAnswers.value[currentAnswerKey.value] = rec
    saveProgressToLocal()
  }

  function resetEditorCode() {
    const defaultCode = currentQuestion.value?.initialCode || DEFAULT_TURTLE_CODE
    editorCodes.value[currentAnswerKey.value] = defaultCode
  }

  /** 解析并载入新题库（不弹窗，由调用方决定如何提示） */
  function applyNewJsonBank(): { ok: boolean; error?: string } {
    try {
      const parsed = JSON.parse(jsonInputStr.value)
      if (Array.isArray(parsed)) {
        initBank(parsed)
        return { ok: true }
      }
      return { ok: false, error: 'JSON 格式不正确：应为题目数组' }
    } catch (e: any) {
      return { ok: false, error: 'JSON 解析失败: ' + e.message }
    }
  }

  function saveProgressToLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userAnswers.value))
  }

  function loadProgressFromLocal() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { userAnswers.value = JSON.parse(saved) } catch (e) {}
    }
  }

  return {
    categories, activeCategoryIndex, activeQuestionIndex, jsonInputStr, userAnswers,
    currentCategory, currentQuestions, currentQuestion, currentAnswerKey, currentAnswerRecord,
    currentEditorCode, stats, wrongQuestionsList,
    initBank, switchCategory, goToQuestion, prevQuestion, nextQuestion, jumpToQuestion,
    selectChoice, submitCurrentQuestion, markSelfGrade, resetEditorCode,
    applyNewJsonBank, loadProgressFromLocal
  }
}
