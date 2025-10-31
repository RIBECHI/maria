
"use client";

import React, { createContext, useContext, type ReactNode } from 'react';
import type { User } from "firebase/auth";

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
}

// Desativado: Fornece valores padrão que não acionam a lógica do Firebase.
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: false, // Define isLoading como false para não mostrar o loader.
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Desativado: Nenhuma lógica de Firebase aqui. Apenas renderiza os filhos.
  const value = { currentUser: null, isLoading: false };

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
