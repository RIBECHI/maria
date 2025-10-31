
"use client";

import React, { createContext, useContext, useState, type ReactNode } from 'react';

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
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  // Mantemos userName e setUserName para compatibilidade com partes do app que ainda não foram migradas
  userName: string;
  setUserName: (name: string) => void;
  userTitle: string; 
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Começa como true para esperar a verificação do onAuthStateChanged
  const [userName, setUserNameState] = useState("Advogado"); // Valor padrão
  const userTitle = "Advogado";

  // Sincroniza o userName com o displayName do objeto de usuário do Firebase
  React.useEffect(() => {
    if (user?.displayName) {
      setUserNameState(user.displayName);
    } else {
      // Se não houver usuário, usa um valor padrão
      setUserNameState("Advogado");
    }
  }, [user]);

  const setUserName = (name: string) => {
    // Esta função agora pode ser usada para atualizar o perfil do Firebase
    // A lógica de salvar no localStorage e atualizar o estado do Firebase é movida para o AuthWrapper
    if (user) {
      setUser({ ...user, displayName: name });
    }
    setUserNameState(name);
  };

  const contextValue = {
    user,
    setUser,
    isLoading,
    setIsLoading,
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
