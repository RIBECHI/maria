
"use client";

import Link from 'next/link';
import { useState } from 'react';
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
  KanbanSquare,
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
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Toaster } from "@/components/ui/toaster";
import Logo from '@/components/layout/Logo';
import NavLink from '@/components/layout/NavLink';
import './globals.css';
import { UserProvider } from '@/contexts/UserContext';
import UserInfo from '@/components/layout/UserInfo';
import { NotepadSheet } from '@/components/layout/NotepadSheet';
import UpcomingEventsSidebar from '@/components/layout/UpcomingEventsSidebar';
import ThemeToggle from '@/components/layout/ThemeToggle';
import type React from 'react';
import { AuthProvider, AuthWrapper } from '@/contexts/AuthContext';
import FirebaseErrorListener from '@/components/layout/FirebaseErrorListener';
import { ErrorBoundary } from '@/components/utils/ErrorBoundary';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Painel', icon: <LayoutDashboard /> },
  { href: '/clients', label: 'Clientes', icon: <Users /> },
  { href: '/processes', label: 'Processos', icon: <Briefcase /> },
  { href: '/pipeline', label: 'Pipeline', icon: <KanbanSquare /> },
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

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  
  return (
    <UserProvider>
      <JusticeSymbolWatermark />
      <SidebarProvider defaultOpen>
        <Sidebar 
          collapsible="icon" 
          variant="sidebar" 
          side="left"
          mobileHeader={
            <SheetHeader>
                <SheetTitle>Menu Principal</SheetTitle>
            </SheetHeader>
          }
        >
          <SidebarHeader>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                LexManager
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-1 flex flex-col min-h-0">
             <SidebarMenu className="flex-1 overflow-y-auto">
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
                  <a className="flex w-full">
                    <SidebarMenuButton
                      tooltip={{ children: 'Configurações', side: 'right', align: 'center' }}
                    >
                      <Settings />
                      <span>Configurações</span>
                    </SidebarMenuButton>
                  </a>
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
            <div className="flex-1 text-center">
              <h1 className="text-4xl font-headline font-extrabold text-primary">Painel</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
          <Toaster />
          <FirebaseErrorListener />
        </SidebarInset>
      </SidebarProvider>
      <NotepadSheet isOpen={isNotepadOpen} onOpenChange={setIsNotepadOpen} />
    </UserProvider>
  );
}


export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthProvider>
      <ErrorBoundary>
        <AuthWrapper>
            {pathname === '/login' ? (
                children
            ) : (
                <AppLayout>{children}</AppLayout>
            )}
        </AuthWrapper>
      </ErrorBoundary>
    </AuthProvider>
  );
}
