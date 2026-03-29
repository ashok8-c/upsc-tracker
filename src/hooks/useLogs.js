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
        { event: '*', schema: 'public', table: 'logs', filter: `user_id=eq.${userId}` }, // ✅ FIXED
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

    if (error) {
      console.error("Fetch error:", error)
    } else {
      setLogs(data)
    }

    setLoading(false)
  }

  const addLog = async (log) => {
    const { data, error } = await supabase
      .from('logs') // ✅ FIXED
      .insert([{ ...log, user_id: userId }])
      .select()

    if (error) {
      console.error("Insert error:", error)
    } else {
      setLogs(prev => [data[0], ...prev])
    }

    return { error }
  }

  const deleteLog = async (id) => {
    const { error } = await supabase
      .from('logs') // ✅ FIXED
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Delete error:", error)
    } else {
      setLogs(prev => prev.filter(l => l.id !== id))
    }

    return { error }
  }

  return { logs, loading, addLog, deleteLog }
}