import * as monaco from 'monaco-editor'
import { turtleApiDatabase } from './turtleApi'

/** 检测是否使用了星号导入：from turtle import * */
function hasTurtleStarImport(model: monaco.editor.ITextModel): boolean {
  return /from\s+turtle\s+import\s*\*/.test(model.getValue())
}

/** 扫描代码中所有被赋值为 turtle 对象的变量名（含 turtle 模块与常用 t） */
function collectTurtleVars(text: string): Set<string> {
  const turtleVars = new Set(['turtle'])
  const regex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*.*turtle/gi
  let match
  while ((match = regex.exec(text)) !== null) {
    turtleVars.add(match[1]!)
  }
  turtleVars.add('t') // 默认兜底
  return turtleVars
}

/** 构造海龟 API 补全项（方法调用） */
function buildTurtleSuggestion(method: string, range: monaco.IRange, prefix: string): monaco.languages.CompletionItem {
  const info = turtleApiDatabase[method]!
  return {
    label: method,
    kind: monaco.languages.CompletionItemKind.Method,
    insertText: method + '($1)',
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    detail: `(method) ${prefix}${method} -> 🐢`,
    documentation: {
      value: `**Python Turtle API**\n\n${info.desc}\n\n用法: \`${info.sig}\``
    },
    range: range
  }
}

/** 注册 Python 海龟 LSP：补全（对象方法 + 星号导入的裸函数）与签名提示 */
export function registerPythonTurtleLsp() {
  // 1. 补全：'.' 触发对象方法；字母触发（星号导入时）裸函数名
  monaco.languages.registerCompletionItemProvider('python', {
    triggerCharacters: ['.', ...'abcdefghijklmnopqrstuvwxyz_'.split('')],
    provideCompletionItems: function (model, position) {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      })

      // 注释内不提示
      if (textUntilPosition.includes('#')) return { suggestions: [] }

      const wordUntil = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        startColumn: wordUntil.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: wordUntil.endColumn
      }

      const suggestions: monaco.languages.CompletionItem[] = []
      const fullText = model.getValue()

      // 动态分析上下文：扫描代码中所有被赋值为 turtle 对象的变量名
      const turtleVars = collectTurtleVars(fullText)

      const dotMatch = textUntilPosition.match(/([a-zA-Z0-9_]+)\.$/)
      if (dotMatch) {
        // 对象属性补全：t. / turtle.
        const objName = dotMatch[1]!
        if (turtleVars.has(objName) || objName === 'turtle') {
          for (const method of Object.keys(turtleApiDatabase)) {
            suggestions.push(buildTurtleSuggestion(method, range, `${objName}.`))
          }
        }
        return { suggestions }
      }

      // 裸函数名补全：仅当使用 from turtle import * 时提示海龟函数
      if (hasTurtleStarImport(model)) {
        for (const method of Object.keys(turtleApiDatabase)) {
          const info = turtleApiDatabase[method]!
          suggestions.push({
            label: method,
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: method + '($1)',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: `(function) turtle 模块函数 -> 🐢`,
            documentation: {
              value: `**Python Turtle API**\n\n${info.desc}\n\n用法: \`${info.sig}\``
            },
            range: range
          })
        }
      }

      // 全局上下文词汇补全
      const words = fullText.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []
      const pyKeywords = ['import', 'from', 'def', 'class', 'for', 'in', 'while', 'if', 'elif', 'else', 'return', 'print', 'True', 'False']
      const allWords = [...new Set([...words, ...pyKeywords])]

      for (const w of allWords) {
        if (w !== wordUntil.word) {
          suggestions.push({
            label: w,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: w,
            range: range
          })
        }
      }

      return { suggestions }
    }
  })

  // 2. 悬停提示：鼠标悬停在海龟函数名上显示官方描述
  monaco.languages.registerHoverProvider('python', {
    provideHover: function (model, position) {
      const wordAt = model.getWordAtPosition(position)
      if (!wordAt) return null
      const name = wordAt.word
      if (!turtleApiDatabase[name]) return null

      // 判断上下文：obj.name 还是星号导入后的裸 name
      let prefix = ''
      let isBare = true
      if (wordAt.startColumn > 1) {
        const prevChar = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: wordAt.startColumn - 1,
          endLineNumber: position.lineNumber,
          endColumn: wordAt.startColumn
        })
        if (prevChar === '.') {
          const before = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: wordAt.startColumn - 1
          })
          const objMatch = before.match(/([a-zA-Z0-9_]+)\.$/)
          if (objMatch) {
            prefix = objMatch[1]! + '.'
            isBare = false
          }
        }
      }

      if (isBare && !hasTurtleStarImport(model)) return null
      if (!isBare) {
        const objName = prefix.slice(0, -1)
        const turtleVars = collectTurtleVars(model.getValue())
        if (!turtleVars.has(objName) && objName !== 'turtle') return null
      }

      const info = turtleApiDatabase[name]!
      const title = isBare ? '**turtle 模块函数**' : `**(method) ${prefix}${name} -> 🐢**`
      return {
        contents: [{ value: `${title}\n\n${info.desc}\n\n用法: \`${name}(${info.sig})\`` }]
      }
    }
  })

  // 3. 参数提示 / 签名帮助：支持 obj.method( 与星号导入后的裸函数 name(
  monaco.languages.registerSignatureHelpProvider('python', {
    signatureHelpTriggerCharacters: ['(', ','],
    provideSignatureHelp: function (model, position) {
      const lineText = model.getLineContent(position.lineNumber)
      const queryText = lineText.substring(0, position.column)

      // 捕获可选的 obj. 前缀与函数名
      const match = queryText.match(/(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_]+)\s*\(/)
      if (!match) return null

      const objName = match[1]
      const methodName = match[2]!

      // obj.method( 时按方法名直接提示；裸函数 name( 仅在星号导入时提示
      if (!turtleApiDatabase[methodName]) return null
      if (!objName && !hasTurtleStarImport(model)) return null

      const info = turtleApiDatabase[methodName]!
      return {
        value: {
          signatures: [{
            label: `${methodName}(${info.sig})`,
            documentation: info.desc,
            parameters: [{ label: info.sig }]
          }],
          activeSignature: 0,
          activeParameter: 0
        },
        dispose: () => {}
      }
    }
  })
}
