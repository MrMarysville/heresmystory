/**
 * Profiles Page
 * Manage storyteller profiles and avatars
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth/client-utils';

interface Profile {
  id: string;
  displayName: string;
  relation: string;
  avatarUrl?: string;
  colorTheme: string;
  hasVoiceModel: boolean;
  sessionsCount: number;
}

// Mock data for demonstration
const mockProfiles: Profile[] = [
  {
    id: '1',
    displayName: 'Grandma Rose',
    relation: 'Grandmother',
    colorTheme: '#ec4899',
    hasVoiceModel: true,
    sessionsCount: 12,
  },
  {
    id: '2',
    displayName: 'Dad',
    relation: 'Father',
    colorTheme: '#3b82f6',
    hasVoiceModel: false,
    sessionsCount: 3,
  },
];

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles] = useState<Profile[]>(mockProfiles);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { user, error } = await getCurrentUser();
      if (error || !user) {
        router.push('/login');
        return;
      }
      setUserEmail(user.email || null);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📖</span>
              <h1 className="text-xl font-bold text-gray-900">
                Here&apos;s My Story
              </h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/library"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Library
              </Link>
              {userEmail && (
                <span className="text-sm text-gray-600">
                  {userEmail}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Profiles</h2>
            <p className="text-gray-600">
              Create and manage profiles for each storyteller in your family.
            </p>
          </div>

          {/* Profiles Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                {/* Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: profile.colorTheme }}
                  >
                    {profile.displayName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {profile.displayName}
                    </h3>
                    <p className="text-sm text-gray-500">{profile.relation}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{profile.sessionsCount} stories</span>
                  </div>
                  {profile.hasVoiceModel && (
                    <div className="flex items-center gap-1 text-green-600">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Voice trained</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard?profile=${profile.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Record Story
                  </Link>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Profile Card */}
            <button className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500 flex flex-col items-center justify-center min-h-[200px] group">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                <svg
                  className="w-8 h-8 text-gray-400 group-hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Add New Profile
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Create a profile for another family member
              </p>
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              About Profiles
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Each profile represents a storyteller in your family. You can
              record multiple stories for each person and optionally train a
              custom voice model to retell their stories in their own voice.
            </p>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Voice training requires 15-40 minutes of audio</span>
              </div>
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>All voice training requires explicit consent</span>
              </div>
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>You can delete profiles and voice models anytime</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
