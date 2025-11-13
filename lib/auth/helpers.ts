/**
 * Auth helper utilities for server-side operations
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { syncUserToDatabase, getUserWithProfiles } from './sync'

/**
 * Get authenticated user or redirect to login
 * Use in Server Components and Server Actions
 */
export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure user exists in database
  await syncUserToDatabase(user)

  // Get full user with profiles
  const dbUser = await getUserWithProfiles(user.id)

  return { user, dbUser }
}

/**
 * Get authenticated user without redirecting
 * Returns null if not authenticated
 */
export async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Ensure user exists in database
  await syncUserToDatabase(user)

  // Get full user with profiles
  const dbUser = await getUserWithProfiles(user.id)

  return { user, dbUser }
}

/**
 * Verify API request authentication
 * Use in API routes
 */
export async function verifyAuth(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false, user: null }
  }

  await syncUserToDatabase(user)
  const dbUser = await getUserWithProfiles(user.id)

  return { authorized: true, user, dbUser }
}
