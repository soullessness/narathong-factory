'use client'

import { useEffect, useState } from 'react'

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // ดึงจาก API route แทน client-side query (bypass RLS ด้วย service role)
    fetch('/api/profiles/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          setUserId(data.id)
          setRole(data.role ?? 'worker')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { role, userId, loading }
}
