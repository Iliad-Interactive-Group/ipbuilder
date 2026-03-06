
'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, Loader2, DatabaseZap, HardHat, Info, Building, Map as MapIcon, RadioTower, Megaphone, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportData } from '@/ai/flows/export-data';
import { importData } from '@/ai/flows/import-data';
import { importSiteData } from '@/ai/flows/import-site-data';
import { Market, Site, Company, Station } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { archiveCompany, archiveMarket, archiveSite, archiveStation } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCompanies, useStations } from '@/lib/hooks';

async function runFlow(flowId: string, input?: any) {
    const response = await fetch('/api/call-genkit-flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flowId, input }),
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Flow execution failed');
    }
  
    return await response.json();
}

interface DataManagementDashboardProps {
  allMarkets: Market[];
  allSites: Site[];
  onAddStation: () => void;
}

const HierarchyTable = ({ items, onArchive, type, getParentName }: { items: (Company | Market | Site | Station)[], onArchive: (item: any) => void, type: string, getParentName?: (id?: string) => string | undefined }) => (
    <div className="rounded-md border">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    {getParentName && <TableHead>Parent</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length > 0 ? items.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                         {getParentName && ('companyId' in item || 'marketId' in item || 'siteId' in item) &&
                            <TableCell>{getParentName(
                                'siteId' in item ? (item as {siteId: string}).siteId :
                                'marketId' in item ? (item as {marketId: string}).marketId :
                                'companyId' in item ? (item as {companyId: string}).companyId :
                                undefined
                            )}</TableCell>
                        }
                        <TableCell className="text-right">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive_ghost" size="sm">Archive</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will archive the {type} &quot;{item.name}&quot;. This is a non-destructive action and can be restored, but child assets will be orphaned.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onArchive(item)}>Yes, archive</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={getParentName ? 3 : 2} className="h-24 text-center">No {type}s found.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
);


export const DataManagementDashboard: React.FC<DataManagementDashboardProps> = ({ allMarkets, allSites, onAddStation }) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState<'asset' | 'site' | false>(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<'asset' | 'site'>('asset');
  
  const [allCompanies] = useCompanies();
  const [allStations] = useStations();
  
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const handleExport = async () => {
    setIsExporting(true);
    toast({ title: 'Exporting Data', description: 'Please wait while we gather your data into an XLSX file...' });
    try {
      const base64Data = await exportData();
      if (!base64Data) {
        toast({ variant: 'destructive', title: 'Export Failed', description: 'No data returned from the export function.' });
        return;
      }
      
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
      link.setAttribute('download', `broadcast-insite-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({ title: 'Export Successful', description: `Your data has been exported to XLSX.` });

    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: 'destructive', title: 'Export Failed', description: 'An error occurred while exporting data.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = (type: 'asset' | 'site') => {
    setImportType(type);
    if (fileInputRef.current) {
        fileInputRef.current.setAttribute('key', uuidv4());
    }
    fileInputRef.current?.click();
  };

  const handleSeedClick = async () => {
    if (!confirm('This will seed your database with the initial company structure. It is safe to run multiple times. Do you want to continue?')) {
      return;
    }
    setIsSeeding(true);
    toast({ title: 'Seeding Database', description: 'Setting up initial company, market, and site data...' });
    try {
        const result = await runFlow('seedDatabaseFlow');
        toast({ title: 'Database Seeded', description: result });
    } catch(err: any) {
        console.error("Seeding failed:", err);
        toast({ variant: 'destructive', title: 'Seeding Failed', description: err.message });
    } finally {
        setIsSeeding(false);
    }
  }
  
  const filteredSites = useMemo(() => {
    if (!selectedMarketId) return [];
    return allSites.filter(s => s.marketId === selectedMarketId);
  }, [selectedMarketId, allSites]);

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(importType);
    toast({ title: 'Importing Data', description: `Parsing and processing your ${importType} file...` });

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const dataUrl = e.target?.result as string;
            if (typeof dataUrl !== 'string') {
              throw new Error("File could not be read.");
            }
            
            const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
            
            let result;
            if (importType === 'asset') {
                result = await importData({
                  fileData: base64Data,
                  fileName: file.name,
                  siteId: selectedSiteId,
                  marketId: selectedMarketId,
                });
            } else {
                 result = await importSiteData({
                  csvData: base64Data,
                  siteId: selectedSiteId,
                });
            }
            
            toast({ title: 'Import Successful', description: `${result.message}` });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Import Failed', description: err.message });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    reader.onerror = (err) => {
        toast({ variant: 'destructive', title: 'File Reading Failed', description: 'Could not read the selected file.' });
    };
    reader.readAsDataURL(file);
  };
  
  const handleArchive = async (type: 'company' | 'market' | 'site' | 'station', item: any) => {
    let result;
    if (type === 'company') result = await archiveCompany(item.id);
    else if (type === 'market') result = await archiveMarket(item.id);
    else if (type === 'site') result = await archiveSite(item.id);
    else if (type === 'station') result = await archiveStation(item.id);

    if(result?.success) {
      toast({ title: 'Success', description: `${item.name} has been archived.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result?.error });
    }
  };

  const marketNameMap = useMemo(() => new Map(allMarkets.map(m => [m.id, m.name])), [allMarkets]);
  const companyNameMap = useMemo(() => new Map(allCompanies.map(c => [c.id, c.name])), [allCompanies]);
  const siteNameMap = useMemo(() => new Map(allSites.map(s => [s.id, s.name])), [allSites]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Import and export asset data, manage organizational hierarchy, and perform other data-related tasks.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><HardHat className="w-5 h-5 mr-3" /> Initial Setup</CardTitle>
            <CardDescription>Run this once to create the company, market, and site structure in your database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button className="w-full" onClick={handleSeedClick} disabled={isSeeding}>
                {isSeeding ? <><Loader2 className="animate-spin mr-2" /> Seeding...</> : <>Seed Foundational Data</>}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DatabaseZap className="w-5 h-5 mr-3" /> Import/Export</CardTitle>
            <CardDescription>Select a context for imports, or leave blank for company-wide.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="market-select">Market Context</Label>
                   <Select onValueChange={setSelectedMarketId} value={selectedMarketId}>
                      <SelectTrigger id="market-select"><SelectValue placeholder="Select a market..." /></SelectTrigger>
                      <SelectContent>{allMarkets.map(market => <SelectItem key={market.id} value={market.id}>{market.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                 <div>
                  <Label htmlFor="site-select">Site Context</Label>
                   <Select onValueChange={setSelectedSiteId} value={selectedSiteId} disabled={!selectedMarketId}>
                      <SelectTrigger id="site-select"><SelectValue placeholder="Select a site..." /></SelectTrigger>
                      <SelectContent>{filteredSites.map(site => <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <input type="file" ref={fileInputRef} onChange={handleFileSelected} accept=".csv,.txt,.xlsx" className="hidden" />
                <Button className="w-full" onClick={() => handleImportClick('asset')} disabled={isImporting !== false}>
                    {isImporting === 'asset' ? <><Loader2 className="animate-spin mr-2" /> Importing...</> : <><Upload className="mr-2" />Import Assets</>}
                </Button>
                 <Button className="w-full" variant="secondary" onClick={() => handleImportClick('site')} disabled={isImporting !== false || !selectedSiteId}>
                    {isImporting === 'site' ? <><Loader2 className="animate-spin mr-2" /> Importing...</> : <><Info className="mr-2" />Import Site Info</>}
                </Button>
             </div>
              <div className="flex gap-4 pt-2">
                 <Button className="w-full" variant="outline" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <><Loader2 className="animate-spin mr-2" /> Exporting...</> : <><Download className="mr-2"/>Export to XLSX</>}
                </Button>
              </div>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Hierarchy Management</CardTitle>
              <CardDescription>
                Manage the core organizational structure. Archiving an item here will not delete its children assets (they will be orphaned).
              </CardDescription>
            </div>
             <Button onClick={onAddStation}>
              <Plus className="mr-2"/> Add Station
             </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="companies">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="companies"><Building className="mr-2"/>Companies</TabsTrigger>
              <TabsTrigger value="markets"><MapIcon className="mr-2"/>Markets</TabsTrigger>
              <TabsTrigger value="sites"><RadioTower className="mr-2"/>Sites</TabsTrigger>
              <TabsTrigger value="stations"><Megaphone className="mr-2"/>Stations</TabsTrigger>
            </TabsList>
            <TabsContent value="companies" className="mt-4">
              <HierarchyTable items={allCompanies} onArchive={(item) => handleArchive('company', item)} type="company" />
            </TabsContent>
            <TabsContent value="markets" className="mt-4">
              <HierarchyTable items={allMarkets} onArchive={(item) => handleArchive('market', item)} type="market" getParentName={(id) => id ? companyNameMap.get(id) : undefined} />
            </TabsContent>
            <TabsContent value="sites" className="mt-4">
              <HierarchyTable items={allSites} onArchive={(item) => handleArchive('site', item)} type="site" getParentName={(id) => id ? marketNameMap.get(id) : undefined} />
            </TabsContent>
            <TabsContent value="stations" className="mt-4">
                <HierarchyTable items={allStations} onArchive={(item) => handleArchive('station', item)} type="station" getParentName={(id) => id ? siteNameMap.get(id) : undefined} />
            </TabsContent>
          </Tabs>
        </CardContent>
       </Card>
    </div>
  );
};
