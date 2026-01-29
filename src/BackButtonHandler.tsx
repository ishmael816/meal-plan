import { useBackButton } from './useBackButton'

/**
 * 返回按钮处理组件
 * 需要在 HashRouter 内部使用
 */
export function BackButtonHandler() {
  useBackButton()
  return null
}
