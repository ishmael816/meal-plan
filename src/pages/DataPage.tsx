import { useMemo, useState } from 'react'
import type { LogEntry, PlanSettings } from '../types'

type Props = { logs: LogEntry[]; settings: PlanSettings }

const BOM = '\uFEFF'

function slotName(settings: PlanSettings, slotId: string): string {
  return settings.slots.find((s) => s.id === slotId)?.name ?? slotId
}

function toCSV(logs: LogEntry[], settings: PlanSettings): string {
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
  return [head, ...rows].map(line).join('\r\n')
}

function toJSON(logs: LogEntry[]): string {
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

/** 按日期分组，新日期在前 */
function groupByDate(logs: LogEntry[]): { date: string; items: LogEntry[] }[] {
  const map = new Map<string, LogEntry[]>()
  for (const l of logs) {
    const list = map.get(l.date) ?? []
    list.push(l)
    map.set(l.date, list)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }))
}

export function DataPage({ logs, settings }: Props) {
  const [format, setFormat] = useState<'json' | 'csv'>('csv')
  const groups = useMemo(() => groupByDate(logs), [logs])
  const csv = useMemo(() => toCSV(logs, settings), [logs, settings])
  const json = useMemo(() => toJSON(logs), [logs])

  const handleExport = () => {
    const d = new Date().toISOString().slice(0, 10)
    if (format === 'csv') {
      download(BOM + csv, `食谱记录_${d}.csv`, 'text/csv;charset=utf-8')
    } else {
      download(json, `食谱记录_${d}.json`, 'application/json')
    }
  }

  return (
    <div className="page">
      <h1 className="title">本地数据</h1>
      <p className="muted">
        已保存的用餐执行记录，共 {logs.length} 条。可导出为 CSV 或 JSON 用于制表或营养分析。
      </p>

      {groups.length === 0 ? (
        <div className="card data-empty">暂无记录，在「今日」中完成并保存餐次后会出现。</div>
      ) : (
        <div className="data-list">
          {groups.map(({ date, items }) => (
            <section key={date} className="card data-group">
              <div className="data-group-title">{date}</div>
              <ul className="data-rows">
                {items.map((l) => (
                  <li key={l.id} className="data-row">
                    <span className="data-slot">{slotName(settings, l.slotId)}</span>
                    <span className="data-name">{l.itemName}</span>
                    <span className="data-grams">
                      {l.actualGrams >= 0 ? `${l.actualGrams}g` : '–'}
                      {l.plannedGrams > 0 && ` / 计划${l.plannedGrams}g`}
                    </span>
                    {l.checked ? <span className="data-done">✓</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
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
