import type { LogEntry } from '../types'
import type { TodayEntry, SlotView } from '../todayPlan'

export type SlotBlockProps = {
  slot: SlotView['slot']
  entries: TodayEntry[]
  date: string
  onUpsert: (e: Partial<LogEntry> & { date: string; slotId: string }) => void
  onRemove: (id: string) => void
  onAddCustom: () => void
}

export function SlotBlock({ slot, entries, date, onUpsert, onRemove, onAddCustom }: SlotBlockProps) {
  return (
    <section className="card today-slot">
      <div className="today-slot-header">
        <span className="today-slot-name">{slot.name}</span>
        <span className="today-slot-time">{slot.time}</span>
      </div>
      <ul className="today-entries">
        {entries.map((e) => (
          <EntryRow
            key={e.type === 'planned' ? e.item.id : e.log.id}
            entry={e}
            date={date}
            slotId={slot.id}
            onUpsert={onUpsert}
            onRemove={onRemove}
          />
        ))}
      </ul>
      <button type="button" className="btn-add-item" onClick={onAddCustom}>
        + 添加本餐食物
      </button>
    </section>
  )
}

type EntryRowProps = {
  entry: TodayEntry
  date: string
  slotId: string
  onUpsert: (e: Partial<LogEntry> & { date: string; slotId: string }) => void
  onRemove: (id: string) => void
}

function EntryRow({ entry, date, slotId, onUpsert, onRemove }: EntryRowProps) {
  const isPlanned = entry.type === 'planned'
  const item = isPlanned ? entry.item : null
  const log = isPlanned ? entry.log : entry.log

  const name = isPlanned ? item!.name : entry.log.itemName
  const plannedG = isPlanned ? item!.grams : entry.log.plannedGrams
  const plannedGDisplay = isPlanned ? plannedG : 0
  const actualG = log?.actualGrams ?? plannedG
  const checked = log?.checked ?? false
  const itemId = isPlanned ? item!.id : entry.log.itemId
  const logId = log?.id

  const setChecked = (v: boolean) => {
    onUpsert({
      date,
      slotId,
      itemId,
      itemName: name,
      plannedGrams: plannedG,
      actualGrams: actualG < 0 ? plannedG : actualG,
      checked: v,
      isCustom: !isPlanned,
      ...(logId && { id: logId }),
    })
  }

  const setActualGrams = (g: number) => {
    onUpsert({
      date,
      slotId,
      itemId,
      itemName: name,
      plannedGrams: plannedG,
      actualGrams: g,
      checked,
      isCustom: !isPlanned,
      ...(logId && { id: logId }),
    })
  }

  return (
    <li className={`today-entry ${!isPlanned ? 'today-entry--custom' : ''}`}>
      <label className="today-check">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="checkmark" />
      </label>
      <div className="today-entry-body">
        <div className="today-entry-name">{name}</div>
        {plannedGDisplay > 0 ? (
          <div className="today-grams-row">
            <input
              type="range"
              min={0}
              max={Math.max(plannedG * 2, 200)}
              step={5}
              value={actualG < 0 ? 0 : actualG}
              onChange={(e) => setActualGrams(+e.target.value)}
              className="today-slider"
            />
            <span className="today-grams-val">{actualG < 0 ? 0 : actualG} g</span>
          </div>
        ) : (
          <div className="today-grams-row">
            <input
              type="number"
              min={0}
              className={`item-grams ${!isPlanned ? 'item-grams--custom' : ''}`}
              value={actualG < 0 ? '' : actualG}
              onChange={(e) => setActualGrams(+e.target.value || 0)}
              placeholder="克数"
            />
            <span className={`unit ${!isPlanned ? 'unit--custom' : ''}`}>g</span>
            {!isPlanned && (
              <span className="today-planned-hint">计划 0g</span>
            )}
          </div>
        )}
      </div>
      {!isPlanned && logId && (
        <button type="button" className="btn-ghost" onClick={() => onRemove(logId)} title="删除">
          删
        </button>
      )}
    </li>
  )
}
