import { useMemo, useState } from 'react'
import { useLogs, useSettings } from '../stores/appStore'

function slotName(settings: { slots: { id: string; name: string }[] }, slotId: string): string {
  return settings.slots.find((s) => s.id === slotId)?.name ?? slotId
}

function toCSV(logs: ReturnType<typeof useLogs>, settings: NonNullable<ReturnType<typeof useSettings>>): string {
  const BOM = '\uFEFF'
  const head = ['日期', '餐次', '食物名称', '计划克数', '实际克数', '已完成', '自定义项']
  const rows = logs.map((l) => [
    l.date,
    slotName(settings, l.slotId),
    l.itemName,
    String(l.plannedGrams),
    String(l.actualGrams < 0 ? '' : l.actualGrams),
    l.checked ? '是' : '否',
    l.isCustom ? '是' : '否',
  ])
  const line = (arr: string[]) =>
    arr.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
  return BOM + [head, ...rows].map(line).join('\r\n')
}

function toJSON(logs: ReturnType<typeof useLogs>): string {
  return JSON.stringify(logs, null, 2)
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Group by date, newest first */
function groupByDate(logs: ReturnType<typeof useLogs>): { date: string; items: typeof logs }[] {
  const map = new Map<string, typeof logs>()
  for (const l of logs) {
    const list = map.get(l.date) ?? []
    list.push(l)
    map.set(l.date, list)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }))
}

/** Get all days in a month */
function getCalendarDays(year: number, month: number): Date[] {
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }
  return days
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getDayOfWeek(date: Date): number {
  return date.getDay()
}

export function DataPage() {
  const settings = useSettings()
  const logs = useLogs()
  const [format, setFormat] = useState<'json' | 'csv'>('csv')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  
  const groups = useMemo(() => groupByDate(logs), [logs])
  const csv = useMemo(() => settings ? toCSV(logs, settings) : '', [logs, settings])
  const json = useMemo(() => toJSON(logs), [logs])
  
  const datesWithData = useMemo(() => {
    return new Set(logs.map((l) => l.date))
  }, [logs])
  
  const calendarDays = useMemo(() => {
    return getCalendarDays(currentMonth.year, currentMonth.month)
  }, [currentMonth])
  
  const selectedDateData = useMemo(() => {
    if (!selectedDate) return null
    return groups.find((g) => g.date === selectedDate)?.items ?? []
  }, [selectedDate, groups])
  
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 }
      }
      return { year: prev.year, month: prev.month - 1 }
    })
  }
  
  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 }
      }
      return { year: prev.year, month: prev.month + 1 }
    })
  }
  
  const goToToday = () => {
    const now = new Date()
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() })
    setSelectedDate(formatDate(now))
  }

  const handleExport = () => {
    const d = new Date().toISOString().slice(0, 10)
    if (format === 'csv') {
      download(csv, `食谱记录_${d}.csv`, 'text/csv;charset=utf-8')
    } else {
      download(json, `食谱记录_${d}.json`, 'application/json')
    }
  }
  
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  if (!settings) {
    return (
      <div className="page">
        <p className="muted">加载中...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="title">本地数据</h1>
      <p className="muted">
        已保存的用餐执行记录，共 {logs.length} 条。点击日历中的日期查看详情。
      </p>

      {groups.length === 0 ? (
        <div className="card data-empty">暂无记录，在「今日」中完成并保存餐次后会出现。</div>
      ) : (
        <>
          {/* Calendar View */}
          <div className="card calendar-card">
            <div className="calendar-header">
              <button type="button" className="btn-calendar-nav" onClick={goToPrevMonth}>
                ‹
              </button>
              <div className="calendar-month-title">
                {currentMonth.year}年 {monthNames[currentMonth.month]}
              </div>
              <button type="button" className="btn-calendar-nav" onClick={goToNextMonth}>
                ›
              </button>
            </div>
            <button type="button" className="btn-calendar-today" onClick={goToToday}>
              今天
            </button>
            
            <div className="calendar-weekdays">
              {weekDays.map((day) => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            
            <div className="calendar-grid">
              {Array.from({ length: getDayOfWeek(calendarDays[0]) }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}
              
              {calendarDays.map((date) => {
                const dateStr = formatDate(date)
                const hasData = datesWithData.has(dateStr)
                const isToday = dateStr === formatDate(new Date())
                const isSelected = selectedDate === dateStr
                
                return (
                  <button
                    key={dateStr}
                    type="button"
                    className={`calendar-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <span className="calendar-day-number">{date.getDate()}</span>
                    {hasData && <span className="calendar-day-dot"></span>}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Selected date details */}
          {selectedDate && selectedDateData != null && selectedDateData.length > 0 && (
            <section className="card data-group">
              <div className="data-group-title">{selectedDate}</div>
              <ul className="data-rows">
                {selectedDateData.map((l) => (
                  <li key={l.id} className="data-row">
                    <span className="data-slot">{slotName(settings, l.slotId)}</span>
                    <span className="data-name">{l.itemName}</span>
                    <span className={`data-grams ${l.isCustom ? 'data-grams--custom' : ''}`}>
                      {l.actualGrams >= 0 ? `${l.actualGrams}g` : '–'}
                      {l.isCustom ? ' / 计划0g' : (l.plannedGrams > 0 ? ` / 计划${l.plannedGrams}g` : '')}
                    </span>
                    {l.checked ? <span className="data-done">✓</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
          
          {selectedDate && selectedDateData != null && selectedDateData.length === 0 && (
            <div className="card data-empty">该日期暂无记录</div>
          )}
        </>
      )}

      <div className="card data-export">
        <div className="export-format">
          <label className="radio">
            <input
              type="radio"
              name="format"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
            />
            <span>CSV（适合 Excel / 制表）</span>
          </label>
          <label className="radio">
            <input
              type="radio"
              name="format"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
            />
            <span>JSON（适合程序分析）</span>
          </label>
        </div>
        <button type="button" className="btn-primary block" onClick={handleExport}>
          导出下载
        </button>
      </div>
    </div>
  )
}
