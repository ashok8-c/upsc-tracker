import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useTopics = (userId) => {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    fetchTopics()

    // Realtime sync
    const channel = supabase
      .channel('topics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics', filter: `user_id=eq.${userId}` },
        () => fetchTopics()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const fetchTopics = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setTopics(data)
    setLoading(false)
  }

  const addTopic = async (topic) => {
    const { data, error } = await supabase
      .from('topics')
      .insert([{ ...topic, user_id: userId }])
      .select()
    if (!error) setTopics(prev => [data[0], ...prev])
    return { error }
  }

  const updateTopic = async (id, updates) => {
    const { error } = await supabase
      .from('topics')
      .update(updates)
      .eq('id', id)
    if (!error) setTopics(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    return { error }
  }

  const deleteTopic = async (id) => {
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)
    if (!error) setTopics(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  return { topics, loading, addTopic, updateTopic, deleteTopic }
}