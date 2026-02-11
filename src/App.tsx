import { useEffect } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useAppStore, useIsLoading, useSettings } from './stores/appStore'
import { useNotification } from './useNotification'
import { BackButtonHandler } from './BackButtonHandler'
import { ToastContainer } from './components/Toast'
import { SettingsPage } from './pages/SettingsPage'
import { TodayPageNew } from './pages/TodayPageNew'
import { MealDetailPage } from './pages/MealDetailPage'
import { DataPage } from './pages/DataPage'
import './App.css'
import './pages.css'

function App() {
  const initialize = useAppStore((state) => state.initialize)
  const isLoading = useIsLoading()
  const settings = useSettings()
  
  // Initialize store on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Setup notifications when settings are loaded
  useNotification(settings)

  if (isLoading || !settings) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <HashRouter>
      <BackButtonHandler />
      <ToastContainer />
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
            <Route path="/" element={<TodayPageNew />} />
            <Route path="/today/:slotId" element={<MealDetailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/data" element={<DataPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
