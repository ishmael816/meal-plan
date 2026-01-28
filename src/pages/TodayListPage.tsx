import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { PlanSettings, LogEntry } from '../types'
import { getTodayPlan, type DailySetSelection } from '../todayPlan'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

type Props = {
  settings: PlanSettings
  logs: LogEntry[]
  savedMeals: Record<string, string[]>
  dailySetSelection: DailySetSelection
}

export function TodayListPage({ settings, logs, savedMeals, dailySetSelection }: Props) {
  const date = todayStr()
  const plan = useMemo(() => getTodayPlan(settings, logs, date, dailySetSelection), [settings, logs, date, dailySetSelection])
  const savedSlotIds = savedMeals[date] ?? []

  return (
    <div className="page">
      <h1 className="title">今日执行</h1>
      <p className="muted">点击进入某一餐，可左右滑动切换该餐使用的套餐，打勾与调整后点击「保存」。</p>

      <div className="meal-cards">
        {plan.map(({ slot, entries, activeSetName }) => {
          const saved = savedSlotIds.includes(slot.id)
          const doneCount = entries.filter(
            (e) => (e.type === 'planned' ? e.log?.checked : e.log.checked) ?? false
          ).length
          return (
            <Link
              key={slot.id}
              to={`/today/${slot.id}`}
              className={`meal-card ${saved ? 'meal-card-saved' : ''}`}
            >
              <div className="meal-card-header">
                <span className="meal-card-name">{slot.name}</span>
                <span className="meal-card-time">{slot.time}</span>
              </div>
              <div className="meal-card-meta">
                {saved ? (
                  <span className="meal-card-badge saved">已保存</span>
                ) : (
                  <span className="meal-card-badge unsaved">未保存</span>
                )}
                <span className="meal-card-set" title="当前套餐">{activeSetName}</span>
                <span className="meal-card-count">
                  {doneCount}/{entries.length} 项
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
