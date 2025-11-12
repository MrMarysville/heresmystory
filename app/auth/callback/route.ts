/**
 * Auth callback handler for email confirmations and magic links
 * Supabase redirects here after email verification
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure user exists in our Prisma database
      try {
        await prisma.user.upsert({
          where: { email: data.user.email! },
          create: {
            id: data.user.id,
            email: data.user.email!,
            role: 'USER',
          },
          update: {
            id: data.user.id,
          },
        })
      } catch (err) {
        console.error('Error syncing user to database:', err)
      }

      // Redirect to the next URL or dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Redirect to error page if something went wrong
  return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin))
}
