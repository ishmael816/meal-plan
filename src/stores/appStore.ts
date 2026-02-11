import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlanSettings, LogEntry } from '../types'
import type { DailySetSelection } from '../todayPlan'
import { store } from '../store'

// Debounce helper with proper typing
function debounce<T extends (...args: never[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

interface AppState {
  // Data
  settings: PlanSettings | null
  logs: LogEntry[]
  savedMeals: Record<string, string[]>
  dailySetSelection: DailySetSelection
  
  // Loading state
  isLoading: boolean
  isInitialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  setSettings: (settings: PlanSettings) => void
  setLogs: (logs: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => void
  addLog: (log: LogEntry) => void
  updateLog: (id: string, updates: Partial<LogEntry>) => void
  deleteLog: (id: string) => void
  setSavedMeals: (meals: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void
  markMealSaved: (date: string, slotId: string) => void
  setDailySetSelection: (selection: DailySetSelection | ((prev: DailySetSelection) => DailySetSelection)) => void
  setSlotSet: (date: string, slotId: string, setId: string) => void
}

// Debounced save functions
const debouncedSaveSettings = debounce((settings: PlanSettings) => {
  store.setSettings(settings).catch(console.error)
}, 300)

const debouncedSaveLogs = debounce((logs: LogEntry[]) => {
  store.setLogs(logs).catch(console.error)
}, 300)

const debouncedSaveSavedMeals = debounce((meals: Record<string, string[]>) => {
  store.setSavedMeals(meals).catch(console.error)
}, 300)

const debouncedSaveDailySet = debounce((selection: DailySetSelection) => {
  store.setDailySetSelection(selection).catch(console.error)
}, 300)

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      settings: null,
      logs: [],
      savedMeals: {},
      dailySetSelection: {},
      isLoading: true,
      isInitialized: false,

      // Initialize from IndexedDB
      initialize: async () => {
        set({ isLoading: true })
        try {
          const [settings, logs, savedMeals, dailySetSelection] = await Promise.all([
            store.getSettings(),
            store.getLogs(),
            store.getSavedMeals(),
            store.getDailySetSelection(),
          ])
          set({
            settings,
            logs,
            savedMeals,
            dailySetSelection,
            isLoading: false,
            isInitialized: true,
          })
        } catch (error) {
          console.error('Failed to initialize store:', error)
          set({ isLoading: false })
        }
      },

      // Settings actions
      setSettings: (settings) => {
        set({ settings })
        debouncedSaveSettings(settings)
      },

      // Logs actions
      setLogs: (logsOrFn) => {
        set((state) => {
          const newLogs = typeof logsOrFn === 'function' ? logsOrFn(state.logs) : logsOrFn
          debouncedSaveLogs(newLogs)
          return { logs: newLogs }
        })
      },

      addLog: (log) => {
        set((state) => {
          const newLogs = [...state.logs, log]
          debouncedSaveLogs(newLogs)
          return { logs: newLogs }
        })
      },

      updateLog: (id, updates) => {
        set((state) => {
          const newLogs = state.logs.map((log) =>
            log.id === id ? { ...log, ...updates } : log
          )
          debouncedSaveLogs(newLogs)
          return { logs: newLogs }
        })
      },

      deleteLog: (id) => {
        set((state) => {
          const newLogs = state.logs.filter((log) => log.id !== id)
          debouncedSaveLogs(newLogs)
          return { logs: newLogs }
        })
      },

      // Saved meals actions
      setSavedMeals: (mealsOrFn) => {
        set((state) => {
          const newMeals = typeof mealsOrFn === 'function' ? mealsOrFn(state.savedMeals) : mealsOrFn
          debouncedSaveSavedMeals(newMeals)
          return { savedMeals: newMeals }
        })
      },

      markMealSaved: (date, slotId) => {
        set((state) => {
          const list = state.savedMeals[date] ?? []
          if (list.includes(slotId)) return state
          const newMeals = { ...state.savedMeals, [date]: [...list, slotId] }
          debouncedSaveSavedMeals(newMeals)
          return { savedMeals: newMeals }
        })
      },

      // Daily set selection actions
      setDailySetSelection: (selectionOrFn) => {
        set((state) => {
          const newSelection = typeof selectionOrFn === 'function' 
            ? selectionOrFn(state.dailySetSelection) 
            : selectionOrFn
          debouncedSaveDailySet(newSelection)
          return { dailySetSelection: newSelection }
        })
      },

      setSlotSet: (date, slotId, setId) => {
        set((state) => {
          const newSelection = {
            ...state.dailySetSelection,
            [date]: { ...(state.dailySetSelection[date] ?? {}), [slotId]: setId },
          }
          debouncedSaveDailySet(newSelection)
          return { dailySetSelection: newSelection }
        })
      },
    }),
    {
      name: 'meal-plan-store',
      // Only persist lightweight state to localStorage as backup
      partialize: (state) => ({
        isInitialized: state.isInitialized,
      }),
    }
  )
)

// Selector hooks for better performance
export const useSettings = () => useAppStore((state) => state.settings)
export const useLogs = () => useAppStore((state) => state.logs)
export const useSavedMeals = () => useAppStore((state) => state.savedMeals)
export const useDailySetSelection = () => useAppStore((state) => state.dailySetSelection)
export const useIsLoading = () => useAppStore((state) => state.isLoading)
export const useIsInitialized = () => useAppStore((state) => state.isInitialized)
