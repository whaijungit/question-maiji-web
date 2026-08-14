// Monaco 编辑器生命周期管理：创建、销毁、内容同步与运行快捷键
import { onBeforeUnmount, watch, type Ref } from 'vue'
import * as monaco from 'monaco-editor'
import { definePythonTurtleTheme, PYTHON_TURTLE_THEME } from '@/utils/monaco/theme'

export interface MonacoEditorOptions {
  /** 编辑器挂载容器（可为 v-if 控制的延迟挂载节点） */
  host: Ref<HTMLElement | null>
  /** 内容（双向：外部更新会同步进编辑器） */
  value: Ref<string>
  /** 内容变更回调 */
  onChange?: (code: string) => void
  /** 运行快捷键回调（Ctrl+Enter / F5），代码编辑器场景使用 */
  onRun?: () => void
  fontSize?: number
  /** 代码语言，默认 python */
  language?: string
  /** 是否注册运行快捷键与行注释操作（代码编辑器场景），JSON 等场景传 false */
  enableActions?: boolean
}

export function useMonacoEditor(options: MonacoEditorOptions) {
  let editor: monaco.editor.IStandaloneCodeEditor | null = null
  /** 标记程序化 setValue，避免与用户输入形成回调循环 */
  let isSettingValue = false

  function createEditor(el: HTMLElement) {
    definePythonTurtleTheme()

    editor = monaco.editor.create(el, {
      value: options.value.value,
      language: options.language ?? 'python',
      theme: PYTHON_TURTLE_THEME,
      fontSize: options.fontSize ?? 18,
      automaticLayout: true
    })

    editor.onDidChangeModelContent(() => {
      if (!isSettingValue && editor) {
        options.onChange?.(editor.getValue())
      }
    })

    if (options.enableActions !== false) {
      editor.addAction({
        id: 'run-python-code',
        label: '▶ 运行当前代码',
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, monaco.KeyCode.F5],
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => { options.onRun?.() }
      })

      editor.addAction({
        id: 'toggle-line-comment-custom',
        label: '切换行注释 (Ctrl + /)',
        contextMenuGroupId: 'modification',
        contextMenuOrder: 1,
        run: (ed) => { ed.trigger('keyboard', 'editor.action.commentLine', null) }
      })
    }
  }

  // 容器节点受 v-if 控制可能延迟挂载：出现时创建，移除时销毁，重新出现时重建
  watch(
    () => options.host.value,
    (el) => {
      if (!el) {
        editor?.dispose()
        editor = null
        return
      }
      if (!editor) createEditor(el)
    },
    { immediate: true }
  )

  // 外部内容变化（如重置）同步进编辑器
  watch(options.value, (code) => {
    if (editor && code !== editor.getValue()) {
      isSettingValue = true
      editor.setValue(code)
      isSettingValue = false
    }
  })

  onBeforeUnmount(() => {
    editor?.dispose()
    editor = null
  })

  function getValue() {
    return editor ? editor.getValue() : ''
  }

  return { getValue }
}
