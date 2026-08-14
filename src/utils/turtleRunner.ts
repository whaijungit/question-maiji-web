// Skulpt Python 执行器：负责代码运行、停止与回调分发
import Sk from 'skulpt'

export interface RunOptions {
  code: string
  targetCanvas: HTMLElement | null
  onPrint?: (text: string) => void
  onError?: (err: string) => void
  onSuccess?: () => void
}

// 内置文件读取函数（Skulpt 必须）
function builtinRead(x: string) {
  if ((Sk as any).builtinFiles === undefined || (Sk as any).builtinFiles['files'][x] === undefined) {
    throw new Error("File not found: '" + x + "'")
  }
  return (Sk as any).builtinFiles['files'][x]
}

export class TurtleRunner {
  private static currentExec: any = null

  // 运行 Python 代码
  static run(options: RunOptions) {
    const { code, targetCanvas, onPrint, onError, onSuccess } = options

    if (!targetCanvas) return

    // 清空旧画布（每次运行 Skulpt 都会在目标容器内新建画布，不清会越堆越多）
    targetCanvas.innerHTML = ''

    // 配置 Skulpt
    Sk.configure({
      output: (text: string) => {
        if (text.trim() !== '' && onPrint) {
          onPrint(text)
        }
      },
      read: builtinRead,
      __future__: Sk.python3,
      yieldLimit: 100,
      execLimit: Number.POSITIVE_INFINITY
    })

    // 指定 Turtle 绘图挂载的目标 DOM 节点，并让画布宽高跟随容器尺寸
    // （Skulpt 模块内部 getWidth/getHeight 优先读取 Sk.TurtleGraphics.width/height，
    //   否则落到默认 400x400，容器大小会被忽略）
    const tg = (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})) as any
    tg.target = targetCanvas
    tg.width = targetCanvas.clientWidth || 400
    tg.height = targetCanvas.clientHeight || 300

    // 异步执行
    try {
      this.currentExec = Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody('<stdin>', false, code, true)
      })

      this.currentExec.then(
        () => {
          if (onSuccess) onSuccess()
        },
        (err: any) => {
          const errStr = err.toString()
          // 过滤掉因为手动停止产生的 TimeLimitError
          if (!errStr.includes('TimeLimitError') && onError) {
            onError(errStr)
          }
        }
      )
    } catch (err: any) {
      if (onError) onError(err.toString())
    }
  }

  // 停止运行（通过将 execLimit 设为 1 触发超时中断）
  static stop() {
    Sk.execLimit = 1
  }
}
