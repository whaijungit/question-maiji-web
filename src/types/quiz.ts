// 题库与答题记录相关类型定义

/** 一道题目（字段均可选，以兼容本地 JSON 题库） */
export interface QuizQuestion {
  id?: number
  type?: 'choice' | 'iframe_editor' | string
  title?: string
  /** 单选题选项 */
  options?: string[]
  /** 单选题正确答案索引 */
  answer?: number
  explanation?: string
  /** 海龟实操题初始代码 */
  initialCode?: string
  /** 海龟实操题参考标准代码 */
  referenceCode?: string
}

/** 一个大纲分类（含题目列表） */
export interface QuizCategory {
  category?: string
  questions?: QuizQuestion[]
}

/** 单题作答记录 */
export interface AnswerRecord {
  submitted: boolean
  selectedOption: number | null
  isCorrect: boolean
  hasSelfGraded?: boolean
}

/** 统计面板数据 */
export interface QuizStats {
  total: number
  correct: number
  wrong: number
  unanswered: number
  done: number
}

/** 错题列表项 */
export interface WrongQuestionItem {
  catIdx: number
  qIdx: number
  categoryName: string
  question: QuizQuestion
}
