import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Broadcast InSite Pro',
  description: 'A comprehensive inventory and maintenance management system for broadcast equipment.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
