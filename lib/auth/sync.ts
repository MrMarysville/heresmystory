/**
 * User sync utilities
 * Ensures Supabase auth users are synced with Prisma database
 */

import { User } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function syncUserToDatabase(supabaseUser: User) {
  try {
    const user = await prisma.user.upsert({
      where: { email: supabaseUser.email! },
      create: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        role: 'USER',
      },
      update: {
        id: supabaseUser.id,
      },
    })

    return user
  } catch (error) {
    console.error('Error syncing user to database:', error)
    throw error
  }
}

export async function getUserWithProfiles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profiles: {
        include: {
          voiceModels: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      },
    },
  })
}

export async function getOrCreateDefaultProfile(userId: string) {
  // Check if user has any profiles
  const profiles = await prisma.profile.findMany({
    where: { userId },
  })

  if (profiles.length > 0) {
    return profiles[0]
  }

  // Create default profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const defaultProfile = await prisma.profile.create({
    data: {
      userId,
      displayName: user.email.split('@')[0],
      relation: 'Self',
      colorTheme: '#6366f1',
    },
  })

  return defaultProfile
}
