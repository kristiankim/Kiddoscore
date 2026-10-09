import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Toaster } from 'sonner'
import './globals.css'
import { Header } from './_components/Header'
import { KidProvider } from './_lib/context'
import { AuthProvider } from './_lib/auth'
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: 'Sparkquest',
  description: 'Track tasks, earn points, redeem rewards',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(GeistSans.variable, "font-sans")}>
      <body className="font-sans min-h-screen bg-surface-secondary">
        <AuthProvider>
          <KidProvider>
            <Header />
            <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-10 max-w-6xl">
              {children}
            </main>
          </KidProvider>
        </AuthProvider>
        <Toaster
          position="bottom-right"
          closeButton
          style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              borderColor: 'var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
