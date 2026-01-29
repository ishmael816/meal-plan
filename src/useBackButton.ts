import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * 处理系统返回按钮（Android 返回键/边缘滑动手势）
 * - 如果在子页面（如 /today/:slotId, /settings, /data），返回首页
 * - 如果在主页面（/），则退出应用
 */
export function useBackButton() {
  const navigate = useNavigate()
  const location = useLocation()
  const listenerRef = useRef<{ remove: () => void } | null>(null)
  const locationRef = useRef(location.pathname)

  // 保持 locationRef 与最新的 location 同步
  useEffect(() => {
    locationRef.current = location.pathname
  }, [location.pathname])

  useEffect(() => {
    // 检查是否在 Capacitor 环境中
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor

    if (isCapacitor) {
      // 在 Capacitor 环境中，使用 App 插件
      import('@capacitor/app')
        .then(({ App }) => {
          App.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
            const currentPath = locationRef.current
            if (currentPath.startsWith('/today/') || currentPath === '/settings' || currentPath === '/data') {
              navigate('/')
            } else if (currentPath === '/') {
              App.exitApp().catch(() => {})
            } else if (canGoBack) {
              window.history.back()
            }
          }).then((listener: { remove: () => void }) => {
            listenerRef.current = listener
          })
        })
        .catch(() => {
          // App 插件未安装，忽略
        })
    } else {
      // 在 Web 环境中，使用浏览器的 popstate 事件
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault()
        
        // 使用最新的路径
        const currentPath = locationRef.current
        
        // 如果在子页面，导航到首页
        if (currentPath.startsWith('/today/') || currentPath === '/settings' || currentPath === '/data') {
          navigate('/')
        }
        // 如果在首页，尝试关闭窗口（可能被浏览器阻止）
        else if (currentPath === '/') {
          // 在 Web 环境中，通常不做任何操作
          // 或者可以显示确认对话框
        }
      }

      window.addEventListener('popstate', handlePopState)
      return () => {
        window.removeEventListener('popstate', handlePopState)
      }
    }

    // 清理函数
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove()
        listenerRef.current = null
      }
    }
  }, [location.pathname, navigate])
}
