
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";

export default function ThemeToggle() {
  const [isDarkMode, setIsDarkMode] = React.useState(true);

  React.useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const isDark = storedTheme !== "light";
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newIsDark = !prev;
      if (newIsDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newIsDark;
    });
  };

  const tooltipText = isDarkMode ? "Mudar para tema claro" : "Mudar para tema escuro";

  return (
    <SidebarMenuButton
      onClick={toggleTheme}
      tooltip={{ children: tooltipText, side: 'right', align: 'center' }}
    >
      {isDarkMode ? <Sun /> : <Moon />}
      <span>{isDarkMode ? "Tema Claro" : "Tema Escuro"}</span>
    </SidebarMenuButton>
  );
}
