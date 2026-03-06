
'use client';

import React, { useState, useMemo } from 'react';
import { ChangeEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ScrollText, User, Tag, FilePlus, FilePen, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ChangelogDashboardProps {
  changelog: ChangeEvent[];
}

const ActionIcon: React.FC<{ action: ChangeEvent['action'] }> = ({ action }) => {
    switch (action) {
        case 'create':
            return <FilePlus className="text-green-500" />;
        case 'update':
            return <FilePen className="text-blue-500" />;
        case 'archive':
        case 'batch-archive':
            return <Archive className="text-destructive" />;
        default:
            return <ScrollText />;
    }
};

export const ChangelogDashboard: React.FC<ChangelogDashboardProps> = ({ changelog }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChangelog = useMemo(() => {
        if (!searchQuery) return changelog;
        const lowercasedQuery = searchQuery.toLowerCase();
        return changelog.filter(log => 
            (log.docName || '').toLowerCase().includes(lowercasedQuery) ||
            log.collection.toLowerCase().includes(lowercasedQuery) ||
            log.userName.toLowerCase().includes(lowercasedQuery) ||
            log.summary.toLowerCase().includes(lowercasedQuery) ||
            log.action.toLowerCase().includes(lowercasedQuery) ||
            log.docId.toLowerCase().includes(lowercasedQuery)
        );
    }, [changelog, searchQuery]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Changelog</CardTitle>
                        <CardDescription>A complete history of all changes to the inventory.</CardDescription>
                    </div>
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search changes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background border pl-10 pr-4 w-80"
                        />
                    </div>
                </CardHeader>
            </Card>

            <div className="space-y-8 relative">
                {/* Vertical timeline bar */}
                <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border -z-10"></div>
                {filteredChangelog.map(log => (
                    <div key={log.id} className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-14 h-14 bg-card border rounded-full flex items-center justify-center">
                            <ActionIcon action={log.action} />
                        </div>
                        <div className="flex-grow pt-1">
                            <div className="flex items-center gap-3">
                                <Badge variant="secondary">{log.collection}</Badge>
                                <p className="text-sm font-semibold text-foreground">
                                    {log.docName ? log.docName : log.docId}
                                </p>
                            </div>
                            <p className="mt-1 text-muted-foreground">{log.summary}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{log.userName}</span>
                                </div>
                                <span>
                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                 {filteredChangelog.length === 0 && (
                    <Card className="flex flex-col items-center justify-center h-64">
                        <CardContent className="text-center pt-6">
                            <p className="text-xl text-foreground">No matching changes found.</p>
                            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search query.</p>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
    );
};

    