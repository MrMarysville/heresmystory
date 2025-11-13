import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { AccessibilityWidget } from "@/components/accessibility/AccessibilityWidget";
import { MonitoringProvider } from "@/components/monitoring/MonitoringProvider";
import { PageErrorBoundary } from "@/components/error/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Here's My Story - Preserve Family Memories",
  description: "Record, preserve, and share your family's stories for generations to come.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MonitoringProvider>
          <PageErrorBoundary>
            <AccessibilityProvider>
              {/* Skip to main content link for keyboard navigation */}
              <a href="#main-content" className="skip-to-content">
                Skip to main content
              </a>

              <main id="main-content">
                {children}
              </main>

              {/* Global accessibility controls */}
              <AccessibilityWidget />
            </AccessibilityProvider>
          </PageErrorBoundary>
        </MonitoringProvider>
      </body>
    </html>
  );
}
