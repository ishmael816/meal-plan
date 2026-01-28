import type { PlanSettings, LogEntry, RecipeSet } from './types'

const SETTINGS_KEY = 'meal-plan-settings'
const LOGS_KEY = 'meal-plan-logs'
const SAVED_MEALS_KEY = 'meal-plan-saved-meals'
const DAILY_SET_KEY = 'meal-plan-daily-set'

const DEFAULT_SLOTS = [
  { id: 'breakfast', name: '早餐', time: '10:00' },
  { id: 'lunch', name: '午餐', time: '13:00' },
  { id: 'snack', name: '下午加餐', time: '15:00' },
  { id: 'dinner', name: '晚餐', time: '18:00' },
]

const DEFAULT_RECIPE_SET: RecipeSet = {
  id: 'default',
  name: '默认方案',
  itemsBySlot: {
    breakfast: [{ id: 'b1', name: '黑咖啡', grams: 0 }],
    lunch: [
      { id: 'l1', name: '牛肉', grams: 50 },
      { id: 'l2', name: '蔬菜', grams: 100 },
    ],
    snack: [{ id: 's1', name: '鸡胸肉', grams: 50 }],
    dinner: [{ id: 'd1', name: '豆皮', grams: 100 }],
  },
}

/** 兼容旧版：仅有 itemsBySlot 时转为 recipeSets */
function normalizeSettings(raw: Record<string, unknown>): PlanSettings {
  if (raw.slots && Array.isArray(raw.slots) && raw.recipeSets && Array.isArray(raw.recipeSets)) {
    const s = raw as unknown as PlanSettings
    return {
      slots: s.slots,
      recipeSets: s.recipeSets.length ? s.recipeSets : [DEFAULT_RECIPE_SET],
      defaultSetId: s.defaultSetId ?? (s.recipeSets[0]?.id ?? 'default'),
    }
  }
  const legacy = raw as unknown as { slots?: PlanSettings['slots']; itemsBySlot?: Record<string, unknown[]> }
  if (legacy.slots && legacy.itemsBySlot) {
    return {
      slots: legacy.slots,
      recipeSets: [{ id: 'default', name: '默认方案', itemsBySlot: legacy.itemsBySlot as RecipeSet['itemsBySlot'] }],
      defaultSetId: 'default',
    }
  }
  return {
    slots: DEFAULT_SLOTS,
    recipeSets: [DEFAULT_RECIPE_SET],
    defaultSetId: 'default',
  }
}

function getSettings(): PlanSettings {
  try {
    const s = localStorage.getItem(SETTINGS_KEY)
    if (s) return normalizeSettings(JSON.parse(s))
  } catch (_) {}
  return {
    slots: DEFAULT_SLOTS,
    recipeSets: [DEFAULT_RECIPE_SET],
    defaultSetId: 'default',
  }
}

function setSettings(settings: PlanSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function getLogs(): LogEntry[] {
  try {
    const s = localStorage.getItem(LOGS_KEY)
    if (s) return JSON.parse(s)
  } catch (_) {}
  return []
}

function setLogs(logs: LogEntry[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

function getSavedMeals(): Record<string, string[]> {
  try {
    const s = localStorage.getItem(SAVED_MEALS_KEY)
    if (s) return JSON.parse(s)
  } catch (_) {}
  return {}
}

function setSavedMeals(v: Record<string, string[]>): void {
  localStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(v))
}

function getDailySetSelection(): Record<string, Record<string, string>> {
  try {
    const s = localStorage.getItem(DAILY_SET_KEY)
    if (s) return JSON.parse(s)
  } catch (_) {}
  return {}
}

function setDailySetSelection(v: Record<string, Record<string, string>>): void {
  localStorage.setItem(DAILY_SET_KEY, JSON.stringify(v))
}

export const store = {
  getSettings,
  setSettings,
  getLogs,
  setLogs,
  getSavedMeals,
  setSavedMeals,
  getDailySetSelection,
  setDailySetSelection,
}
