import type { PlanSettings, LogEntry, RecipeSet } from './types'
import type { DailySetSelection } from './todayPlan'
import * as db from './db'

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

/** 兼容旧版数据格式 */
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

async function getSettings(): Promise<PlanSettings> {
  const settings = await db.getSettings()
  if (settings) {
    return normalizeSettings(settings as unknown as Record<string, unknown>)
  }
  return {
    slots: DEFAULT_SLOTS,
    recipeSets: [DEFAULT_RECIPE_SET],
    defaultSetId: 'default',
  }
}

async function setSettings(settings: PlanSettings): Promise<void> {
  await db.setSettings(settings)
}

async function getLogs(): Promise<LogEntry[]> {
  return db.getLogs()
}

async function setLogs(logs: LogEntry[]): Promise<void> {
  await db.setLogs(logs)
}

async function getSavedMeals(): Promise<Record<string, string[]>> {
  return db.getSavedMeals()
}

async function setSavedMeals(v: Record<string, string[]>): Promise<void> {
  await db.setSavedMeals(v)
}

async function getDailySetSelection(): Promise<DailySetSelection> {
  return db.getDailySetSelection()
}

async function setDailySetSelection(v: DailySetSelection): Promise<void> {
  await db.setDailySetSelection(v)
}

// Migration flag check
let migrationChecked = false

async function ensureMigrated(): Promise<void> {
  if (!migrationChecked) {
    await db.migrateFromLocalStorage()
    migrationChecked = true
  }
}

export const store = {
  getSettings: async () => {
    await ensureMigrated()
    return getSettings()
  },
  setSettings,
  getLogs: async () => {
    await ensureMigrated()
    return getLogs()
  },
  setLogs,
  getSavedMeals: async () => {
    await ensureMigrated()
    return getSavedMeals()
  },
  setSavedMeals,
  getDailySetSelection: async () => {
    await ensureMigrated()
    return getDailySetSelection()
  },
  setDailySetSelection,
}

// Re-export db for advanced usage
export { db }
