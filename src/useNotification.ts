import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import type { PlanSettings } from './types'
import { getDefaultItemsBySlot } from './todayPlan'

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** 从 "HH:mm" 解析出 hour、minute（0-23, 0-59） */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h ?? 0, minute: m ?? 0 }
}

/** 为每个 slot 生成稳定的通知 ID（Android 需 32 位整数，避免与其它冲突） */
function slotNotificationId(_slotId: string, index: number): number {
  const base = 2000
  return base + index
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
    const { hour, minute } = parseTime(slot.time)
    const items = (itemsBySlot[slot.id] ?? []).map((i) => i.name).join('、')
    return {
      id: slotNotificationId(slot.id, index),
      title: '食谱小助手',
      body: `该吃「${slot.name}」啦${items ? `：${items}` : ''}`,
      channelId: 'meal-reminder',
      schedule: {
        on: { hour, minute },
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
      setupNativeNotifications(settings).catch((err) => {
        console.warn('用餐提醒注册失败:', err)
      })
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
