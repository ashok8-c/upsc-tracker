import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useReflections = (userId) => {
  const [reflections, setReflections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    fetchReflections()

    const channel = supabase
      .channel('reflections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reflections',
          filter: `user_id=eq.${userId}`
        },
        () => fetchReflections()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const fetchReflections = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error("Fetch reflection error:", error)
    } else {
      setReflections(data || [])
    }

    setLoading(false)
  }

  const addReflection = async (reflection) => {
    if (!userId) {
      console.error("No userId found")
      return { error: "User not authenticated" }
    }

    const payload = {
      user_id: userId,
      date: new Date().toISOString().split('T')[0], // ✅ correct format
      learned: reflection.learned,
      issues: reflection.issues
    }

    console.log("Inserting:", payload)

    const { data, error } = await supabase
      .from('reflections')
      .insert([payload])
      .select()

    if (error) {
      console.error("Insert reflection error:", error)
    } else if (data) {
      setReflections(prev => [data[0], ...prev])
    }

    return { error }
  }

  return { reflections, loading, addReflection }
}