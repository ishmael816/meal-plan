import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { PlanSettings, LogEntry } from './types'
import type { DailySetSelection } from './todayPlan'

interface MealPlanDB extends DBSchema {
  settings: {
    key: string
    value: PlanSettings & { id: string }
  }
  logs: {
    key: string
    value: LogEntry
    indexes: {
      'by-date': string
      'by-date-slot': [string, string]
    }
  }
  meta: {
    key: string
    value: unknown
  }
}

const DB_NAME = 'meal-plan-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<MealPlanDB>> | null = null

function getDB(): Promise<IDBPDatabase<MealPlanDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MealPlanDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' })
        }
        // Logs store with indexes
        if (!db.objectStoreNames.contains('logs')) {
          const logStore = db.createObjectStore('logs', { keyPath: 'id' })
          logStore.createIndex('by-date', 'date')
          logStore.createIndex('by-date-slot', ['date', 'slotId'])
        }
        // Meta store for misc data
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta')
        }
      },
    })
  }
  return dbPromise
}

// Settings
export async function getSettings(): Promise<PlanSettings | undefined> {
  const db = await getDB()
  const data = await db.get('settings', 'main')
  if (data) {
    const { id, ...settings } = data
    return settings
  }
  return undefined
}

export async function setSettings(settings: PlanSettings): Promise<void> {
  const db = await getDB()
  await db.put('settings', { ...settings, id: 'main' })
}

// Logs
export async function getLogs(): Promise<LogEntry[]> {
  const db = await getDB()
  return db.getAll('logs')
}

export async function getLogsByDate(date: string): Promise<LogEntry[]> {
  const db = await getDB()
  const tx = db.transaction('logs')
  const index = tx.store.index('by-date')
  return index.getAll(date)
}

export async function getLogsByDateAndSlot(date: string, slotId: string): Promise<LogEntry[]> {
  const db = await getDB()
  const tx = db.transaction('logs')
  const index = tx.store.index('by-date-slot')
  return index.getAll([date, slotId])
}

export async function setLogs(logs: LogEntry[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('logs', 'readwrite')
  await tx.store.clear()
  for (const log of logs) {
    await tx.store.put(log)
  }
  await tx.done
}

export async function addLog(log: LogEntry): Promise<void> {
  const db = await getDB()
  await db.put('logs', log)
}

export async function updateLog(id: string, updates: Partial<LogEntry>): Promise<void> {
  const db = await getDB()
  const existing = await db.get('logs', id)
  if (existing) {
    await db.put('logs', { ...existing, ...updates })
  }
}

export async function deleteLog(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('logs', id)
}

// Daily set selection
export async function getDailySetSelection(): Promise<DailySetSelection> {
  const db = await getDB()
  const data = await db.get('meta', 'dailySetSelection')
  return (data as DailySetSelection) || {}
}

export async function setDailySetSelection(selection: DailySetSelection): Promise<void> {
  const db = await getDB()
  await db.put('meta', selection, 'dailySetSelection')
}

// Saved meals tracking
export async function getSavedMeals(): Promise<Record<string, string[]>> {
  const db = await getDB()
  const data = await db.get('meta', 'savedMeals')
  return (data as Record<string, string[]>) || {}
}

export async function setSavedMeals(meals: Record<string, string[]>): Promise<void> {
  const db = await getDB()
  await db.put('meta', meals, 'savedMeals')
}

// Migration from localStorage
export async function migrateFromLocalStorage(): Promise<void> {
  const SETTINGS_KEY = 'meal-plan-settings'
  const LOGS_KEY = 'meal-plan-logs'
  const SAVED_MEALS_KEY = 'meal-plan-saved-meals'
  const DAILY_SET_KEY = 'meal-plan-daily-set'

  try {
    const settingsJson = localStorage.getItem(SETTINGS_KEY)
    const logsJson = localStorage.getItem(LOGS_KEY)
    const savedMealsJson = localStorage.getItem(SAVED_MEALS_KEY)
    const dailySetJson = localStorage.getItem(DAILY_SET_KEY)

    if (settingsJson) {
      const settings = JSON.parse(settingsJson)
      await setSettings(settings)
      localStorage.removeItem(SETTINGS_KEY)
    }

    if (logsJson) {
      const logs = JSON.parse(logsJson)
      await setLogs(logs)
      localStorage.removeItem(LOGS_KEY)
    }

    if (savedMealsJson) {
      const savedMeals = JSON.parse(savedMealsJson)
      await setSavedMeals(savedMeals)
      localStorage.removeItem(SAVED_MEALS_KEY)
    }

    if (dailySetJson) {
      const dailySet = JSON.parse(dailySetJson)
      await setDailySetSelection(dailySet)
      localStorage.removeItem(DAILY_SET_KEY)
    }

    console.log('[DB] Migration from localStorage completed')
  } catch (err) {
    console.warn('[DB] Migration failed:', err)
  }
}

// Export for direct access if needed
export { getDB }
