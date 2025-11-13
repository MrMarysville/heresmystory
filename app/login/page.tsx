'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithEmail, signInWithMagicLink } from '@/lib/auth/client-utils'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [useMagicLink, setUseMagicLink] = useState(false)

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const { data, error: signInError } = await signInWithEmail(email, password)

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    if (data.session) {
      router.push(redirect)
      router.refresh()
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    const { error: magicLinkError } = await signInWithMagicLink(email)

    if (magicLinkError) {
      setError(magicLinkError.message)
      setIsLoading(false)
      return
    }

    setMessage('Check your email for a magic link to sign in!')
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">
            Sign in to continue preserving memories
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}

        {/* Auth Method Toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setUseMagicLink(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              !useMagicLink
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setUseMagicLink(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              useMagicLink
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Magic Link
          </button>
        </div>

        {/* Login Form */}
        <form
          onSubmit={useMagicLink ? handleMagicLinkLogin : handleEmailPasswordLogin}
          className="space-y-6"
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          {/* Password (only for email/password) */}
          {!useMagicLink && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Please wait...' : useMagicLink ? 'Send Magic Link' : 'Sign In'}
          </button>
        </form>

        {/* Magic Link Info */}
        {useMagicLink && (
          <div className="text-sm text-gray-600 bg-indigo-50 p-4 rounded-lg">
            <p className="font-medium text-indigo-900 mb-1">How magic links work:</p>
            <ul className="list-disc list-inside space-y-1 text-indigo-800">
              <li>No password needed</li>
              <li>Check your email inbox</li>
              <li>Click the link to sign in</li>
              <li>Link expires in 1 hour</li>
            </ul>
          </div>
        )}

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
