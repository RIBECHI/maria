import type { Metadata } from 'next';
import './globals.css';
import AppProviders from './ClientLayout'; // Renamed import

export const metadata: Metadata = {
  title: 'LexManager',
  description: 'Software de Gestão Jurídica',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#3F51B5" />
      </head>
      <body className="font-body antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
