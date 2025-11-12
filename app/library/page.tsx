/**
 * Library Page
 * Browse and search recorded stories
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Story {
  id: string;
  title: string;
  profileName: string;
  date: Date;
  duration: number;
  status: 'processing' | 'ready';
  tags: string[];
  summary: string;
}

// Mock data for demonstration
const mockStories: Story[] = [
  {
    id: '1',
    title: 'Growing Up in Brooklyn',
    profileName: 'Grandma Rose',
    date: new Date('2025-01-10'),
    duration: 1845, // seconds
    status: 'ready',
    tags: ['childhood', 'family', 'home'],
    summary:
      'Stories about life in Brooklyn during the 1950s, including memories of the neighborhood, school days, and family traditions.',
  },
  {
    id: '2',
    title: 'My First Job at the Factory',
    profileName: 'Grandma Rose',
    date: new Date('2025-01-08'),
    duration: 2134,
    status: 'ready',
    tags: ['work', 'career'],
    summary:
      'Memories of starting work at age 16, the people she worked with, and lessons learned from that first job.',
  },
  {
    id: '3',
    title: 'Meeting Your Grandmother',
    profileName: 'Dad',
    date: new Date('2025-01-05'),
    duration: 892,
    status: 'processing',
    tags: ['family', 'love'],
    summary: 'The story of how we met and fell in love...',
  },
];

export default function LibraryPage() {
  const [stories] = useState<Story[]>(mockStories);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'processing'>('all');

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

  const filteredStories = stories.filter((story) => {
    const matchesSearch =
      searchQuery === '' ||
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.profileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter =
      filterStatus === 'all' || story.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('ready')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === 'ready'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Ready
                </button>
                <button
                  onClick={() => setFilterStatus('processing')}
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

          {/* Stories List */}
          <div className="space-y-4">
            {filteredStories.length === 0 ? (
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
              filteredStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {story.title}
                        </h3>
                        {story.status === 'processing' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Processing
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {story.profileName}
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
                          {formatDate(story.date)}
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
                          {formatDuration(story.duration)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {story.summary}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {story.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                      disabled={story.status === 'processing'}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      Listen
                    </button>
                    <button
                      disabled={story.status === 'processing'}
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
        </div>
      </main>
    </div>
  );
}
