
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getUsers, updateUserRole, type UserProfile } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, User } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const usersFromDb = await getUsers();
      setUsers(usersFromDb);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao buscar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleRoleChange = async (userId: string, newRole: "Admin" | "Usuário Padrão") => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({
        title: "Função do usuário atualizada!",
        description: "A permissão foi alterada com sucesso.",
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Erro ao atualizar função",
        description: "Você pode não ter permissão para executar esta ação.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-headline font-extrabold text-primary">
          Gerenciamento de Usuários
        </h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Veja todos os usuários cadastrados e gerencie suas permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'Admin' ? 'default' : 'secondary'}>
                        {user.role === 'Admin' ? <Shield className="mr-2 h-3.5 w-3.5"/> : <User className="mr-2 h-3.5 w-3.5" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Select
                        onValueChange={(value: "Admin" | "Usuário Padrão") => handleRoleChange(user.id, value)}
                        value={user.role}
                        disabled={user.id === currentUser?.uid} // Impede o admin de alterar a própria função
                      >
                        <SelectTrigger className="w-[180px] h-9 ml-auto">
                            <SelectValue placeholder="Alterar função" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Usuário Padrão">Usuário Padrão</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
