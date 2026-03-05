
"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseServices } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { createUserProfile } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebaseServices();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Quando um usuário faz login ou se registra, cria/verifica seu perfil.
        createUserProfile(user);
      }
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { currentUser, isLoading };

  return (
    <AuthContext.Provider value={value}>
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

// Componente Wrapper para lidar com a lógica de roteamento
export const AuthWrapper = ({ children }: { children: ReactNode }) => {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!currentUser && pathname !== '/login') {
        router.push('/login');
      } else if (currentUser && pathname === '/login') {
        router.push('/');
      }
    }
  }, [currentUser, isLoading, pathname, router]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
    );
  }

  // Permite o acesso à página de login se não estiver autenticado
  if (!currentUser && pathname === '/login') {
    return <>{children}</>;
  }

  // Se o usuário estiver autenticado, ou se a rota for de login, renderiza o conteúdo
  if (currentUser) {
    return <>{children}</>;
  }

  // Por padrão, não renderiza nada se não estiver carregando e as condições acima não forem atendidas
  return null;
}
