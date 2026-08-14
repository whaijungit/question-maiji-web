// 实操题代码校验：将编辑器代码与题目参考答案做规范化文本比对
// 归一化规则：统一引号、去除注释行与空白行、去行首尾空白

export const MATCH_THRESHOLD = 1

export interface VerifyResult {
  /** 代码相似度 0~1 */
  similarity: number
  /** 是否判定为一致 */
  matched: boolean
}

function normalizeCodeLines(code: string): string[] {
  return code
    .split(/\r?\n/)
    // 去掉行内注释（# 前必须有空白，避免误伤字符串里的 #）
    .map((line) => line.replace(/\s+#.*$/, '').trim().replace(/'/g, '"'))
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

/** 行级最长公共子序列长度 */
function lcsLength(a: string[], b: string[]): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  const at = (i: number, j: number) => dp[i]![j]!

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const same = a[i - 1] === b[j - 1]
      dp[i]![j] = same ? at(i - 1, j - 1) + 1 : Math.max(at(i - 1, j), at(i, j - 1))
    }
  }

  return at(m, n)
}

/**
 * 校验编辑器代码是否与参考答案一致。
 * 判定口径：参考代码的每一行都按顺序出现在用户代码中（即覆盖率 100%），
 * 用户额外写的可选语句（speed、注释等）不扣分，但漏掉参考答案的步骤会扣分。
 */
export function verifyCodeAgainstReference(userCode: string, refCode: string): VerifyResult {
  const userLines = normalizeCodeLines(userCode)
  const refLines = normalizeCodeLines(refCode)
  const lcs = lcsLength(userLines, refLines)
  const similarity = refLines.length === 0 ? 1 : lcs / refLines.length
  return { similarity, matched: similarity >= MATCH_THRESHOLD }
}
