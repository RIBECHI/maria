
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getAuth, onAuthStateChanged, type User } from "firebase/auth";
import { app } from '@/lib/firebase'; // Import app to ensure initialization
import { Skeleton } from '@/components/ui/skeleton';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
        <div className="flex flex-col h-screen">
            <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </header>
            <div className="flex flex-1">
                <nav className="hidden border-r bg-gray-100/40 md:block dark:bg-gray-800/40 p-4">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-8 w-40" />
                    </div>
                </nav>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-40 w-full" />
                </main>
            </div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoading }}>
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
