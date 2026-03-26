import { useEffect } from 'react'

export const useNotifications = (todayTasks, todayHours, dailyTarget) => {

  useEffect(() => {
    requestPermission()
  }, [])

  useEffect(() => {
    checkAndNotify(todayTasks, todayHours, dailyTarget)
  }, [todayTasks, todayHours, dailyTarget])

  const requestPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const notify = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      })
    }
  }

  const checkAndNotify = (tasks, hours, target) => {
    if (!tasks) return
    const pending = tasks.filter(t => t.status !== 'done')
    if (pending.length > 0) {
      notify('UPSC Tracker', `You have ${pending.length} revision${pending.length > 1 ? 's' : ''} due today!`)
    }
    if (hours === 0) {
      notify('UPSC Tracker', "You haven't logged any study time today. Stay consistent!")
    }
  }

  return { notify }
}