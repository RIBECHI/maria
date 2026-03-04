"use client";

import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

export default function UserInfo() {
  const { userName, userTitle } = useUser();
  const { currentUser } = useAuth();

  const handleLogout = () => {
    signOut(auth);
    // The AuthWrapper in AuthContext will handle redirecting to /login
  };
  
  const getInitials = (name: string) => {
    if (!name || name === "Carregando...") return "?";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-2 h-auto hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser?.photoURL || "https://picsum.photos/seed/1/40/40"} alt="Avatar do Usuário" data-ai-hint="user avatar" />
              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden text-left">
              <p className="text-sm font-medium text-sidebar-foreground">{userName}</p>
              <p className="text-xs text-sidebar-foreground/70">{userTitle}</p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-56 bg-sidebar border-sidebar-border text-sidebar-foreground">
        <DropdownMenuLabel>
            <p className="font-semibold">{userName}</p>
            <p className="text-xs text-sidebar-foreground/70 font-normal">{currentUser?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-sidebar-border"/>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:bg-sidebar-accent focus:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
