import { useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  height?: 'auto' | 'full' | 'half'
}

export function BottomSheet({ isOpen, onClose, title, children, height = 'auto' }: BottomSheetProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      requestAnimationFrame(() => setIsAnimating(true))
      document.body.style.overflow = 'hidden'
    } else {
      setIsAnimating(false)
      const timer = setTimeout(() => {
        setIsVisible(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Swipe down to close
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0 && sheetRef.current) {
      const translateY = Math.min(deltaY * 0.5, 100)
      sheetRef.current.style.transform = `translateY(${translateY}px)`
    }
  }

  const handleTouchEnd = () => {
    const deltaY = currentY.current - startY.current
    if (deltaY > 80) {
      onClose()
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
  }

  if (!isVisible) return null

  const heightClass = height === 'full' ? 'bottom-sheet--full' : height === 'half' ? 'bottom-sheet--half' : ''

  return (
    <div 
      className={`bottom-sheet-backdrop ${isAnimating ? 'is-active' : ''}`}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`bottom-sheet ${heightClass} ${isAnimating ? 'is-active' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bottom-sheet-handle" />
        {title && <div className="bottom-sheet-header">{title}</div>}
        <div className="bottom-sheet-content">{children}</div>
      </div>
    </div>
  )
}
