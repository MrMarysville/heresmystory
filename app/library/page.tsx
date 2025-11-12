/**
 * Library Page
 * Browse and search recorded stories with real data
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, signOut } from '@/lib/auth/client-utils';
import { AudioPlayer } from '@/components/audio/AudioPlayer';
import { TranscriptModal } from '@/components/library/TranscriptModal';

interface Session {
  id: string;
  title: string;
  profileId: string;
  profileName: string;
  profileColor: string;
  profileRelation: string | null;
  date: Date;
  duration: number;
  status: 'processing' | 'ready';
  tags: string[];
  summary: string;
  rawAudioUrl: string | null;
  cleanAudioUrl: string | null;
  hasTranscript: boolean;
}

export default function LibraryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'processing'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  // Audio player state
  const [playingSession, setPlayingSession] = useState<Session | null>(null);

  // Transcript modal state
  const [transcriptSession, setTranscriptSession] = useState<Session | null>(null);

  // Check authentication
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

  // Load sessions when page, search, or filter changes
  useEffect(() => {
    loadSessions();
  }, [page, searchQuery, filterStatus]);

  const loadSessions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(searchQuery && { search: searchQuery }),
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });

      const response = await fetch(`/api/sessions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
      setTotalCount(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0); // Reset to first page on search
  };

  const handleFilterChange = (status: 'all' | 'ready' | 'processing') => {
    setFilterStatus(status);
    setPage(0); // Reset to first page on filter
  };

  const handleListen = (session: Session) => {
    setPlayingSession(session);
  };

  const handleViewTranscript = async (session: Session) => {
    try {
      // Fetch full session details with transcript
      const response = await fetch(`/api/sessions/${session.id}`);
      if (!response.ok) throw new Error('Failed to load transcript');

      const fullSession = await response.json();
      setTranscriptSession(fullSession);
    } catch (err) {
      console.error('Error loading transcript:', err);
      alert('Failed to load transcript');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(totalCount / limit);

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
                href="/profiles"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Profiles
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
      <main className="container mx-auto px-4 py-8 pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Story Library
            </h2>
            <p className="text-gray-600">
              Browse and search through all your recorded stories.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search stories, people, or topics..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('ready')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'ready'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ready
                </button>
                <button
                  onClick={() => handleFilterChange('processing')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'processing'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Processing
                </button>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <p>{error}</p>
              <button
                onClick={loadSessions}
                className="text-sm font-medium underline mt-2"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading stories...</p>
            </div>
          ) : (
            <>
              {/* Sessions List */}
              <div className="space-y-4 mb-8">
                {sessions.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No stories found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery
                        ? 'Try adjusting your search terms'
                        : 'Start recording to create your first story'}
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Record a Story
                    </Link>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {session.title}
                            </h3>
                            {session.status === 'processing' && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Processing
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: session.profileColor }}
                              />
                              {session.profileName}
                              {session.profileRelation && ` (${session.profileRelation})`}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {formatDate(session.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {formatDuration(session.duration)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3">
                            {session.summary}
                          </p>
                          {session.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {session.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleListen(session)}
                          disabled={session.status === 'processing' || !session.cleanAudioUrl}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          Listen
                        </button>
                        <button
                          onClick={() => handleViewTranscript(session)}
                          disabled={session.status === 'processing' || !session.hasTranscript}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                        >
                          View Transcript
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          Share
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, totalCount)} of {totalCount} stories
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPage(page - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={page === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {page + 1} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() => {
                        setPage(page + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={!hasMore}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Audio Player (Fixed at bottom) */}
      {playingSession && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <AudioPlayer
            audioUrl={playingSession.cleanAudioUrl || playingSession.rawAudioUrl || ''}
            title={`${playingSession.title} - ${playingSession.profileName}`}
            onEnded={() => setPlayingSession(null)}
            onClose={() => setPlayingSession(null)}
          />
        </div>
      )}

      {/* Transcript Modal */}
      {transcriptSession && (
        <TranscriptModal
          open={!!transcriptSession}
          onOpenChange={(open) => !open && setTranscriptSession(null)}
          session={transcriptSession}
        />
      )}
    </div>
  );
}
