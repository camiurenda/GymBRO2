'use client';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { LayoutDashboard, BarChart3, Upload, LogOut, User as UserIcon, BrainCircuit } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  const getInitials = (email: string | null) => {
    if (!email) return <UserIcon />;
    return email.substring(0, 2).toUpperCase();
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Panel' },
    { href: '/progress', icon: BarChart3, label: 'Progreso' },
    { href: '/recommendations', icon: BrainCircuit, label: 'Coach IA' },
    { href: '/import', icon: Upload, label: 'Importar Plan' },
  ]

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
                 <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref>
                        <SidebarMenuButton tooltip={item.label} isActive={pathname.startsWith(item.href)}>
                        <item.icon />
                        <span>{item.label}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="group/footer flex items-center gap-2 rounded-md p-2 hover:bg-sidebar-accent">
             <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                <p className="truncate text-sm font-medium">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 shrink-0 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-2 group-data-[collapsible=icon]:top-2" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur-sm lg:px-6">
            <SidebarTrigger className="md:hidden" />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
