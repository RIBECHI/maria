
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react'; 
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';

type NavLinkProps = {
  href: string;
  label: string;
  icon: React.ReactNode; 
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
    <Link href={href} passHref>
      <a onClick={handleClick}>
        <SidebarMenuButton
          isActive={isActive}
          tooltip={{ children: label, side: 'right', align: 'center' }}
        >
          {icon}
          <span>{label}</span>
        </SidebarMenuButton>
      </a>
    </Link>
  );
}
