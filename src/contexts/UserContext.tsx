
"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useAuth } from './AuthContext';
import type { UserProfile } from '@/services/userService';
import { updateUserName as updateUserNameInDb } from '@/services/userService';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userTitle: string; // Título/cargo agora virá do perfil
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userName, setUserNameState] = useState("Carregando...");
  const userTitle = profile?.role || '...';
  const isAdmin = profile?.role === 'Admin';
  const { firestore } = initializeFirebase();


  useEffect(() => {
    let unsubscribe: () => void = () => {};
    if (currentUser) {
      const userDocRef = doc(firestore, "users", currentUser.uid);
      unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProfile;
          setProfile(data);
          setUserNameState(data.name);
        } else {
          setUserNameState("Usuário não encontrado");
        }
      }, (error) => {
        console.error("Erro ao buscar perfil do usuário:", error);
      });
    } else {
        setProfile(null);
        setUserNameState("Visitante");
    }

    return () => unsubscribe();
  }, [currentUser, firestore]);


  const setUserName = (name: string) => {
    if (currentUser && name) {
      updateUserNameInDb(currentUser.uid, name);
    }
    // Optimistic update for immediate UI feedback
    setUserNameState(name);
  };

  return (
    <UserContext.Provider value={{ userName, setUserName, userTitle, isAdmin }}>
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
