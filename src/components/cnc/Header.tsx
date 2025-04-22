'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-700 bg-[#1A1A1A] px-4 py-2 text-[#FAF0E6] shadow-sm">
      <div className="container mx-auto flex h-14 items-center justify-between">
        {/* Logo Placeholder */}
        <div className="text-lg font-bold tracking-tight text-[#FAF0E6]">
          CNC Cut Logo
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer">
              {/* Replace with actual user image if available */}
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback> {/* Placeholder Initials */}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 border-neutral-700 bg-[#1A1A1A] text-[#FAF0E6]"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-neutral-400">
                  user@example.com {/* Replace with actual user email */}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-neutral-700" />
            <DropdownMenuItem className="hover:bg-[#351210] focus:bg-[#351210] cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {/* Add other items like Settings, Billing etc. if needed */}
            <DropdownMenuSeparator className="bg-neutral-700" />
            <DropdownMenuItem className="hover:bg-[#351210] focus:bg-[#351210] cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header; 