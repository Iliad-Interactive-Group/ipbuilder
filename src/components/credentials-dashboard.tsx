
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { AnySecret, WebsitePassword, GateCode, SecureNote } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Loader2, Search } from 'lucide-react';
import { AddSecretModal } from './modals/add-secret-modal';
import { SecretDetailModal } from './modals/secret-detail-modal';
import { useToast } from '@/hooks/use-toast';
import { importCredentials } from '@/ai/flows/import-credentials';
import { v4 as uuidv4 } from 'uuid';
import { Input } from './ui/input';
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from './ui/table';
import { SecretListItem } from './secret-list-item';
import { Checkbox } from './ui/checkbox';
import { SecretsBatchEditToolbar } from './secrets-batch-edit-toolbar';

interface CredentialsDashboardProps {
  secrets: AnySecret[];
}

export const CredentialsDashboard: React.FC<CredentialsDashboardProps> = ({ secrets }) => {
    const { toast } = useToast();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSecret, setSelectedSecret] = useState<AnySecret | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredSecrets = useMemo(() => {
        const sortedSecrets = [...secrets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        if (!searchQuery) return sortedSecrets;
        
        const lowercasedQuery = searchQuery.toLowerCase();
        return sortedSecrets.filter(secret => {
            const valuesToSearch = [
                secret.name,
                secret.description,
                secret.notes,
                ...(secret.tags || [])
            ];

            switch (secret.type) {
                case 'websitePassword':
                    valuesToSearch.push((secret as WebsitePassword).url, (secret as WebsitePassword).username);
                    break;
                case 'gateCode':
                    valuesToSearch.push((secret as GateCode).location, (secret as GateCode).unlockInstructions);
                    break;
                case 'secureNote':
                    valuesToSearch.push((secret as SecureNote).content);
                    break;
            }
            
            return valuesToSearch.some(val => val?.toLowerCase().includes(lowercasedQuery));
        });
    }, [secrets, searchQuery]);

    const handleSelectOne = (id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(selectedId => selectedId !== id));
    };
    
    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? filteredSecrets.map(s => s.id) : []);
    };

    const isAllSelected = filteredSecrets.length > 0 && selectedIds.length === filteredSecrets.length;

    const handleRowClick = (secret: AnySecret) => {
        setSelectedSecret(secret);
    };
    
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('key', uuidv4());
            fileInputRef.current.click();
        }
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        toast({ title: 'Importing Credentials', description: 'Parsing your file... this may take a moment.' });

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const fileContent = e.target?.result as string;
                if (!fileContent) {
                    throw new Error("File could not be read.");
                }
                const result = await importCredentials({ fileData: fileContent, fileName: file.name });
                if (result.success) {
                    toast({ title: 'Import Complete', description: result.message });
                } else {
                     toast({ variant: 'destructive', title: 'Import Failed', description: result.message });
                }
            } catch (err: any) {
                toast({ variant: 'destructive', title: 'Import Failed', description: err.message });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'File Reading Failed', description: 'Could not read the selected file.' });
            setIsImporting(false);
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Credentials Manager</CardTitle>
                        <CardDescription>Securely store and manage passwords, codes, and notes.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                            type="text"
                            placeholder="Search secrets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background border pl-10 pr-4 w-64"
                            />
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept=".csv,.txt" className="hidden" />
                        <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
                            {isImporting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</> : <><Upload className="mr-2 h-4 w-4" /> Import</>}
                        </Button>
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Secret
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <SecretsBatchEditToolbar selectedIds={selectedIds} onClearSelection={() => setSelectedIds([])} />
                </CardContent>
            </Card>
            
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="w-1/5">Name</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Notes & Tags</TableHead>
                                <TableHead className="w-24 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSecrets.length > 0 ? filteredSecrets.map(item => (
                                <SecretListItem 
                                    key={item.id} 
                                    secret={item}
                                    onRowClick={() => handleRowClick(item)}
                                    isSelected={selectedIds.includes(item.id)}
                                    onCheckedChange={(checked) => handleSelectOne(item.id, checked)}
                                />
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No secrets found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isAddModalOpen && <AddSecretModal onClose={() => setIsAddModalOpen(false)} />}
            
            {selectedSecret && (
                <SecretDetailModal 
                    secret={selectedSecret} 
                    onClose={() => setSelectedSecret(null)}
                    onEdit={() => {
                        // Logic to open edit modal
                    }}
                />
            )}
        </div>
    );
};
