
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Nova interface para o objeto de usuário, alinhada com o Firebase Auth
export interface AuthUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
}

interface UserContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  // Mantemos userName e setUserName para compatibilidade com partes do app que ainda não foram migradas
  userName: string;
  setUserName: (name: string) => void;
  userTitle: string; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userName, setUserNameState] = useState("Advogado"); // Valor padrão
  const userTitle = "Advogado";

  useEffect(() => {
    // Quando o usuário do Firebase mudar, atualiza o 'userName' também
    if (user) {
      setUserNameState(user.displayName);
    } else {
      // Se não houver usuário, verifica o localStorage por um nome salvo (útil para o modo offline ou pré-login)
      const storedName = localStorage.getItem('userName');
      setUserNameState(storedName || "Advogado");
    }
  }, [user]);

  const setUserName = (name: string) => {
    localStorage.setItem('userName', name);
    setUserNameState(name);
    // Também atualizamos o objeto de usuário se ele existir
    if (user) {
      setUser({ ...user, displayName: name });
    }
  };

  const contextValue = {
    user,
    setUser,
    userName,
    setUserName,
    userTitle,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
