import { useEffect, useRef, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import type { PlanSettings } from './types'
import { getDefaultItemsBySlot } from './todayPlan'

function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function parseTime(timeStr: string): { hour: number; minute: number } {
  const [h, m] = timeStr.split(':').map(Number)
  return { hour: h ?? 0, minute: m ?? 0 }
}

function slotNotificationId(_slotId: string, index: number): number {
  const base = 2000
  return base + index
}

/** Check if two times are within a threshold (in minutes) */
function isWithinTimeWindow(current: number, target: number, threshold: number = 1): boolean {
  // Handle day boundary (e.g., 23:59 vs 00:00)
  const diff = Math.abs(current - target)
  const wrapDiff = Math.abs(24 * 60 - diff)
  return Math.min(diff, wrapDiff) <= threshold
}

/** Format food items for notification body */
function formatNotificationBody(slotName: string, itemsBySlot: Record<string, { name: string }[]>, slotId: string): string {
  const items = (itemsBySlot[slotId] ?? []).map((i) => i.name).join('、')
  return items ? `该吃「${slotName}」啦：${items}` : `该吃「${slotName}」啦`
}

// Native Android notifications
async function setupNativeNotifications(settings: PlanSettings) {
  const { LocalNotifications } = await import('@capacitor/local-notifications')

  const permission = await LocalNotifications.requestPermissions()
  if (permission.display === 'denied') {
    console.warn('[Notification] Permission denied')
    return
  }

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: 'meal-reminder',
      name: '用餐提醒',
      importance: 4,
      description: '到点提醒该吃的餐次',
    })
  }

  // Cancel existing notifications
  const pending = await LocalNotifications.getPending()
  const toCancel = (pending.notifications ?? []).map((n) => ({ id: n.id }))
  if (toCancel.length > 0) {
    await LocalNotifications.cancel({ notifications: toCancel })
  }

  const itemsBySlot = getDefaultItemsBySlot(settings)
  
  // Schedule notifications for each slot
  const notifications = settings.slots.map((slot, index) => {
    const { hour, minute } = parseTime(slot.time)
    return {
      id: slotNotificationId(slot.id, index),
      title: '食谱小助手',
      body: formatNotificationBody(slot.name, itemsBySlot, slot.id),
      channelId: 'meal-reminder',
      schedule: {
        on: { hour, minute },
        allowWhileIdle: true,
        // Repeat daily
        repeats: true,
      },
    }
  })

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
    console.log('[Notification] Scheduled', notifications.length, 'notifications')
  }
}

// Web notification with Page Visibility API
function useWebNotification(settings: PlanSettings) {
  const notifiedSlots = useRef<Set<string>>(new Set())
  const checkIntervalId = useRef<number | null>(null)
  const isVisible = useRef(true)

  const clearOldNotifications = useCallback(() => {
    // Clear notifications from previous days
    const today = new Date().toISOString().slice(0, 10)
    for (const key of notifiedSlots.current) {
      if (!key.startsWith(today)) {
        notifiedSlots.current.delete(key)
      }
    }
  }, [])

  const checkNotifications = useCallback(() => {
    if (!('Notification' in window)) return

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const itemsBySlot = getDefaultItemsBySlot(settings)

    clearOldNotifications()

    for (const slot of settings.slots) {
      const slotMinutes = toMinutes(slot.time)
      const key = `${today}-${slot.id}`
      
      if (notifiedSlots.current.has(key)) continue
      
      if (isWithinTimeWindow(currentMinutes, slotMinutes, 1)) {
        notifiedSlots.current.add(key)
        
        if (Notification.permission === 'granted') {
          const notification = new Notification('食谱小助手', {
            body: formatNotificationBody(slot.name, itemsBySlot, slot.id),
            icon: '/icon.png',
            badge: '/badge.png',
            tag: key, // Prevent duplicate notifications
            requireInteraction: false,
          })
          
          // Auto close after 10 seconds
          setTimeout(() => notification.close(), 10000)
        }
      }
    }
  }, [settings, clearOldNotifications])

  useEffect(() => {
    if (!('Notification' in window)) return

    // Request permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('[Notification] Permission:', permission)
      })
    }

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible'
      
      // Check immediately when becoming visible
      if (isVisible.current) {
        checkNotifications()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Check immediately and set interval
    checkNotifications()
    checkIntervalId.current = window.setInterval(checkNotifications, 30 * 1000) // Check every 30s

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (checkIntervalId.current) {
        clearInterval(checkIntervalId.current)
      }
    }
  }, [checkNotifications])
}

export function useNotification(settings: PlanSettings | null) {
  useEffect(() => {
    if (!settings) return

    if (Capacitor.isNativePlatform()) {
      setupNativeNotifications(settings).catch((err) => {
        console.warn('[Notification] Setup failed:', err)
      })
    }
    // Web notifications are handled by the hook below
  }, [settings])

  // Use web notification hook
  useWebNotification(settings ?? { slots: [], recipeSets: [], defaultSetId: null })
}

/** Utility to test notification (can be called from console) */
export async function testNotification(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await LocalNotifications.schedule({
      notifications: [{
        id: 9999,
        title: '测试通知',
        body: '这是一条测试通知',
        schedule: { at: new Date(Date.now() + 1000) },
      }]
    })
  } else if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('测试通知', { body: '这是一条测试通知' })
  } else {
    alert('通知权限未授予')
  }
}

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { testNotification: typeof testNotification }).testNotification = testNotification
}
