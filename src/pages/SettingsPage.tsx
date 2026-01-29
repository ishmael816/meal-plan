import { useState, useRef, useEffect } from 'react'
import type { PlanSettings, MealSlot, MealItem, RecipeSet } from '../types'
import { SLOT_NAME_SUGGESTIONS } from '../types'

const nanoid = () => Math.random().toString(36).slice(2, 12)

type Props = { settings: PlanSettings; setSettings: (v: PlanSettings) => void }

export function SettingsPage({ settings, setSettings }: Props) {
  const [editingSetId, setEditingSetId] = useState<string | null>(null)

  const updateSlots = (fn: (s: MealSlot[]) => MealSlot[]) => {
    const nextSlots = fn(settings.slots)
    const nextSets = settings.recipeSets.map((set) => ({
      ...set,
      itemsBySlot: Object.fromEntries(
        nextSlots.map((slot) => [slot.id, (set.itemsBySlot[slot.id] ?? [])])
      ),
    }))
    setSettings({ ...settings, slots: nextSlots, recipeSets: nextSets })
  }

  const addSlot = () => {
    const id = nanoid()
    const newSlot: MealSlot = { id, name: '新餐次', time: '12:00' }
    const nextSlots = [...settings.slots, newSlot]
    const nextSets = settings.recipeSets.map((set) => ({
      ...set,
      itemsBySlot: { ...set.itemsBySlot, [id]: [] },
    }))
    setSettings({ ...settings, slots: nextSlots, recipeSets: nextSets })
  }

  const removeSlot = (slotId: string) => {
    const nextSlots = settings.slots.filter((x) => x.id !== slotId)
    const nextSets = settings.recipeSets.map((set) => {
      const ib = { ...set.itemsBySlot }
      delete ib[slotId]
      return { ...set, itemsBySlot: ib }
    })
    let defaultSetId = settings.defaultSetId
    setSettings({ ...settings, slots: nextSlots, recipeSets: nextSets, defaultSetId })
  }

  const setSlotName = (slotId: string, name: string) => {
    updateSlots((s) => s.map((x) => (x.id === slotId ? { ...x, name } : x)))
  }

  const setSlotTime = (slotId: string, time: string) => {
    updateSlots((s) => s.map((x) => (x.id === slotId ? { ...x, time } : x)))
  }

  const addRecipeSet = () => {
    const id = nanoid()
    const itemsBySlot: Record<string, MealItem[]> = Object.fromEntries(
      settings.slots.map((slot) => [slot.id, []])
    )
    const newSet: RecipeSet = { id, name: '新套餐', itemsBySlot }
    const next = [...settings.recipeSets, newSet]
    setSettings({
      ...settings,
      recipeSets: next,
      defaultSetId: settings.defaultSetId ?? id,
    })
    setEditingSetId(id)
  }

  const removeRecipeSet = (setId: string) => {
    const next = settings.recipeSets.filter((s) => s.id !== setId)
    const defaultSetId =
      settings.defaultSetId === setId ? (next[0]?.id ?? null) : settings.defaultSetId
    setSettings({ ...settings, recipeSets: next, defaultSetId })
    if (editingSetId === setId) setEditingSetId(null)
  }

  const updateSet = (setId: string, patch: Partial<RecipeSet>) => {
    setSettings({
      ...settings,
      recipeSets: settings.recipeSets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    })
  }

  const updateSetItems = (setId: string, slotId: string, fn: (items: MealItem[]) => MealItem[]) => {
    updateSet(setId, {
      itemsBySlot: {
        ...settings.recipeSets.find((s) => s.id === setId)!.itemsBySlot,
        [slotId]: fn(settings.recipeSets.find((s) => s.id === setId)!.itemsBySlot[slotId] ?? []),
      },
    })
  }

  return (
    <div className="page">
      <h1 className="title">用餐与食谱设置</h1>
      <p className="muted">设定餐次名称与时间；可添加多套食谱，在每餐详情里左划右划切换当餐用的套餐。</p>

      <section className="settings-section">
        <h2 className="section-title">餐次</h2>
        <p className="section-desc">从常用名称中快速选择，或输入自定义（如 夜宵、上午加餐）。</p>
        {settings.slots.map((slot) => (
          <div key={slot.id} className="card slot-card">
            <div className="slot-header">
              <div className="slot-name-row">
                <div className="slot-name-suggestions">
                  {SLOT_NAME_SUGGESTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`chip ${slot.name === n ? 'chip-active' : ''}`}
                      onClick={() => setSlotName(slot.id, n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  className="slot-name-input"
                  value={slot.name}
                  onChange={(e) => setSlotName(slot.id, e.target.value)}
                  placeholder="或输入自定义名称"
                />
              </div>
              <input
                type="time"
                className="slot-time"
                value={slot.time}
                onChange={(e) => setSlotTime(slot.id, e.target.value)}
              />
              <button type="button" className="btn-ghost danger" onClick={() => removeSlot(slot.id)} title="删除餐次">
                删除
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn-outline block" onClick={addSlot}>
          + 添加餐次
        </button>
      </section>

      <section className="settings-section">
        <h2 className="section-title">食谱套餐</h2>
        <p className="section-desc">每套方案下为各餐次配置食物；在「今日」进入某餐后，可左右滑动切换该餐使用的套餐。</p>
        {settings.recipeSets.map((set) => (
          <div key={set.id} className="card set-card">
            <div className="set-card-header">
              <input
                className="set-name"
                value={set.name}
                onChange={(e) => updateSet(set.id, { name: e.target.value })}
                placeholder="套餐名称"
              />
              <div className="set-card-actions">
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="defaultSet"
                    checked={settings.defaultSetId === set.id}
                    onChange={() => setSettings({ ...settings, defaultSetId: set.id })}
                  />
                  <span>默认</span>
                </label>
                <button type="button" className="btn-ghost" onClick={() => setEditingSetId(editingSetId === set.id ? null : set.id)}>
                  {editingSetId === set.id ? '收起' : '编辑'}
                </button>
                <button type="button" className="btn-ghost danger" onClick={() => removeRecipeSet(set.id)}>
                  删除
                </button>
              </div>
            </div>
            {editingSetId === set.id && (
              <div className="set-items">
                {settings.slots.map((slot) => (
                  <div key={slot.id} className="set-slot-block">
                    <div className="set-slot-label">{slot.name}</div>
                    <div className="items-list">
                      {(set.itemsBySlot[slot.id] ?? []).map((item) => (
                        <div key={item.id} className="item-row">
                          <input
                            className="item-name"
                            value={item.name}
                            onChange={(e) =>
                              updateSetItems(set.id, slot.id, (items) =>
                                items.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x))
                              )
                            }
                            placeholder="食物"
                          />
                          <input
                            type="number"
                            className="item-grams"
                            min={0}
                            value={item.grams || ''}
                            onChange={(e) =>
                              updateSetItems(set.id, slot.id, (items) =>
                                items.map((x) => (x.id === item.id ? { ...x, grams: +e.target.value || 0 } : x))
                              )
                            }
                            placeholder="克"
                          />
                          <span className="unit">g</span>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() =>
                              updateSetItems(set.id, slot.id, (items) => items.filter((x) => x.id !== item.id))
                            }
                          >
                            删
                          </button>
                        </div>
                      ))}
                      <AddItemButton
                        setId={set.id}
                        slotId={slot.id}
                        onAdd={(newItem) =>
                          updateSetItems(set.id, slot.id, (items) => [...items, newItem])
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button type="button" className="btn-outline block" onClick={addRecipeSet}>
          + 添加套餐
        </button>
      </section>
    </div>
  )
}

// 添加食物按钮组件，自动聚焦输入框
type AddItemButtonProps = {
  setId: string
  slotId: string
  onAdd: (item: MealItem) => void
}

function AddItemButton({ onAdd }: AddItemButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState<MealItem>({ id: nanoid(), name: '', grams: 50 })
  const nameInputRef = useRef<HTMLInputElement>(null)
  const itemRowRef = useRef<HTMLDivElement>(null)

  // 当开始添加时，自动聚焦到名称输入框
  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      // 延迟一下确保 DOM 已更新
      setTimeout(() => {
        nameInputRef.current?.focus()
        // 滚动到输入框位置，确保不被键盘遮挡
        // 使用 requestAnimationFrame 确保在浏览器重绘后执行
        requestAnimationFrame(() => {
          if (itemRowRef.current) {
            // 计算输入框的位置，确保在视口中心偏上的位置（为键盘留出空间）
            const rect = itemRowRef.current.getBoundingClientRect()
            const scrollY = window.scrollY + rect.top - window.innerHeight / 3
            window.scrollTo({ top: Math.max(0, scrollY), behavior: 'smooth' })
          }
        })
      }, 150)
    }
  }, [isAdding])

  // 处理键盘事件：Enter 键完成添加，Escape 键取消
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newItem.name.trim()) {
      handleAdd()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const handleAdd = () => {
    if (newItem.name.trim()) {
      onAdd({ ...newItem, name: newItem.name.trim() })
      setNewItem({ id: nanoid(), name: '', grams: 50 })
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setNewItem({ id: nanoid(), name: '', grams: 50 })
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <div ref={itemRowRef} className="item-row">
        <input
          ref={nameInputRef}
          className="item-name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // 延迟处理 blur，以便点击添加按钮时能先执行
            setTimeout(() => {
              if (newItem.name.trim()) {
                handleAdd()
              } else {
                handleCancel()
              }
            }, 200)
          }}
          placeholder="食物名称"
          autoFocus
        />
        <input
          type="number"
          className="item-grams"
          min={0}
          value={newItem.grams || ''}
          onChange={(e) => setNewItem({ ...newItem, grams: +e.target.value || 0 })}
          onKeyDown={handleKeyDown}
          placeholder="克"
        />
        <span className="unit">g</span>
        <button type="button" className="btn-ghost" onClick={handleCancel}>
          取消
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="btn-add-item"
      onClick={() => setIsAdding(true)}
    >
      + 添加
    </button>
  )
}
