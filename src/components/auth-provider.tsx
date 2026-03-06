'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { AuthContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, GoogleAuthProvider } from 'firebase/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            // Request access to the user's calendar
            provider.addScope('https://www.googleapis.com/auth/calendar.events');
            await signInWithPopup(auth, provider);
            toast({ title: "Sign-In Successful", description: "You are now signed in." });
        } catch (error: any) {
            console.error("Sign-in error:", error);
            toast({ variant: 'destructive', title: "Sign-In Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        setLoading(true);
        try {
            await firebaseSignOut(auth);
            toast({ title: "Signed Out", description: "You have been successfully signed out." });
        } catch (error: any) {
             console.error("Sign-out error:", error);
            toast({ variant: 'destructive', title: "Sign-Out Failed", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
