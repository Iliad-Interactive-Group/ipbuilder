
import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { AnyEquipment, EquipmentCategory, MaintenanceLog, Transmitter, ACUnit, UPS, Generator, Attachment, AttachmentType, SparePart, StationVehicle, Exciter, Station } from '@/lib/types';
import { addMaintenanceLog, addAttachment, deleteAttachment, updateEquipment, archiveEquipment } from '@/lib/actions';
import { getEquipmentInfoStatus, getEquipmentMaintenanceStatus } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
    Pencil, AlertTriangle, Info, Paperclip, ClipboardCheck, X, Trash2
} from 'lucide-react';

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface EquipmentDetailModalProps {
  equipment: AnyEquipment;
  allEquipment: AnyEquipment[];
  allStations: Station[];
  onClose: () => void;
  onEditClick: () => void;
  locationContext: string;
}

const DetailRow: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
      {children || value || <span className="text-muted-foreground/70">N/A</span>}
    </dd>
  </div>
);

const AddMaintenanceLogForm: React.FC<{ equipmentId: string; isDisabled: boolean; }> = ({ equipmentId, isDisabled }) => {
    const { toast } = useToast();
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ notes: string, technician: string }>();

    const onSubmit = async (data: { notes: string, technician: string }) => {
        if (!data.notes.trim() || !data.technician.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Technician and notes are required.' });
            return;
        }
        const result = await addMaintenanceLog(equipmentId, { ...data, type: 'Note', date: new Date().toISOString() });
        if(result.success) {
            toast({ title: 'Success', description: 'Log added.' });
            reset({ notes: '', technician: '' });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6">
            <h4 className="text-md font-semibold text-foreground mb-2">Add Maintenance Log/Note</h4>
            <div className="space-y-3">
                <Textarea {...register('notes')} placeholder={isDisabled ? "Cannot add logs to this asset" : "e.g., Replaced PA module..."} rows={3} required disabled={isDisabled} />
                <div className="flex items-center gap-3">
                    <Input {...register('technician')} placeholder="Technician Name" required disabled={isDisabled} />
                    <Button type="submit" disabled={isDisabled || isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Log'}
                    </Button>
                </div>
            </div>
        </form>
    );
};

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({ equipment, allEquipment, allStations, onClose, onEditClick, locationContext }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const infoStatus = getEquipmentInfoStatus(equipment);
  const maintenanceStatus = getEquipmentMaintenanceStatus(equipment);
  const isSparePart = equipment.category === EquipmentCategory.SPARE_PARTS;
  
  const handleArchive = async () => {
    const result = await archiveEquipment(equipment.id);
    if (result.success) {
      toast({ title: "Archived", description: `${equipment.name} has been archived.` });
      onClose();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const attachmentType = prompt("Enter attachment type (Manual, Receipt, Warranty, Other):", "Other");
        const newAttachment: Omit<Attachment, 'id' | 'url'> = {
            fileName: file.name,
            fileType: file.type,
            size: file.size,
            type: (attachmentType || 'Other') as AttachmentType,
        };
        const result = await addAttachment(equipment.id, dataUrl, newAttachment);
        if (result.success) {
            toast({ title: "Success", description: "Attachment uploaded." });
        } else {
            toast({ variant: "destructive", title: "Upload Failed", description: result.error });
        }
      }
    };
    reader.readAsDataURL(file);
    if(event.target) event.target.value = '';
  };

  const handleLogPartReplacement = async (sparePartId: string, quantityUsed: number, technician: string) => {
    let partName = 'Unknown Part';
    const partToUpdate = allEquipment.find(p => p.id === sparePartId) as SparePart | undefined;
    
    if (partToUpdate) {
        partName = partToUpdate.description ?? partToUpdate.name ?? 'Unknown Part';
        const newQuantity = partToUpdate.quantity - quantityUsed;
        await updateEquipment(sparePartId, { quantity: newQuantity });
    }

    const newLog: Omit<MaintenanceLog, 'id'> = {
        date: new Date().toISOString(),
        technician: technician,
        type: 'Part Replacement',
        notes: `Replaced part using ${quantityUsed}x ${partName}.`,
    };
    
    await addMaintenanceLog(equipment.id, newLog);
    
    if (equipment.category === EquipmentCategory.AC_UNIT || equipment.category === EquipmentCategory.TRANSMITTER) {
        await updateEquipment(equipment.id, { lastFilterChangeDate: new Date().toISOString() });
    }
  }

  const handleLogFilterChange = async () => {
    if (equipment.category !== EquipmentCategory.AC_UNIT && equipment.category !== EquipmentCategory.TRANSMITTER) return;
    const { siteId, airFilterSize, filterCount = 1 } = equipment as ACUnit | Transmitter;

    if (!airFilterSize) {
        toast({ variant: 'destructive', title: 'Action Failed', description: "The air filter size for this equipment is not set."});
        return;
    }

    const onSiteParts = allEquipment.filter(e => e.siteId === siteId && e.category === EquipmentCategory.SPARE_PARTS) as SparePart[];
    const matchingFilter = onSiteParts.find(p => p.description?.toLowerCase().includes(airFilterSize.toLowerCase()));

    if (!matchingFilter || matchingFilter.quantity < filterCount) {
        toast({ variant: 'destructive', title: 'Action Failed', description: `Not enough '${airFilterSize}' filters on site. Required: ${filterCount}, Available: ${matchingFilter?.quantity || 0}.`});
        return;
    }

    const technician = prompt(`Found ${matchingFilter.quantity}x '${matchingFilter.description}' filters. Enter name to log use of ${filterCount}:`);

    if (technician && technician.trim() !== '') {
        handleLogPartReplacement(matchingFilter.id, filterCount, technician);
    }
  };

  const associatedStations = equipment.stationIds
    ? equipment.stationIds.map(id => allStations.find(s => s.id === id)).filter((s): s is Station => !!s)
    : [];

  const renderSpecificDetails = () => {
    switch (equipment.category) {
      case EquipmentCategory.SPARE_PARTS:
        return <><DetailRow label="Quantity" value={(equipment as SparePart).quantity} /><DetailRow label="Services Model" value={(equipment as SparePart).servicesModel} /></>;
      // Other cases
      default: return null;
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl">{equipment.name}</DialogTitle>
              <DialogDescription>{locationContext}</DialogDescription>
            </div>
             <div className="flex items-center gap-2">
              <Button onClick={onEditClick} size="icon" variant="ghost"><Pencil className="h-5 w-5"/></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="destructive_ghost"><Trash2 className="h-5 w-5"/></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive the item '{equipment.name}'. It will be moved to the archive and can be restored later if needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive}>Yes, Archive Item</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
        <div className="p-1 space-y-6">
          <TooltipProvider>
          {(infoStatus.hasMissingInfo || maintenanceStatus.level !== 'ok') && (
            <div className="flex gap-4">
              {infoStatus.hasMissingInfo && 
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="border-blue-500 text-blue-500"><Info className="mr-2 h-4 w-4"/>Incomplete Data</Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>Missing: {infoStatus.missingFields.join(', ')}</p></TooltipContent>
                </Tooltip>
              }
              {maintenanceStatus.level !== 'ok' &&
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={maintenanceStatus.level === 'overdue' ? 'destructive' : 'secondary'} className={maintenanceStatus.level === 'due' ? 'border-orange-500 text-orange-500' : ''}><AlertTriangle className="mr-2 h-4 w-4"/>Maintenance Due</Badge>
                    </TooltipTrigger>
                    <TooltipContent>{maintenanceStatus.reasons.map((r,i) => <p key={i}>{r}</p>)}</TooltipContent>
                </Tooltip>
              }
            </div>
          )}
          </TooltipProvider>

          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="text-md font-semibold text-foreground mb-2">General Information</h4>
            <dl>
              <DetailRow label="Description" value={equipment.description} />
              <DetailRow label="Category" value={equipment.category} />
              {associatedStations.length > 0 && (
                <DetailRow label="Station(s)">
                    <div className="flex flex-wrap gap-2">
                        {associatedStations.map(station => (
                            <Badge key={station.id} variant="secondary">{station.name}</Badge>
                        ))}
                    </div>
                </DetailRow>
              )}
              <DetailRow label="Make" value={equipment.make} />
              <DetailRow label="Model" value={equipment.modelNumber} />
              <DetailRow label="Serial #" value={equipment.serialNumber} />
              <DetailRow label="IP Address" value={Array.isArray(equipment.ipAddress) ? equipment.ipAddress.join(', ') : equipment.ipAddress} />
               {renderSpecificDetails()}
            </dl>
          </div>

          <AddMaintenanceLogForm equipmentId={equipment.id} isDisabled={isSparePart} />
          
          <div className="mt-6">
            <h4 className="text-md font-semibold text-foreground mb-2">Maintenance History</h4>
            <ScrollArea className="h-60 pr-2">
              <div className="space-y-3">
                {Array.isArray(equipment.maintenanceHistory) && [...equipment.maintenanceHistory].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                  <div key={log.id} className="bg-muted/30 p-3 rounded-md border-l-4 border-primary">
                    <div className="flex justify-between items-center"><p className="font-semibold">{log.type} by {log.technician}</p><p className="text-xs">{new Date(log.date).toLocaleString()}</p></div>
                    <p className="text-sm mt-1">{log.notes}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

        </div>
        </ScrollArea>
    </DialogContent>
    </Dialog>
  );
};
