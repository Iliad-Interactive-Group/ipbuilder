
'use client'

import React from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/user-nav';
import { useAuth } from '@/components/auth-provider';


interface HeaderProps {
  siteName: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddItemClick: () => void;
  isAddDisabled: boolean;
  showAddItemButton: boolean;
}

export const Header: React.FC<HeaderProps> = ({ siteName, searchQuery, setSearchQuery, onAddItemClick, isAddDisabled, showAddItemButton }) => {
  const { user } = useAuth();
  
  return (
    <header className="h-16 bg-card shadow-sm z-10 flex items-center justify-between px-6 border-b shrink-0">
      <h1 className="text-2xl font-semibold text-foreground truncate">{siteName}</h1>
      <div className="flex items-center gap-4">
        {user && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border pl-10 pr-4 w-64"
            />
          </div>
        )}
        {showAddItemButton && user && (
            <Button
              onClick={onAddItemClick}
              disabled={isAddDisabled}
              title={isAddDisabled ? "Select a site, market, or corporate view to add an item" : "Add new equipment or spare part"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
        )}
        <UserNav />
      </div>
    </header>
  );
};
