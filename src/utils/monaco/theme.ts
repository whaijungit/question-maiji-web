import * as monaco from 'monaco-editor'

export const PYTHON_TURTLE_THEME = 'codemao-purple-theme'

let isThemeDefined = false

/** 注册 Codemao 品牌主题（幂等：多处调用只注册一次） */
export function definePythonTurtleTheme() {
  if (isThemeDefined) return
  isThemeDefined = true

  monaco.editor.defineTheme(PYTHON_TURTLE_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7A7568', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'FF9E40', fontStyle: 'bold' },
      { token: 'number', foreground: '7ECB6E' },
      { token: 'string', foreground: 'FFC24D' },
      { token: 'identifier', foreground: 'D6D2C6' }
    ],
    colors: {
      // 深色主题：暖炭底 + 琥珀点缀，长时间看不易疲劳
      'editor.background': '#1F1E1B',
      'editor.foreground': '#D6D2C6',
      'editorCursor.foreground': '#FF8C1A',
      'editor.lineHighlightBackground': '#2A2823',
      'editorLineNumber.foreground': '#6E6859',
      'editorLineNumber.activeForeground': '#FF8C1A',
      'editor.selectionBackground': '#5A4A26',
      'editor.inactiveSelectionBackground': '#4A3F24'
    }
  })
}
