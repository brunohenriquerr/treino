'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [user, setUser] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('treino_user')
    if (!stored) {
      router.push('/login')
    } else {
      setUser(stored)
    }
    setLoading(false)
  }, [])

  return { user, loading }
}
