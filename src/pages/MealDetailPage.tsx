import { useMemo, useCallback, useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { LogEntry } from '../types'
import { getTodayPlan } from '../todayPlan'
import { useAppStore, useSettings, useLogs, useSavedMeals, useDailySetSelection } from '../stores/appStore'
import { SlotBlock } from './TodayPage'

const nanoid = () => Math.random().toString(36).slice(2, 12)

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function MealDetailPage() {
  const { slotId } = useParams<{ slotId: string }>()
  const navigate = useNavigate()
  const date = todayStr()
  
  const settings = useSettings()
  const logs = useLogs()
  const savedMeals = useSavedMeals()
  const dailySetSelection = useDailySetSelection()
  
  const setLogs = useAppStore((state) => state.setLogs)
  const markMealSaved = useAppStore((state) => state.markMealSaved)
  const setSlotSet = useAppStore((state) => state.setSlotSet)
  
  // Temp state for current meal modifications
  const [tempLogs, setTempLogs] = useState<LogEntry[]>([])
  
  // Initialize from logs
  useEffect(() => {
    if (!slotId) return
    const slotLogs = logs.filter((l) => l.date === date && l.slotId === slotId)
    setTempLogs(slotLogs)
  }, [slotId, date, logs])
  
  const plan = useMemo(
    () => settings ? getTodayPlan(settings, tempLogs, date, dailySetSelection) : [],
    [settings, tempLogs, date, dailySetSelection]
  )
  const slotView = plan.find((p) => p.slot.id === slotId)
  const saved = (savedMeals[date] ?? []).includes(slotId ?? '')

  const setActiveSetForThisSlot = useCallback(
    (setId: string) => {
      if (!slotId) return
      setSlotSet(date, slotId, setId)
    },
    [date, slotId, setSlotSet]
  )

  const switchToPrevSet = useCallback(() => {
    if (!slotView || !settings || settings.recipeSets.length <= 1) return
    const idx = settings.recipeSets.findIndex((s) => s.id === slotView.activeSetId)
    const nextIdx = idx <= 0 ? settings.recipeSets.length - 1 : idx - 1
    setActiveSetForThisSlot(settings.recipeSets[nextIdx].id)
  }, [slotView, settings, setActiveSetForThisSlot])

  const switchToNextSet = useCallback(() => {
    if (!slotView || !settings || settings.recipeSets.length <= 1) return
    const idx = settings.recipeSets.findIndex((s) => s.id === slotView.activeSetId)
    const nextIdx = idx < 0 || idx >= settings.recipeSets.length - 1 ? 0 : idx + 1
    setActiveSetForThisSlot(settings.recipeSets[nextIdx].id)
  }, [slotView, settings, setActiveSetForThisSlot])

  const upsert = (entry: Partial<LogEntry> & { date: string; slotId: string }) => {
    setTempLogs((prev) => {
      const match = (l: LogEntry) =>
        l.date === entry.date &&
        l.slotId === entry.slotId &&
        (entry.itemId ? l.itemId === entry.itemId : l.id === entry.id)
      const rest = prev.filter((l) => !match(l))
      const existing = prev.find(match)
      const merged: LogEntry = {
        id: existing?.id ?? nanoid(),
        date: entry.date!,
        slotId: entry.slotId!,
        itemId: entry.itemId ?? existing?.itemId ?? '',
        itemName: entry.itemName ?? existing?.itemName ?? '',
        plannedGrams: entry.plannedGrams ?? existing?.plannedGrams ?? 0,
        actualGrams: entry.actualGrams ?? existing?.actualGrams ?? 0,
        checked: entry.checked ?? existing?.checked ?? false,
        isCustom: entry.isCustom ?? existing?.isCustom ?? false,
      }
      return [...rest, merged]
    })
  }

  const removeLog = (id: string) => {
    setTempLogs((prev) => prev.filter((l) => l.id !== id))
  }

  const addCustom = (sid: string, slotName: string) => {
    const name = prompt(`在「${slotName}」中添加的食物名称：`)
    if (!name?.trim()) return
    const grams = Number(prompt('克数（可填 0）：') ?? '0') || 0
    upsert({
      date,
      slotId: sid,
      itemId: nanoid(),
      itemName: name.trim(),
      plannedGrams: grams,
      actualGrams: grams,
      checked: false,
      isCustom: true,
    })
  }

  const handleSave = () => {
    if (!slotId) return
    
    // Remove old records for this meal and add new ones
    setLogs((prev) => {
      const rest = prev.filter((l) => !(l.date === date && l.slotId === slotId))
      return [...rest, ...tempLogs]
    })
    
    markMealSaved(date, slotId)
    navigate('/')
  }

  if (!slotId || !slotView || !settings) {
    return (
      <div className="page">
        <p className="muted">未找到该餐次</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/')}>
          返回今日
        </button>
      </div>
    )
  }

  const { slot, entries, activeSetName } = slotView
  const canSwitch = settings.recipeSets.length > 1
  const touchStartX = useRef(0)

  const onSwitcherTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onSwitcherTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx > 50) switchToPrevSet()
    else if (dx < -50) switchToNextSet()
  }

  return (
    <div className="page">
      <div className="meal-detail-header">
        <button type="button" className="btn-back" onClick={() => navigate('/')} aria-label="返回">
          ←
        </button>
        <div>
          <h1 className="title title-inline">{slot.name}</h1>
          <span className="meal-detail-time">{slot.time}</span>
        </div>
      </div>

      {canSwitch && (
        <div
          className="meal-set-switcher"
          role="group"
          aria-label="切换套餐"
          onTouchStart={onSwitcherTouchStart}
          onTouchEnd={onSwitcherTouchEnd}
        >
          <button type="button" className="meal-set-arrow" onClick={switchToPrevSet} aria-label="上一套">
            ‹
          </button>
          <span className="meal-set-name" title="左划上一套、右划下一套">{activeSetName}</span>
          <button type="button" className="meal-set-arrow" onClick={switchToNextSet} aria-label="下一套">
            ›
          </button>
        </div>
      )}

      <SlotBlock
        slot={slot}
        entries={entries}
        date={date}
        onUpsert={upsert}
        onRemove={removeLog}
        onAddCustom={() => addCustom(slot.id, slot.name)}
      />

      <div className="meal-detail-actions">
        {saved ? (
          <div className="meal-saved-hint">本餐已保存</div>
        ) : null}
        <button type="button" className="btn-primary block" onClick={handleSave}>
          {saved ? '再次保存' : '保存本餐'}
        </button>
      </div>
    </div>
  )
}
