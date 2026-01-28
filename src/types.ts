/** 餐次名称的常用枚举，用户可从中快速选择或自定义其它名称 */
export const SLOT_NAME_SUGGESTIONS = ['早餐', '午餐', '晚餐', '下午加餐', '夜宵'] as const

/** 一顿餐的时段（名称可从枚举选或自定义，如 早餐、夜宵） */
export interface MealSlot {
  id: string
  name: string
  time: string       // "HH:mm"
}

/** 食谱中的一项（某食物 + 克数） */
export interface MealItem {
  id: string
  name: string
  grams: number
}

/** 一套食谱方案：为每个餐次定义吃什么 */
export interface RecipeSet {
  id: string
  name: string       // 如 "减脂方案"、"日常"
  itemsBySlot: Record<string, MealItem[]>  // slotId -> 该餐下的食物列表
}

/** 某一天的执行记录 */
export interface LogEntry {
  id: string
  date: string
  slotId: string
  itemId: string
  itemName: string
  plannedGrams: number
  actualGrams: number
  checked: boolean
  isCustom: boolean
}

/** 每日每餐所选食谱方案：date -> slotId -> setId */
export type DailySetSelection = Record<string, Record<string, string>>

/** 用户设置：餐次列表 + 多套食谱 + 默认套餐 */
export interface PlanSettings {
  slots: MealSlot[]
  recipeSets: RecipeSet[]
  defaultSetId: string | null   // 新建某日某餐时优先使用的套餐 id
}

export type ExportFormat = 'json' | 'csv'
