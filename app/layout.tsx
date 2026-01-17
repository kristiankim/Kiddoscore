import type { Metadata } from 'next'
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'
import { Header } from './_components/Header'
import { KidProvider } from './_lib/context'
import { AuthProvider } from './_lib/auth'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

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
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className="font-sans min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
        <AuthProvider>
          <KidProvider>
            <Header />
            <main className="container mx-auto px-4 py-6 max-w-6xl">
              {children}
            </main>
          </KidProvider>
        </AuthProvider>
      </body>
    </html>
  )
}