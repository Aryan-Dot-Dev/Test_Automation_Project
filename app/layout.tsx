import type { Metadata } from 'next'
import './globals.css'
import '@/styles/tabs.css'
import '@/styles/card.css'
import '@/styles/details.css'
import '@/styles/list.css'
import '@/styles/header.css'
import { ThemeProvider } from "@/components/theme-provider"
import { Inter } from 'next/font/google'
import { WalletProvider } from '@/hooks/use-wallet'
import Header from '@/components/layout/header'
import HeaderContent from '@/components/layout/header-content'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Blockchain Test Management',
  description: 'Blockchain-based test data management system',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <div className="flex flex-col min-h-screen">
              <HeaderContent />
              <main className="flex-grow pt-16">
                {children}
              </main>
            </div>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
