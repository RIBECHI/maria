
"use client";

import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserInfo() {
  const { userName, userTitle } = useUser();
  
  // Extrai as iniciais do nome do usuário para o AvatarFallback
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://placehold.co/40x40.png" alt="Avatar do Usuário" data-ai-hint="user avatar" />
        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
      </Avatar>
      <div className="group-data-[collapsible=icon]:hidden">
        <p className="text-sm font-medium text-sidebar-foreground">{userName}</p>
        <p className="text-xs text-sidebar-foreground/70">{userTitle}</p>
      </div>
    </div>
  );
}
