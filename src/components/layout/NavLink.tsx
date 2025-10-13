
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
    <Link href={href} passHref legacyBehavior>
      {/*
        Using legacyBehavior with passHref and an 'as="a"' prop on SidebarMenuButton
        ensures Link works correctly with custom component children that should behave like anchors.
        SidebarMenuButton will render as an <a> tag due to as="a".
      */}
      <SidebarMenuButton
        as="a"
        isActive={isActive}
        tooltip={{ children: label, side: 'right', align: 'center' }}
        onClick={handleClick}
      >
        {icon} {/* Render the icon JSX element directly */}
        <span>{label}</span>
      </SidebarMenuButton>
    </Link>
  );
}
