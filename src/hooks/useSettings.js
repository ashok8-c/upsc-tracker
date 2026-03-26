import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useSettings = (userId) => {
  const [dailyTarget, setDailyTargetState] = useState(6)

  useEffect(() => {
    if (!userId) return
    fetchSettings()
  }, [userId])

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) setDailyTargetState(data.daily_target)
  }

  const setDailyTarget = async (value) => {
    setDailyTargetState(value)
    await supabase
      .from('settings')
      .upsert({ user_id: userId, daily_target: value })
  }

  return { dailyTarget, setDailyTarget }
}