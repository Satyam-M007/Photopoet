import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'PhotoPoet',
  description: 'Generate unique poems from your photos with AI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Belleza&family=Comfortaa:wght@400;700&family=Pacifico&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased')} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
