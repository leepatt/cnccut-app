'use client';

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/cnc/ThemeToggle";
import { UserNav } from "@/components/cnc/UserNav";
import { useTheme } from "next-themes";

const Header: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // After hydration, we can show the theme-aware logo
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <header className="relative sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16">
      <div className="container px-4 md:px-6 flex items-center h-full">
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            {/* Use a consistent image during SSR and hydration, then swap after mounting */}
            {!mounted ? (
              <div style={{ width: 100, height: 100 }} />
            ) : (
              <Image 
                src={resolvedTheme === 'dark' ? "/cnc-cut-logo.png" : "/cnc-cut-logo-black.png"}
                alt="CNC Cut Logo" 
                width={100} 
                height={100} 
                className="h-auto w-auto" 
              />
            )}
          </Link>
        </div>
      </div>

      <div className="absolute top-0 right-0 h-full flex items-center pr-4 md:pr-6 space-x-4"> 
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
};

export default Header; 