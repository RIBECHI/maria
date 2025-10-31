
"use client";

import { useUser } from '@/contexts/UserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from 'firebase/auth';
import { getAuthInstance } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '../ui/button';

export default function UserInfo() {
  const { user, setUserName } = useUser(); // Agora pegamos o objeto 'user'
  const { toast } = useToast();
  
  const handleSignOut = async () => {
    const auth = getAuthInstance();
    try {
      await signOut(auth);
      setUserName("Advogado"); // Reseta para o nome padrão no contexto
      toast({
        title: "Você saiu!",
        description: "Até a próxima.",
      });
      // O AuthWrapper no ClientLayout cuidará do redirecionamento
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao sair",
        description: "Não foi possível fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Se o usuário não estiver carregado ou não existir, não renderiza nada
  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 p-2 w-full justify-start h-auto group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
                <AvatarImage src={user.photoURL || undefined} alt="Avatar do Usuário" />
                <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden text-left">
                <p className="text-sm font-medium text-sidebar-foreground">{user.displayName}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
            </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end">
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    