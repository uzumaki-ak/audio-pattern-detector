import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading'
})

export const metadata: Metadata = {
  title: 'Audio Pattern Detection',
  description: 'Industry-grade audio pattern detection using cross-correlation analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}