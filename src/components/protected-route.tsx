'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that redirects unauthenticated users to the login page.
 * Also validates that the user's email domain is @iliadmg.com
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user) {
      // Validate domain restriction
      const email = user.email;
      if (email && !email.endsWith('@iliadmg.com')) {
        // User is authenticated but not from the allowed domain
        router.push('/login?error=unauthorized-domain');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check domain restriction
  const email = user.email;
  if (email && !email.endsWith('@iliadmg.com')) {
    return null;
  }

  return <>{children}</>;
}
