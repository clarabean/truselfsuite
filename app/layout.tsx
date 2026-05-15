import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TruSelf Suite',
  description: 'Live Your Mark Coaching Suite',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}