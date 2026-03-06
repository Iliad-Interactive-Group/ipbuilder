
import React, { useState } from 'react';
import { Site, Market, Company, AnyEquipment, EquipmentCategory, Station } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { batchUpdateEquipment, batchArchiveEquipment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { X, Trash2, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

interface BatchEditToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  allSites: Site[];
  allMarkets: Market[];
  allCompanies: Company[];
  allStations: Station[];
}

const UNASSIGNED_VALUE = '_corporate_';

export const BatchEditToolbar: React.FC<BatchEditToolbarProps> = ({
  selectedIds,
  onClearSelection,
  allSites,
  allMarkets,
  allCompanies,
  allStations,
}) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleUpdate = async (field: keyof AnyEquipment | '$add:stationIds', value: string) => {
    if (!value) return;

    setIsUpdating(true);
    let updates: { id: string; data: Partial<AnyEquipment>; special?: 'arrayUnion' }[];
    
    if (field === 'siteId' && value === UNASSIGNED_VALUE) {
        updates = selectedIds.map(id => ({ id, data: { siteId: undefined, marketId: undefined } }));
    } else if (field === '$add:stationIds') {
        updates = selectedIds.map(id => ({ id, data: { stationIds: [value] } as Partial<AnyEquipment>, special: 'arrayUnion' as const }));
    } else if (field === 'category') {
        updates = selectedIds.map(id => ({ id, data: { [field]: value, equipmentType: value } as Partial<AnyEquipment> }));
    }
    else {
        updates = selectedIds.map(id => ({ id, data: { [field]: value } as Partial<AnyEquipment> }));
    }
    
    if (field === 'siteId' && value !== UNASSIGNED_VALUE) {
      const site = allSites.find(s => s.id === value);
      if (site && site.marketId) {
        updates.forEach(u => { (u.data as Record<string, unknown>).marketId = site.marketId; });
      }
    }

    const result = await batchUpdateEquipment(updates);

    if (result.success) {
      toast({
        title: 'Update Successful',
        description: `${selectedIds.length} items have been updated.`,
      });
      onClearSelection();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
    }
    setIsUpdating(false);
  };
  
  const handleArchive = async () => {
    setIsArchiving(true);
    const result = await batchArchiveEquipment(selectedIds);
    if(result.success) {
      toast({ title: 'Success', description: `${selectedIds.length} item(s) have been archived.` });
      onClearSelection();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsArchiving(false);
  }

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/70 rounded-lg border flex-wrap gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm font-semibold">
          {selectedIds.length} item(s) selected
        </div>
        
        <Select onValueChange={(value) => handleUpdate('companyId', value)}>
          <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Set Company..." /></SelectTrigger>
          <SelectContent>
            {allCompanies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleUpdate('marketId', value)}>
          <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Set Market..." /></SelectTrigger>
          <SelectContent>
            {allMarkets.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => handleUpdate('siteId', value)}>
          <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Set Site..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED_VALUE}>Corporate/Unassigned</SelectItem>
            {allSites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        
        <Select onValueChange={(value) => handleUpdate('category', value)}>
          <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Set Type..." /></SelectTrigger>
          <SelectContent>
            {Object.values(EquipmentCategory).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        
        <Select onValueChange={(value) => handleUpdate('$add:stationIds', value)}>
          <SelectTrigger className="w-[180px] bg-background"><SelectValue placeholder="Add Station Tag..." /></SelectTrigger>
          <SelectContent>
            {allStations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isArchiving}>
              {isArchiving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Archive Selected
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will archive {selectedIds.length} item(s). This action can be reversed later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Yes, archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isUpdating && <span className="text-sm text-muted-foreground">Updating...</span>}

      </div>
      <Button variant="ghost" size="icon" onClick={onClearSelection} title="Clear selection" disabled={isUpdating || isArchiving}>
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

    