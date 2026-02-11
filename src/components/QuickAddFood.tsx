import { useState, useRef, useEffect } from 'react'
import { showToast } from './Toast'

interface QuickAddFoodProps {
  onAdd: (name: string, grams: number) => void
  placeholder?: string
}

export function QuickAddFood({ onAdd, placeholder = '添加食物...' }: QuickAddFoodProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [grams, setGrams] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) {
      showToast('请输入食物名称', 'error')
      return
    }
    
    const numGrams = parseInt(grams, 10) || 0
    onAdd(trimmedName, numGrams)
    
    // Reset and keep open for quick multi-add
    setName('')
    setGrams('')
    inputRef.current?.focus()
    showToast(`已添加 ${trimmedName}`, 'success')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className="quick-add-btn"
        onClick={() => setIsOpen(true)}
      >
        <span className="quick-add-icon">+</span>
        <span className="quick-add-text">{placeholder}</span>
      </button>
    )
  }

  return (
    <form className="quick-add-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        className="quick-add-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="食物名称"
      />
      <div className="quick-add-actions">
        <input
          type="number"
          className="quick-add-grams"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="克数"
          min="0"
        />
        <span className="quick-add-unit">g</span>
        <button type="submit" className="quick-add-submit">
          添加
        </button>
        <button 
          type="button" 
          className="quick-add-cancel"
          onClick={() => setIsOpen(false)}
        >
          完成
        </button>
      </div>
    </form>
  )
}
