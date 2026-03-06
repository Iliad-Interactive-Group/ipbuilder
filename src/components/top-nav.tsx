
'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, KeyRound, DatabaseZap, Database, ScrollText } from 'lucide-react';
import { Selection } from '@/lib/types';

interface TopNavProps {
    activeView: Selection['type'];
}

export const TopNav: React.FC<TopNavProps> = ({ activeView }) => {

    const navItems = [
        { href: '/', view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
        { href: '/?view=credentials', view: 'credentials', label: 'Credentials', icon: <KeyRound /> },
        { href: '/?view=changelog', view: 'changelog', label: 'Changelog', icon: <ScrollText /> },
        { href: '/?view=data_management', view: 'data_management', label: 'Data Management', icon: <DatabaseZap /> },
        { href: '/?view=raw_data', view: 'raw_data', label: 'Raw Data', icon: <Database /> },
    ];
    
    const isDashboardActive = !['credentials', 'data_management', 'raw_data', 'changelog'].includes(activeView);

    return (
        <div className="bg-card border-b">
            <nav className="flex items-center space-x-1 px-4">
                {navItems.map(item => (
                    <Link
                        key={item.view}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors",
                            (item.view === 'dashboard' ? isDashboardActive : activeView === item.view)
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

    