import type { Metadata } from 'next'
import './globals.css'
import { Header } from './_components/Header'
import { KidProvider } from './_lib/context'

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
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <KidProvider>
          <Header />
          <main className="container mx-auto px-4 py-6 max-w-4xl">
            {children}
          </main>
        </KidProvider>
      </body>
    </html>
  )
}