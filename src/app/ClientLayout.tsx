
"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Lightbulb,
  Settings,
  CalendarDays,
  Notebook,
  FileCog,
  FileSignature,
  ListChecks,
  LogIn,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import Logo from '@/components/layout/Logo';
import NavLink from '@/components/layout/NavLink';
import './globals.css';
import { UserProvider, useUser } from '@/contexts/UserContext';
import UserInfo from '@/components/layout/UserInfo';
import { NotepadSheet } from '@/components/layout/NotepadSheet';
import UpcomingEventsSidebar from '@/components/layout/UpcomingEventsSidebar';
import ThemeToggle from '@/components/layout/ThemeToggle';
import type React from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const navItems = [
  { href: '/', label: 'Painel', icon: <LayoutDashboard /> },
  { href: '/clients', label: 'Clientes', icon: <Users /> },
  { href: '/processes', label: 'Processos', icon: <Briefcase /> },
  { href: '/tasks', label: 'Tarefas', icon: <ListChecks /> },
  { href: '/documents', label: 'Documentos', icon: <FileText /> },
  { href: '/agenda', label: 'Agenda', icon: <CalendarDays /> },
  { href: '/legal-reminder', label: 'Lembrete Legal', icon: <Lightbulb /> },
  { href: '/document-generator', label: 'Gerador de Documentos', icon: <FileSignature /> },
  { href: '/pdf-tools', label: 'Ferramentas PDF', icon: <FileCog /> },
];

function JusticeSymbolWatermark() {
  return (
    <div className="watermark-container" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="watermark-svg"
      >
        <path d="M12 3v18" />
        <path d="M3 7h18" />
        <path d="M12 7V3" />
        <path d="M6 15a6 6 0 0 0 12 0" />
        <path d="M6 7a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0V9a2 2 0 0 0-2-2z" />
        <path d="M18 7a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0V9a2 2 0 0 0-2-2z" />
      </svg>
    </div>
  );
}

function PanelLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <line x1="9" x2="9" y1="3" y2="21" />
    </svg>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, setUser, isLoading, setIsLoading } = useUser();
    const [isDisplayNameModalOpen, setIsDisplayNameModalOpen] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        try {
            const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
                if (firebaseUser) {
                    const needsDisplayName = !firebaseUser.displayName;
                    if (needsDisplayName) {
                        setIsDisplayNameModalOpen(true);
                    }
                    setUser({
                        uid: firebaseUser.uid,
                        displayName: firebaseUser.displayName || "Novo Usuário",
                        email: firebaseUser.email || "",
                        photoURL: firebaseUser.photoURL || "",
                    });
                } else {
                    setUser(null);
                }
                setIsLoading(false);
            });
    
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase Auth initialization error:", error);
            setUser(null);
            setIsLoading(false);
        }
    }, [setUser, setIsLoading]);

    useEffect(() => {
        if (!isLoading && !user && pathname !== '/login') {
            router.push('/login');
        }
    }, [isLoading, user, pathname, router]);

    const handleUpdateDisplayName = async () => {
        const currentUser = auth.currentUser;
        if (currentUser && newDisplayName.trim()) {
            try {
                await updateProfile(currentUser, { displayName: newDisplayName.trim() });
                setUser({ ...user!, displayName: newDisplayName.trim() });
                setIsDisplayNameModalOpen(false);
                toast({ title: "Nome de exibição salvo!", description: "Seu perfil foi atualizado." });
            } catch (error: any) {
                toast({ title: "Erro ao salvar nome", description: error.message, variant: "destructive" });
            }
        }
    };


    if (isLoading || (!user && pathname !== '/login')) {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Logo className="h-16 w-16 text-primary" />
                <Skeleton className="h-4 w-48" />
            </div>
        </div>
      );
    }
    
    if (pathname === '/login') {
      return <>{children}</>;
    }

    return (
        <>
            <AppLayout>{children}</AppLayout>
            <Dialog open={isDisplayNameModalOpen} onOpenChange={setIsDisplayNameModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bem-vindo(a) ao LexManager!</DialogTitle>
                        <DialogDescription>
                            Para personalizar sua experiência, por favor, insira como você gostaria de ser chamado(a).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="displayName" className="text-right">
                                Nome
                            </Label>
                            <Input
                                id="displayName"
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                                className="col-span-3"
                                placeholder="Seu nome ou do escritório"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateDisplayName}>Salvar Nome</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}


function AppLayout({ children }: { children: React.ReactNode }) {
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <>
      <JusticeSymbolWatermark />
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="sidebar" side="left">
          <SidebarHeader className="h-16 flex items-center p-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                LexManager
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <NavLink href={item.href} label={item.label} icon={item.icon} />
                </SidebarMenuItem>
              ))}
               <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setIsNotepadOpen(true)}
                    tooltip={{ children: 'Bloco de Notas', side: 'right', align: 'center' }}
                  >
                    <Notebook />
                    <span>Bloco de Notas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator className="my-2" />
            <UpcomingEventsSidebar />
          </SidebarContent>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <ThemeToggle />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/settings" passHref legacyBehavior>
                  <SidebarMenuButton
                    as="a"
                    tooltip={{ children: 'Configurações', side: 'right', align: 'center' }}
                  >
                    <Settings />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <UserInfo />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
            <SidebarTrigger className="md:hidden">
              <PanelLeftIcon className="h-5 w-5" />
              <span className="sr-only">Alternar Menu</span>
            </SidebarTrigger>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
      <NotepadSheet isOpen={isNotepadOpen} onOpenChange={setIsNotepadOpen} />
    </>
  );
}


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <FirebaseErrorListener />
      <AuthWrapper>{children}</AuthWrapper>
    </UserProvider>
  );
}
