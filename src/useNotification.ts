import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import type { PlanSettings } from './types'
import { getDefaultItemsBySlot } from './todayPlan'

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** 下一个触发时刻：今日该时间，若已过则改为明日 */
function nextAt(timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const at = new Date()
  at.setHours(h ?? 0, m ?? 0, 0, 0)
  if (at.getTime() <= Date.now()) {
    at.setDate(at.getDate() + 1)
  }
  return at
}

async function setupNativeNotifications(settings: PlanSettings) {
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  const permission = await LocalNotifications.requestPermissions()
  if (permission.display === 'denied') return

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: 'meal-reminder',
      name: '用餐提醒',
      importance: 4,
      description: '到点提醒该吃的餐次',
    })
  }

  const pending = await LocalNotifications.getPending()
  const toCancel = (pending.notifications ?? []).map((n) => ({ id: n.id }))
  if (toCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: toCancel })
  }

  const itemsBySlot = getDefaultItemsBySlot(settings)
  const notifications = settings.slots.map((slot, index) => {
    const at = nextAt(slot.time)
    const items = (itemsBySlot[slot.id] ?? []).map((i) => i.name).join('、')
    return {
      id: index + 1,
      title: '食谱小助手',
      body: `该吃「${slot.name}」啦${items ? `：${items}` : ''}`,
      channelId: 'meal-reminder',
      schedule: {
        at,
        repeats: true,
        allowWhileIdle: true,
      },
    }
  })

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

export function useNotification(settings: PlanSettings) {
  const notified = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setupNativeNotifications(settings).catch(() => {})
      return
    }

    if (!('Notification' in window)) return

    const check = () => {
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      const currentMinutes = now.getHours() * 60 + now.getMinutes()

      for (const slot of settings.slots) {
        const slotMinutes = toMinutes(slot.time)
        const key = `${today}-${slot.id}`
        if (notified.current.has(key)) continue
        if (Math.abs(currentMinutes - slotMinutes) <= 1) {
          notified.current.add(key)
          if (Notification.permission === 'granted') {
            const itemsBySlot = getDefaultItemsBySlot(settings)
            new Notification('食谱小助手', {
              body: `该吃「${slot.name}」啦：${(itemsBySlot[slot.id] ?? []).map((i) => i.name).join('、')}`,
            })
          }
        }
      }
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    check()
    const id = setInterval(check, 60 * 1000)
    return () => clearInterval(id)
  }, [settings])
}
