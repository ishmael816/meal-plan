import type { PlanSettings, LogEntry, MealSlot, MealItem } from './types'

export type TodayEntry =
  | { type: 'planned'; item: MealItem; log?: LogEntry; isCustom: false }
  | { type: 'custom'; log: LogEntry; isCustom: true }

export type SlotView = { slot: MealSlot; entries: TodayEntry[]; activeSetId: string; activeSetName: string }

/** 每日每餐所选套餐：date -> slotId -> setId；不传则用 settings.defaultSetId / 第一套 */
export type DailySetSelection = Record<string, Record<string, string>>

function getSelectedSetId(
  settings: PlanSettings,
  date: string,
  slotId: string,
  dailySetSelection: DailySetSelection | undefined
): string {
  const sid = dailySetSelection?.[date]?.[slotId]
  if (sid && settings.recipeSets.some((s) => s.id === sid)) return sid
  if (settings.defaultSetId && settings.recipeSets.some((s) => s.id === settings.defaultSetId)) return settings.defaultSetId!
  return settings.recipeSets[0]?.id ?? 'default'
}

export function getTodayPlan(
  settings: PlanSettings,
  logs: LogEntry[],
  date: string,
  dailySetSelection?: DailySetSelection
): SlotView[] {
  const bySlot = new Map<string, LogEntry[]>()
  for (const log of logs) {
    if (log.date !== date) continue
    const list = bySlot.get(log.slotId) ?? []
    list.push(log)
    bySlot.set(log.slotId, list)
  }

  return settings.slots.map((slot) => {
    const activeSetId = getSelectedSetId(settings, date, slot.id, dailySetSelection)
    const set = settings.recipeSets.find((s) => s.id === activeSetId)
    const plannedItems = set?.itemsBySlot[slot.id] ?? []
    const slotLogs = bySlot.get(slot.id) ?? []
    const entries: TodayEntry[] = []

    for (const item of plannedItems) {
      const log = slotLogs.find((l) => l.itemId === item.id && !l.isCustom)
      entries.push({ type: 'planned', item, log, isCustom: false })
    }
    for (const log of slotLogs.filter((l) => l.isCustom)) {
      entries.push({ type: 'custom', log, isCustom: true })
    }

    return {
      slot,
      entries,
      activeSetId,
      activeSetName: set?.name ?? '默认',
    }
  })
}

/** 供通知等使用：按默认套餐取每餐食物列表 */
export function getDefaultItemsBySlot(settings: PlanSettings): Record<string, MealItem[]> {
  const set = settings.defaultSetId
    ? settings.recipeSets.find((s) => s.id === settings.defaultSetId)
    : settings.recipeSets[0]
  return set?.itemsBySlot ?? {}
}
