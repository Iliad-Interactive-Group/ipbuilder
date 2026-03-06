
'use client';

import React from 'react';
import { AnySecret, WebsitePassword, GateCode, SecureNote, MultiLogin, CustomFieldsSecret } from '@/lib/types';
import { Copy, Globe, StickyNote, Hash, BookUser, FileJson, Lock } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface SecretListItemProps {
    secret: AnySecret;
    onRowClick: () => void;
    isSelected: boolean;
    onCheckedChange: (checked: boolean) => void;
}

const Detail: React.FC<{ label: string; value?: string; isSecret?: boolean }> = ({ label, value, isSecret }) => {
    const { toast } = useToast();
    
    if (!value) return null;
    
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        toast({ title: 'Copied to clipboard' });
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-muted-foreground">{label}:</span>
            <span className={`font-mono text-xs ${isSecret ? 'blur-sm group-hover/row:blur-none transition-all' : ''}`}>{value}</span>
            {isSecret && (
                 <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/row:opacity-100" onClick={handleCopy}>
                    <Copy className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
};

const TypeIcon: React.FC<{ type: AnySecret['type'] }> = ({ type }) => {
    switch (type) {
        case 'websitePassword': return <Globe className="h-4 w-4 text-muted-foreground" />;
        case 'gateCode': return <Hash className="h-4 w-4 text-muted-foreground" />;
        case 'secureNote': return <StickyNote className="h-4 w-4 text-muted-foreground" />;
        case 'multiLogin': return <BookUser className="h-4 w-4 text-muted-foreground" />;
        case 'customFields': return <FileJson className="h-4 w-4 text-muted-foreground" />;
        default: return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
};

export const SecretListItem: React.FC<SecretListItemProps> = ({ secret, onRowClick, isSelected, onCheckedChange }) => {

    const renderDetails = () => {
        switch(secret.type) {
            case 'websitePassword':
                const wp = secret as WebsitePassword;
                return (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Detail label="URL" value={wp.url} />
                        <Detail label="User" value={wp.username} />
                        <Detail label="Pass" value={wp.password} isSecret />
                    </div>
                );
            case 'gateCode':
                const gc = secret as GateCode;
                 return (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                        <Detail label="Location" value={gc.location} />
                        <Detail label="Code" value={gc.code} isSecret />
                    </div>
                );
            case 'secureNote':
                 const sn = secret as SecureNote;
                 return (
                    <p className="text-sm text-muted-foreground truncate">{sn.content}</p>
                 );
            case 'multiLogin':
                const ml = secret as MultiLogin;
                return (
                    <div className="space-y-1">
                         <Detail label="URL" value={ml.url} />
                        <p className="text-sm">{ml.accounts.length} account(s)</p>
                    </div>
                );
            case 'customFields':
                const cf = secret as CustomFieldsSecret;
                return <p className="text-sm">{cf.fields.length} custom field(s)</p>
            default:
                return null;
        }
    };

    return (
        <TableRow onClick={onRowClick} className="cursor-pointer group/row">
            <TableCell onClick={(e) => e.stopPropagation()} className="pl-4">
                <Checkbox checked={isSelected} onCheckedChange={onCheckedChange} />
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-3">
                    <TypeIcon type={secret.type} />
                    <div>
                        <p className="font-bold text-foreground">{secret.name}</p>
                        <p className="text-xs text-muted-foreground">{secret.description}</p>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                {renderDetails()}
            </TableCell>
            <TableCell>
                <p className="text-xs text-muted-foreground truncate w-48">{secret.notes}</p>
                {secret.tags && secret.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {secret.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                    </div>
                )}
            </TableCell>
            <TableCell className="text-right">
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); alert('More actions coming soon!'); }}>
                    ...
                </Button>
            </TableCell>
        </TableRow>
    );
};
