
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userTitle: string; // Título/cargo permanece estático por enquanto
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userName, setUserNameState] = useState("Laura Antonelli");
  const userTitle = "Advogada"; // Mantendo o título estático por enquanto

  useEffect(() => {
    // Carrega o nome do localStorage quando o componente é montado no cliente
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserNameState(storedName);
    }
  }, []);

  const setUserName = (name: string) => {
    // Salva o nome no estado e no localStorage
    localStorage.setItem('userName', name);
    setUserNameState(name);
  };

  return (
    <UserContext.Provider value={{ userName, setUserName, userTitle }}>
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
