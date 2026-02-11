import { useMemo, useState, useCallback } from 'react'
import { getTodayPlan } from '../todayPlan'
import { useAppStore, useSettings, useLogs, useSavedMeals, useDailySetSelection } from '../stores/appStore'
import { BottomSheet } from '../components/BottomSheet'
import { ProgressRing } from '../components/ProgressRing'
import { QuickAddFood } from '../components/QuickAddFood'
import { showToast } from '../components/Toast'
import type { LogEntry, MealSlot } from '../types'
import type { TodayEntry } from '../todayPlan'

const nanoid = () => Math.random().toString(36).slice(2, 12)

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// Progress summary component
function TodayProgress({ total, completed }: { total: number; completed: number }) {
  const progress = total > 0 ? (completed / total) * 100 : 0
  
  return (
    <div className="today-progress">
      <ProgressRing progress={progress} size={64} strokeWidth={5}>
        <span className="today-progress-text">{Math.round(progress)}%</span>
      </ProgressRing>
      <div className="today-progress-info">
        <span className="today-progress-label">今日完成度</span>
        <span className="today-progress-count">{completed}/{total} 项</span>
      </div>
    </div>
  )
}

// Meal card component with quick actions
interface MealCardProps {
  slot: MealSlot
  entries: TodayEntry[]
  activeSetName: string
  isSaved: boolean
  onToggleCheck: (entry: TodayEntry) => void
  onOpenDetail: () => void
  progress: { total: number; completed: number }
}

function MealCard({ slot, entries, activeSetName, isSaved, onToggleCheck, onOpenDetail, progress }: MealCardProps) {
  const hasEntries = entries.length > 0
  const allCompleted = hasEntries && entries.every(e => 
    e.type === 'planned' ? e.log?.checked : e.log.checked
  )
  
  return (
    <div 
      className={`meal-card-v2 ${isSaved ? 'is-saved' : ''} ${allCompleted ? 'is-complete' : ''}`}
    >
      {/* Header */}
      <div className="meal-card-v2-header" onClick={onOpenDetail}>
        <div className="meal-card-v2-main">
          <ProgressRing 
            progress={hasEntries ? (progress.completed / progress.total) * 100 : 0} 
            size={44} 
            strokeWidth={3}
            color={allCompleted ? '#22c55e' : undefined}
          >
            <span className="meal-card-v2-icon">{allCompleted ? '✓' : slot.name[0]}</span>
          </ProgressRing>
          <div className="meal-card-v2-info">
            <span className="meal-card-v2-name">{slot.name}</span>
            <span className="meal-card-v2-time">{slot.time}</span>
          </div>
        </div>
        <div className="meal-card-v2-meta">
          <span className="meal-card-v2-set">{activeSetName}</span>
          {isSaved && <span className="meal-card-v2-badge">已保存</span>}
        </div>
      </div>
      
      {/* Quick actions - show first 3 items */}
      {hasEntries && (
        <div className="meal-card-v2-quick-actions">
          {entries.slice(0, 3).map((entry) => {
            const isChecked = entry.type === 'planned' 
              ? entry.log?.checked 
              : entry.log.checked
            const name = entry.type === 'planned' 
              ? entry.item.name 
              : entry.log.itemName
            
            return (
              <button
                key={entry.type === 'planned' ? entry.item.id : entry.log.id}
                type="button"
                className={`quick-check-btn ${isChecked ? 'is-checked' : ''}`}
                onClick={() => onToggleCheck(entry)}
              >
                <span className="quick-check-box">{isChecked ? '✓' : ''}</span>
                <span className="quick-check-name">{name}</span>
              </button>
            )
          })}
          {entries.length > 3 && (
            <button type="button" className="quick-check-more" onClick={onOpenDetail}>
              +{entries.length - 3} 更多
            </button>
          )}
        </div>
      )}
      
      {!hasEntries && (
        <div className="meal-card-v2-empty" onClick={onOpenDetail}>
          点击添加食物
        </div>
      )}
    </div>
  )
}

// Detail drawer content
interface MealDetailDrawerProps {
  slot: MealSlot
  entries: TodayEntry[]
  activeSetName: string
  activeSetId: string
  allSets: { id: string; name: string }[]
  onClose: () => void
}

function MealDetailDrawer({ slot, entries, activeSetName, activeSetId, allSets, onClose }: MealDetailDrawerProps) {
  const date = todayStr()
  const setLogs = useAppStore((state) => state.setLogs)
  const markMealSaved = useAppStore((state) => state.markMealSaved)
  const setSlotSet = useAppStore((state) => state.setSlotSet)
  
  const [tempEntries, setTempEntries] = useState<TodayEntry[]>(entries)
  
  // Update local state when props change
  useState(() => {
    setTempEntries(entries)
  })
  
  const upsertLog = useCallback((entry: Partial<LogEntry> & { date: string; slotId: string }) => {
    setLogs((prev) => {
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
  }, [setLogs])
  
  const handleToggle = (entry: TodayEntry) => {
    const isPlanned = entry.type === 'planned'
    const item = isPlanned ? entry.item : null
    const log = isPlanned ? entry.log : entry.log
    
    const newChecked = !(log?.checked ?? false)
    
    upsertLog({
      date,
      slotId: slot.id,
      itemId: isPlanned ? item!.id : entry.log.itemId,
      itemName: isPlanned ? item!.name : entry.log.itemName,
      plannedGrams: isPlanned ? item!.grams : entry.log.plannedGrams,
      actualGrams: log?.actualGrams ?? (isPlanned ? item!.grams : entry.log.plannedGrams),
      checked: newChecked,
      isCustom: !isPlanned,
      ...(log?.id && { id: log.id }),
    })
    
    if (newChecked) {
      showToast('已完成', 'success')
    }
    
    // Auto save
    markMealSaved(date, slot.id)
  }
  
  const handleGramsChange = (entry: TodayEntry, grams: number) => {
    const isPlanned = entry.type === 'planned'
    const item = isPlanned ? entry.item : null
    const log = isPlanned ? entry.log : entry.log
    
    upsertLog({
      date,
      slotId: slot.id,
      itemId: isPlanned ? item!.id : entry.log.itemId,
      itemName: isPlanned ? item!.name : entry.log.itemName,
      plannedGrams: isPlanned ? item!.grams : entry.log.plannedGrams,
      actualGrams: grams,
      checked: log?.checked ?? false,
      isCustom: !isPlanned,
      ...(log?.id && { id: log.id }),
    })
  }
  
  const handleAddCustom = (name: string, grams: number) => {
    upsertLog({
      date,
      slotId: slot.id,
      itemId: nanoid(),
      itemName: name,
      plannedGrams: grams,
      actualGrams: grams,
      checked: false,
      isCustom: true,
    })
    markMealSaved(date, slot.id)
  }
  
  const handleSwitchSet = (setId: string) => {
    setSlotSet(date, slot.id, setId)
    showToast('已切换套餐', 'success')
  }
  
  const handleQuickCompleteAll = () => {
    const allChecked = tempEntries.every(e => 
      e.type === 'planned' ? e.log?.checked : e.log.checked
    )
    
    tempEntries.forEach((entry) => {
      const isPlanned = entry.type === 'planned'
      const item = isPlanned ? entry.item : null
      const log = isPlanned ? entry.log : entry.log
      
      upsertLog({
        date,
        slotId: slot.id,
        itemId: isPlanned ? item!.id : entry.log.itemId,
        itemName: isPlanned ? item!.name : entry.log.itemName,
        plannedGrams: isPlanned ? item!.grams : entry.log.plannedGrams,
        actualGrams: log?.actualGrams ?? (isPlanned ? item!.grams : entry.log.plannedGrams),
        checked: !allChecked,
        isCustom: !isPlanned,
        ...(log?.id && { id: log.id }),
      })
    })
    
    markMealSaved(date, slot.id)
    showToast(allChecked ? '已取消全部' : '已全部完成', 'success')
  }
  
  const allCompleted = tempEntries.length > 0 && tempEntries.every(e => 
    e.type === 'planned' ? e.log?.checked : e.log.checked
  )
  
  return (
    <div className="meal-detail-drawer">
      {/* Current set name */}
      <div className="drawer-current-set">
        当前套餐：<strong>{activeSetName}</strong>
      </div>
      
      {/* Set selector */}
      {allSets.length > 1 && (
        <div className="drawer-set-selector">
          <span className="drawer-set-label">切换套餐</span>
          <div className="drawer-set-chips">
            {allSets.map((set) => (
              <button
                key={set.id}
                type="button"
                className={`drawer-set-chip ${set.id === activeSetId ? 'is-active' : ''}`}
                onClick={() => handleSwitchSet(set.id)}
              >
                {set.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick complete all */}
      {tempEntries.length > 0 && (
        <button 
          type="button" 
          className={`drawer-quick-complete ${allCompleted ? 'is-complete' : ''}`}
          onClick={handleQuickCompleteAll}
        >
          {allCompleted ? '取消全部完成' : '一键全部完成'}
        </button>
      )}
      
      {/* Food list */}
      <div className="drawer-food-list">
        {tempEntries.map((entry) => {
          const isPlanned = entry.type === 'planned'
          const item = isPlanned ? entry.item : null
          const log = isPlanned ? entry.log : entry.log
          
          const name = isPlanned ? item!.name : entry.log.itemName
          const plannedG = isPlanned ? item!.grams : entry.log.plannedGrams
          const actualG = log?.actualGrams ?? plannedG
          const checked = log?.checked ?? false
          
          return (
            <div key={isPlanned ? item!.id : entry.log.id} className={`drawer-food-item ${checked ? 'is-checked' : ''}`}>
              <button
                type="button"
                className="drawer-food-check"
                onClick={() => handleToggle(entry)}
              >
                {checked ? '✓' : ''}
              </button>
              <div className="drawer-food-info">
                <span className="drawer-food-name">{name}</span>
                {plannedG > 0 && <span className="drawer-food-planned">计划 {plannedG}g</span>}
              </div>
              <div className="drawer-food-grams">
                <input
                  type="number"
                  value={actualG}
                  onChange={(e) => handleGramsChange(entry, parseInt(e.target.value, 10) || 0)}
                  min="0"
                />
                <span>g</span>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Add custom food */}
      <div className="drawer-add-section">
        <QuickAddFood 
          onAdd={handleAddCustom} 
          placeholder="添加临时食物" 
        />
      </div>
      
      {/* Done button */}
      <button type="button" className="drawer-done-btn" onClick={onClose}>
        完成
      </button>
    </div>
  )
}

// Main Today Page
export function TodayPageNew() {
  const settings = useSettings()
  const logs = useLogs()
  const savedMeals = useSavedMeals()
  const dailySetSelection = useDailySetSelection()
  
  const setLogs = useAppStore((state) => state.setLogs)
  const markMealSaved = useAppStore((state) => state.markMealSaved)
  
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  
  const date = todayStr()
  
  const plan = useMemo(
    () => settings ? getTodayPlan(settings, logs, date, dailySetSelection) : [],
    [settings, logs, date, dailySetSelection]
  )
  
  const savedSlotIds = savedMeals[date] ?? []
  
  // Calculate overall progress
  const { totalItems, completedItems } = useMemo(() => {
    let total = 0
    let completed = 0
    plan.forEach(({ entries }) => {
      entries.forEach((e) => {
        total++
        const checked = e.type === 'planned' ? e.log?.checked : e.log.checked
        if (checked) completed++
      })
    })
    return { totalItems: total, completedItems: completed }
  }, [plan])
  
  // Quick toggle from card
  const handleQuickToggle = useCallback((slotId: string, entry: TodayEntry) => {
    const isPlanned = entry.type === 'planned'
    const item = isPlanned ? entry.item : null
    const log = isPlanned ? entry.log : entry.log
    
    const newChecked = !(log?.checked ?? false)
    
    setLogs((prev) => {
      const match = (l: LogEntry) =>
        l.date === date &&
        l.slotId === slotId &&
        (isPlanned ? l.itemId === item!.id : l.id === entry.log.id)
      
      const rest = prev.filter((l) => !match(l))
      const existing = prev.find(match)
      
      const merged: LogEntry = {
        id: existing?.id ?? nanoid(),
        date,
        slotId,
        itemId: isPlanned ? item!.id : entry.log.itemId,
        itemName: isPlanned ? item!.name : entry.log.itemName,
        plannedGrams: isPlanned ? item!.grams : entry.log.plannedGrams,
        actualGrams: log?.actualGrams ?? (isPlanned ? item!.grams : entry.log.plannedGrams),
        checked: newChecked,
        isCustom: !isPlanned,
        ...(existing?.id && { id: existing.id }),
      }
      
      return [...rest, merged]
    })
    
    markMealSaved(date, slotId)
    
    if (newChecked) {
      showToast('已完成', 'success')
    }
  }, [date, setLogs, markMealSaved])
  
  const selectedSlot = plan.find((p) => p.slot.id === selectedSlotId)
  
  if (!settings) {
    return (
      <div className="page">
        <p className="muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="page today-page-v2">
      {/* Header with progress */}
      <div className="today-header-v2">
        <h1 className="title">今日</h1>
        <TodayProgress total={totalItems} completed={completedItems} />
      </div>
      
      {/* Meal cards */}
      <div className="meal-cards-v2">
        {plan.map(({ slot, entries, activeSetName }) => {
          const isSaved = savedSlotIds.includes(slot.id)
          const completed = entries.filter((e) => 
            (e.type === 'planned' ? e.log?.checked : e.log.checked) ?? false
          ).length
          
          return (
            <MealCard
              key={slot.id}
              slot={slot}
              entries={entries}
              activeSetName={activeSetName}
              isSaved={isSaved}
              progress={{ total: entries.length, completed }}
              onToggleCheck={(entry) => handleQuickToggle(slot.id, entry)}
              onOpenDetail={() => setSelectedSlotId(slot.id)}
            />
          )
        })}
      </div>
      
      {/* Detail Drawer */}
      <BottomSheet
        isOpen={!!selectedSlotId}
        onClose={() => setSelectedSlotId(null)}
        title={selectedSlot ? `${selectedSlot.slot.name} (${selectedSlot.slot.time})` : ''}
        height="auto"
      >
        {selectedSlot && (
          <MealDetailDrawer
            slot={selectedSlot.slot}
            entries={selectedSlot.entries}
            activeSetName={selectedSlot.activeSetName}
            activeSetId={selectedSlot.activeSetId}
            allSets={settings.recipeSets.map((s) => ({ id: s.id, name: s.name }))}
            onClose={() => setSelectedSlotId(null)}
          />
        )}
      </BottomSheet>
    </div>
  )
}
