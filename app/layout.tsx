import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'FreshDrop Ecommerce Admin',
  description: 'Production-ready frontend ecommerce admin panel with mock data CRUD.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
      </body>
    </html>
  );
}
