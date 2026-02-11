import { useEffect, useState } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'info' | 'error'
}

const toastListeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function notify() {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = Math.random().toString(36).slice(2, 9)
  toasts = [...toasts, { id, message, type }]
  notify()
  
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  }, 2500)
}

export function ToastContainer() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([])
  
  useEffect(() => {
    const listener = (newToasts: Toast[]) => setLocalToasts(newToasts)
    toastListeners.push(listener)
    return () => {
      const index = toastListeners.indexOf(listener)
      if (index > -1) toastListeners.splice(index, 1)
    }
  }, [])
  
  if (localToasts.length === 0) return null
  
  return (
    <div className="toast-container">
      {localToasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '✕'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
