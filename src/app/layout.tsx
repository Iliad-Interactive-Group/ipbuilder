
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import BetaGate from '@/components/beta-gate';

export const metadata: Metadata = {
  title: 'GrowthOS - Creator',
  description: 'Generate marketing copy with AI — by Iliad Interactive',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <BetaGate>
            <ErrorBoundary>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </ErrorBoundary>
          </BetaGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
