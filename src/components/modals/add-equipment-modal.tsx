
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Site, EquipmentCategory, Selection, Station } from '@/lib/types';
import { addEquipment } from '@/lib/actions';

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';


interface AddEquipmentModalProps {
    selection: Selection;
    onClose: () => void;
    allSites: Site[];
    allStations: Station[];
}

const equipmentSchema = z.object({
    description: z.string().min(1, 'Description is required.'),
    category: z.nativeEnum(EquipmentCategory),
    siteId: z.string().optional(),
    stationIds: z.array(z.string()).optional(),
    locationInSite: z.string().optional(),
    storageLocation: z.string().optional(),
    make: z.string().optional(),
    modelNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    ipAddress: z.string().optional(),
    url: z.string().optional(),
    username: z.string().optional(),
    installDate: z.string().optional(),
    notes: z.string().optional(),
});

const sparePartSchema = z.object({
    description: z.string().min(1, 'Description is required.'),
    quantity: z.coerce.number().min(0, 'Quantity must be non-negative.'),
    servicesModel: z.string().optional(),
    compatibleEquipment: z.string().optional(),
    storageLocation: z.string().optional(),
    siteId: z.string().optional(),
});

const CORPORATE_SITE_ID = 'corporate';

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({ selection, onClose, allSites, allStations }) => {
    const { toast } = useToast();
    const [isWebUi, setIsWebUi] = useState(false);
    
    const getDefaultSiteId = () => {
        if (selection.type === 'site') return selection.site.id;
        if (selection.type === 'market') {
           return undefined;
        }
        if (selection.type === 'station') {
            return selection.station.siteId;
        }
        return CORPORATE_SITE_ID;
    }

    const getDefaultStationIds = () => {
        if (selection.type === 'station') return [selection.station.id];
        return [];
    }
    
    const eqForm = useForm<z.infer<typeof equipmentSchema>>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: {
            description: '',
            category: EquipmentCategory.OTHER,
            siteId: getDefaultSiteId(),
            stationIds: getDefaultStationIds(),
            ipAddress: '',
            url: '',
        }
    });

    const spForm = useForm<z.infer<typeof sparePartSchema>>({
        resolver: zodResolver(sparePartSchema),
        defaultValues: {
            description: '',
            quantity: 1,
            siteId: getDefaultSiteId(),
        }
    });

    const ipAddressValue = eqForm.watch('ipAddress');

    useEffect(() => {
        if (isWebUi && ipAddressValue) {
            const firstIp = ipAddressValue.split(',')[0].trim();
            if (firstIp) {
                const url = firstIp.includes(':') ? `http://${firstIp}` : `http://${firstIp}:80`;
                eqForm.setValue('url', url);
            }
        } else if (!isWebUi) {
             eqForm.setValue('url', '');
        }
    }, [isWebUi, ipAddressValue, eqForm]);
    
    const onEquipmentSubmit = async (values: z.infer<typeof equipmentSchema>) => {
        const site = allSites.find(s => s.id === values.siteId);
        const siteShortName = site ? site.shortName : 'Corp';
        const categoryShortName = values.category.substring(0,4);

        const equipmentData = {
            ...values,
            type: 'EQUIPMENT',
            name: `${siteShortName} - ${categoryShortName} - ${values.description}`,
            siteId: values.siteId === CORPORATE_SITE_ID ? undefined : values.siteId,
            ipAddress: values.ipAddress ? values.ipAddress.split(',').map(ip => ip.trim()) : [],
            maintenanceHistory: [],
            attachments: [],
        };
        
        const result = await addEquipment(equipmentData as any);
        if (result.success) {
            toast({ title: "Success", description: "Equipment added successfully." });
            onClose();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const onSparePartSubmit = async (values: z.infer<typeof sparePartSchema>) => {
        const site = allSites.find(s => s.id === values.siteId);
        const siteShortName = site ? site.shortName : 'Corp';

        const sparePartData = {
            ...values,
            type: 'EQUIPMENT',
            category: EquipmentCategory.SPARE_PARTS,
            name: `${siteShortName} - Spare - ${values.description}`,
            siteId: values.siteId === CORPORATE_SITE_ID ? undefined : values.siteId,
            maintenanceHistory: [],
            attachments: [],
        };

        const result = await addEquipment(sparePartData as any);
        if (result.success) {
            toast({ title: "Success", description: "Spare part added successfully." });
            onClose();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const contextName = selection.type === 'site' ? selection.site.name : 
                        selection.type === 'market' ? `${selection.market.name} Market` : 
                        selection.type === 'station' ? selection.station.name : 'Company Wide';
    
    const availableStations = eqForm.watch('siteId') ? allStations.filter(s => s.siteId === eqForm.watch('siteId')) : [];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add New Item</DialogTitle>
                    <DialogDescription>Context: {contextName}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="equipment" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="equipment">Equipment</TabsTrigger>
                        <TabsTrigger value="spare_part">Spare Part</TabsTrigger>
                    </TabsList>
                    <TabsContent value="equipment">
                        <form id="add-equipment-form" onSubmit={eqForm.handleSubmit(onEquipmentSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input id="description" {...eqForm.register('description')} />
                                    {eqForm.formState.errors.description && <p className="text-destructive text-sm mt-1">{eqForm.formState.errors.description.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="category">Category</Label>
                                    <Select onValueChange={(value) => eqForm.setValue('category', value as EquipmentCategory)} defaultValue={eqForm.getValues('category')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.values(EquipmentCategory).filter(c => c !== EquipmentCategory.SPARE_PARTS).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="siteId">Site</Label>
                                    <Select onValueChange={(value) => eqForm.setValue('siteId', value)} defaultValue={eqForm.getValues('siteId')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CORPORATE_SITE_ID}>Corporate (No Site)</SelectItem>
                                            {allSites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {eqForm.watch('siteId') === CORPORATE_SITE_ID ?
                                    <div><Label htmlFor="storageLocation">Storage Location</Label><Input id="storageLocation" {...eqForm.register('storageLocation')} /></div>
                                    : <div><Label htmlFor="locationInSite">Location in Site</Label><Input id="locationInSite" {...eqForm.register('locationInSite')} /></div>
                                }
                                <div><Label htmlFor="make">Make</Label><Input id="make" {...eqForm.register('make')} /></div>
                                <div><Label htmlFor="modelNumber">Model Number</Label><Input id="modelNumber" {...eqForm.register('modelNumber')} /></div>
                                <div><Label htmlFor="serialNumber">Serial Number</Label><Input id="serialNumber" {...eqForm.register('serialNumber')} /></div>
                                <div><Label htmlFor="ipAddress">IP Address (comma-separated)</Label><Input id="ipAddress" {...eqForm.register('ipAddress')} /></div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="is-web-ui" checked={isWebUi} onCheckedChange={(checked) => setIsWebUi(!!checked)} />
                                        <Label htmlFor="is-web-ui" className="font-normal">Has Web Interface</Label>
                                    </div>
                                    <Input id="url" {...eqForm.register('url')} disabled={!isWebUi} placeholder="URL will auto-populate" />
                                </div>

                                <div><Label htmlFor="username">Username</Label><Input id="username" {...eqForm.register('username')} /></div>
                                <div><Label htmlFor="installDate">Install Date</Label><Input type="date" id="installDate" {...eqForm.register('installDate')} /></div>
                            </div>
                            {availableStations.length > 0 && (
                                <div className="space-y-2 pt-4 border-t">
                                    <Label>Associated Stations</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {availableStations.map(station => (
                                            <div key={station.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`station-${station.id}`}
                                                    checked={eqForm.watch('stationIds')?.includes(station.id)}
                                                    onCheckedChange={(checked) => {
                                                        const currentIds = eqForm.getValues('stationIds') || [];
                                                        if (checked) {
                                                            eqForm.setValue('stationIds', [...currentIds, station.id]);
                                                        } else {
                                                            eqForm.setValue('stationIds', currentIds.filter(id => id !== station.id));
                                                        }
                                                    }}
                                                />
                                                <Label htmlFor={`station-${station.id}`} className="font-normal">{station.name}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" {...eqForm.register('notes')} /></div>
                        </form>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" form="add-equipment-form" disabled={eqForm.formState.isSubmitting}>
                                {eqForm.formState.isSubmitting ? "Adding..." : "Add Equipment"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                    <TabsContent value="spare_part">
                         <form id="add-spare-part-form" onSubmit={spForm.handleSubmit(onSparePartSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div><Label htmlFor="description">Part Description</Label><Input id="description" {...spForm.register('description')} /></div>
                                 <div><Label htmlFor="quantity">Quantity</Label><Input type="number" id="quantity" {...spForm.register('quantity')} /></div>
                                 <div>
                                    <Label htmlFor="siteId">Site</Label>
                                    <Select onValueChange={(value) => spForm.setValue('siteId', value)} defaultValue={spForm.getValues('siteId')}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={CORPORATE_SITE_ID}>Corporate (No Site)</SelectItem>
                                            {allSites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {spForm.watch('siteId') === CORPORATE_SITE_ID ?
                                    <div><Label htmlFor="storageLocation">Storage Location</Label><Input id="storageLocation" {...spForm.register('storageLocation')} /></div>
                                    : <div></div>
                                }
                                 <div><Label htmlFor="servicesModel">Services Model</Label><Input id="servicesModel" {...spForm.register('servicesModel')} /></div>
                                 <div><Label htmlFor="compatibleEquipment">Compatible Equipment</Label><Input id="compatibleEquipment" {...spForm.register('compatibleEquipment')} /></div>
                             </div>
                         </form>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button type="submit" form="add-spare-part-form" disabled={spForm.formState.isSubmitting}>
                                {spForm.formState.isSubmitting ? "Adding..." : "Add Spare Part"}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};
