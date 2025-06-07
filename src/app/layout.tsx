import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/PWA/ServiceWorkerRegistration'
import { FirestoreProvider } from '@/components/FirestoreProvider'

export const metadata: Metadata = {
  title: 'Diary App',
  description: 'Your personal diary with photos and memories',
  generator: 'Next.js',
  manifest: '/manifest.json',
  keywords: ['diary', 'journal', 'photos', 'memories', 'personal'],
  authors: [{ name: 'Diary App' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Diary App',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Diary App',
    title: 'Diary App - Your Personal Digital Diary',
    description: 'Capture your daily moments with photos and text in a beautiful, private diary app.',
  },
  twitter: {
    card: 'summary',
    title: 'Diary App - Your Personal Digital Diary',
    description: 'Capture your daily moments with photos and text in a beautiful, private diary app.',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8b67ef' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="application-name" content="Diary App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Diary App" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#8b67ef" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
        
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://diary-app.vercel.app" />
        <meta name="twitter:title" content="Diary App" />
        <meta name="twitter:description" content="Your personal diary with photos and memories" />
        <meta name="twitter:image" content="https://diary-app.vercel.app/favicon.svg" />
        <meta name="twitter:creator" content="@diaryapp" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Diary App" />
        <meta property="og:description" content="Your personal diary with photos and memories" />
        <meta property="og:site_name" content="Diary App" />
        <meta property="og:url" content="https://diary-app.vercel.app" />
        <meta property="og:image" content="https://diary-app.vercel.app/favicon.svg" />
      </head>
      <body className="h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 antialiased">
        <ServiceWorkerRegistration />
        <FirestoreProvider>
          <div className="mobile-container safe-area-inset">
            {children}
          </div>
        </FirestoreProvider>
      </body>
    </html>
  )
}
