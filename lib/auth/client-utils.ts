/**
 * Client-side auth utilities
 * Use these in Client Components
 */

'use client'

import { createClient } from '@/lib/supabase/client'

export function useSupabase() {
  return createClient()
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  return { data, error }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signInWithMagicLink(email: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  return { data, error }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getCurrentSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}
