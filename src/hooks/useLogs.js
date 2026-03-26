import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useLogs = (userId) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchLogs()

    const channel = supabase
      .channel('logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs', // ✅ FIXED
          filter: `user_id=eq.${userId}`
        },
        () => fetchLogs()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('logs') // ✅ FIXED
      .select('*')
      .order('created_at', { ascending: false })

    if (!error) setLogs(data)
    setLoading(false)
  }

  const addLog = async (log) => {
    const { data, error } = await supabase
      .from('logs') // ✅ FIXED
      .insert([{ ...log, user_id: userId }])
      .select()

    if (!error) setLogs(prev => [data[0], ...prev])
    return { error }
  }

  return { logs, loading, addLog }
}