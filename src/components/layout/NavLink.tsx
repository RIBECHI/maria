
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react'; // Import React for React.ReactNode
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode; // Icon is now a ReactNode (JSX element)
};

export default function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = href === '/' ? pathname === href : pathname.startsWith(href);

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };


  return (
    <Link href={href}>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={{ children: label, side: 'right', align: 'center' }}
        onClick={handleClick}
      >
        <a>
          {icon}
          <span>{label}</span>
        </a>
      </SidebarMenuButton>
    </Link>
  );
}
