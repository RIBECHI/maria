
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  Lightbulb,
  Settings,
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
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from "@/components/ui/toaster";
import Logo from '@/components/layout/Logo';
import NavLink from '@/components/layout/NavLink';
import './globals.css';

export const metadata: Metadata = {
  title: 'LexManager',
  description: 'Software de Gestão Jurídica',
};

const navItems = [
  { href: '/', label: 'Painel', icon: <LayoutDashboard /> },
  { href: '/clients', label: 'Clientes', icon: <Users /> },
  { href: '/processes', label: 'Processos', icon: <Briefcase /> },
  { href: '/documents', label: 'Documentos', icon: <FileText /> },
  { href: '/legal-reminder', label: 'Lembrete Legal', icon: <Lightbulb /> },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
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
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-2 border-t border-sidebar-border">
              <SidebarMenu>
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
                   <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/40x40.png" alt="Avatar do Usuário" data-ai-hint="user avatar" />
                        <AvatarFallback>LA</AvatarFallback>
                      </Avatar>
                      <div className="group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-medium text-sidebar-foreground">Laura Antonelli</p>
                        <p className="text-xs text-sidebar-foreground/70">Advogada</p>
                      </div>
                   </div>
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
              {/* Placeholder for breadcrumbs or global actions */}
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
            <Toaster />
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
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
  )
}
