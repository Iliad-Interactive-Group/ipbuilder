
'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/firebase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import AppLogo from '@/components/app-logo';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ALLOWED_DOMAIN = '@iliadmg.com';

// Helper function to validate email domain
const isAllowedDomain = (email: string): boolean => {
  return email.toLowerCase().endsWith(ALLOWED_DOMAIN);
};

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading, signOutUser } = useAuth();

  // Check for error query parameter (domain restriction)
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized-domain') {
      setError('Access is restricted to @iliadmg.com email addresses only.');
      // Sign out the user if they're not from the allowed domain
      if (user && user.email && !isAllowedDomain(user.email)) {
        signOutUser();
      }
    }
  }, [searchParams, user, signOutUser]);

  useEffect(() => {
    if (!authLoading && user) {
      // Check if user is from allowed domain
      if (user.email && isAllowedDomain(user.email)) {
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!auth) {
      setError('Authentication is not configured. Please contact support.');
      toast({ title: "Configuration Error", description: "Authentication is not configured.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Validate email domain before attempting login
    if (!isAllowedDomain(email)) {
      setError(`Access is restricted to ${ALLOWED_DOMAIN} email addresses only.`);
      toast({ 
        title: "Access Denied", 
        description: `Only ${ALLOWED_DOMAIN} email addresses are allowed.`, 
        variant: "destructive" 
      });
      setIsLoading(false);
      return;
    }
    
    setError(null);
    if (!auth) {
      setError('Firebase is not initialized. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Double-check domain after login (in case of manual Firebase user creation)
      if (userCredential.user.email && !isAllowedDomain(userCredential.user.email)) {
        await signOutUser();
        throw new Error(`Access is restricted to ${ALLOWED_DOMAIN} email addresses only.`);
      }
      
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/');
    } catch (err: any) {
      console.error("Login error:", err);
      let errorMessage = 'Failed to login. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError('Authentication is not configured. Please contact support.');
      toast({ title: "Configuration Error", description: "Authentication is not configured.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        hd: 'iliadmg.com', // Hint to Google to show only iliadmg.com accounts
        prompt: 'select_account'
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      
      // Validate domain
      if (userCredential.user.email && !isAllowedDomain(userCredential.user.email)) {
        await signOutUser();
        setError(`Access is restricted to ${ALLOWED_DOMAIN} email addresses only.`);
        toast({ 
          title: "Access Denied", 
          description: `Only ${ALLOWED_DOMAIN} email addresses are allowed.`, 
          variant: "destructive" 
        });
        setIsLoading(false);
        return;
      }
      
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push('/');
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      let errorMessage = 'Failed to sign in with Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled.';
      } else if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups for this site.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast({ title: "Google Sign-In Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (authLoading || (!authLoading && user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 selection:bg-primary/20 selection:text-primary">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <AppLogo />
        </header>
        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center">
              <LogIn className="w-6 h-6 mr-3 text-primary" /> Login
            </CardTitle>
            <CardDescription>Access your Iliad IPbuilder account.</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <AlertDescription className="text-sm">
                  Access is restricted to <strong>@iliadmg.com</strong> email addresses only.
                </AlertDescription>
              </Alert>

              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@iliadmg.com"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><LogIn className="mr-2 h-4 w-4" /> Login with Email</>}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                disabled={isLoading}
                onClick={handleGoogleSignIn}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Sign in with Google
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          This is a secured application. For new user accounts, please contact your administrator.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
