/**
 * Home Page
 * Main landing page for Here's My Story
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📖</span>
            <h1 className="text-2xl font-bold text-gray-900">Here&apos;s My Story</h1>
          </div>
          <div className="space-x-4">
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
            <Link
              href="/profiles"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Preserve Your Stories,
            <br />
            <span className="text-blue-600">In Your Own Voice</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            A voice-first companion that captures, preserves, and retells your
            precious memories for generations to come.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Start Recording
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border-2 border-blue-600"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🎙️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Frictionless Recording
            </h3>
            <p className="text-gray-600">
              One tap to start telling your story. Natural conversations with an
              AI assistant that knows how to listen.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🗣️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Your Voice, Forever
            </h3>
            <p className="text-gray-600">
              Train a custom voice model that can retell your stories in your own
              voice, with full consent and control.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Beautiful Keepsakes
            </h3>
            <p className="text-gray-600">
              Generate illustrated albums, narrated videos, and shareable
              memories for your family to treasure.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Start a Conversation
                </h4>
                <p className="text-gray-600">
                  Our warm, patient AI assistant guides you through sharing your
                  stories with thoughtful questions.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Capture & Clean
                </h4>
                <p className="text-gray-600">
                  Your audio is automatically recorded, cleaned, and transcribed
                  with speaker identification.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Train Your Voice (Optional)
                </h4>
                <p className="text-gray-600">
                  With your consent, create a custom voice model that can retell
                  your stories in your authentic voice.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Share & Preserve
                </h4>
                <p className="text-gray-600">
                  Create beautiful albums, narrated videos, and private share
                  links for your family to enjoy forever.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Safety */}
        <div className="mt-24 bg-gray-50 rounded-xl p-12">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Privacy & Safety First
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                🔒 Full Control
              </h4>
              <p className="text-gray-600">
                Your stories and voice are yours. Delete anytime, export
                everything, revoke permissions easily.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                ✅ Explicit Consent
              </h4>
              <p className="text-gray-600">
                Clear consent flows for recording, voice cloning, and sharing.
                No surprises, full transparency.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                🔐 Encrypted & Secure
              </h4>
              <p className="text-gray-600">
                All data encrypted at rest and in transit. Regional data
                residency options available.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                👨‍👩‍👧‍👦 Family Focused
              </h4>
              <p className="text-gray-600">
                Private sharing with family only. No public indexing, no
                third-party training on your data.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            Ready to Share Your Story?
          </h3>
          <Link
            href="/profiles"
            className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-gray-600">
            Free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-24 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>&copy; 2025 Here&apos;s My Story. All rights reserved.</p>
          <div className="space-x-6">
            <Link href="/privacy" className="hover:text-gray-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-900">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-gray-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
