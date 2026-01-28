import { useState, useCallback } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import type { PlanSettings, LogEntry } from './types'
import type { DailySetSelection } from './todayPlan'
import { store } from './store'
import { useNotification } from './useNotification'
import { SettingsPage } from './pages/SettingsPage'
import { TodayListPage } from './pages/TodayListPage'
import { MealDetailPage } from './pages/MealDetailPage'
import { DataPage } from './pages/DataPage'
import './App.css'
import './pages.css'

function loadSettings(): PlanSettings {
  return store.getSettings()
}

function loadLogs(): LogEntry[] {
  return store.getLogs()
}

function loadSavedMeals(): Record<string, string[]> {
  return store.getSavedMeals()
}

function loadDailySetSelection(): DailySetSelection {
  return store.getDailySetSelection()
}

function App() {
  const [settings, setSettingsState] = useState<PlanSettings>(loadSettings)
  const [logs, setLogsState] = useState<LogEntry[]>(loadLogs)
  const [savedMeals, setSavedMealsState] = useState<Record<string, string[]>>(loadSavedMeals)
  const [dailySetSelection, setDailySetSelectionState] = useState<DailySetSelection>(loadDailySetSelection)

  const setSettings = useCallback((v: PlanSettings) => {
    setSettingsState(v)
    store.setSettings(v)
  }, [])

  const setLogs = useCallback((v: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => {
    setLogsState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      store.setLogs(next)
      return next
    })
  }, [])

  const setSavedMeals = useCallback((v: Record<string, string[]> | ((p: Record<string, string[]>) => Record<string, string[]>)) => {
    setSavedMealsState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      store.setSavedMeals(next)
      return next
    })
  }, [])

  const setDailySetSelection = useCallback((v: DailySetSelection | ((p: DailySetSelection) => DailySetSelection)) => {
    setDailySetSelectionState((prev) => {
      const next = typeof v === 'function' ? v(prev) : v
      store.setDailySetSelection(next)
      return next
    })
  }, [])

  useNotification(settings)

  return (
    <HashRouter>
      <div className="app">
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            今日
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            设置
          </NavLink>
          <NavLink to="/data" className={({ isActive }) => (isActive ? 'active' : '')}>
            数据
          </NavLink>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<TodayListPage settings={settings} logs={logs} savedMeals={savedMeals} dailySetSelection={dailySetSelection} />} />
            <Route path="/today/:slotId" element={<MealDetailPage settings={settings} logs={logs} setLogs={setLogs} savedMeals={savedMeals} setSavedMeals={setSavedMeals} dailySetSelection={dailySetSelection} setDailySetSelection={setDailySetSelection} />} />
            <Route path="/settings" element={<SettingsPage settings={settings} setSettings={setSettings} />} />
            <Route path="/data" element={<DataPage logs={logs} settings={settings} />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
