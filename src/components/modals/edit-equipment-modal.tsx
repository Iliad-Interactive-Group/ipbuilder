
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AnyEquipment, Equipment, Site, EquipmentCategory, Transmitter, ACUnit, UPS, Generator, StationVehicle, Exciter, Station } from '@/lib/types';
import { updateEquipment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
import { Checkbox } from "@/components/ui/checkbox";

// Form uses ipAddress as comma-separated string internally; greaseNeeded as boolean
type EditEquipmentFormValues = Omit<Equipment, 'ipAddress'> & {
    ipAddress: string;
    // Transmitter
    tpo?: number;
    erp?: number;
    paModuleType?: string;
    powerSupplyType?: string;
    filamentType?: string;
    fuseType?: string;
    fuseStock?: number;
    filterCount?: number;
    lastFilterChangeDate?: string;
    // Exciter
    exciterOutput?: number;
    // ACUnit / Transmitter shared
    airFilterSize?: string;
    blowerBeltType?: string;
    beltCount?: number;
    // UPS
    batteryModel?: string;
    batteryCount?: number;
    // Generator
    fuelLevelPercent?: number;
    greaseType?: string;
    greaseNeeded?: boolean;
    // StationVehicle
    vin?: string;
    licensePlate?: string;
    useType?: string;
    // SparePart
    servicesModel?: string;
    compatibleEquipment?: string;
};

interface EditEquipmentModalProps {
    equipment: AnyEquipment;
    allSites: Site[];
    allStations: Station[];
    onClose: () => void;
    onSave: () => void;
}

const Field: React.FC<{label: string, children: React.ReactNode}> = ({ label, children }) => (
    <div>
        <Label>{label}</Label>
        <div className="mt-1">{children}</div>
    </div>
);

const CORPORATE_SITE_ID = 'corporate';

export const EditEquipmentModal: React.FC<EditEquipmentModalProps> = ({ equipment, allSites, allStations, onClose, onSave }) => {
    const { toast } = useToast();
    const [isWebUi, setIsWebUi] = useState(!!equipment.url);

    const form = useForm<EditEquipmentFormValues>({
        defaultValues: {
            ...(equipment as unknown as EditEquipmentFormValues),
            siteId: equipment.siteId || CORPORATE_SITE_ID,
            installDate: equipment.installDate ? new Date(equipment.installDate).toISOString().split('T')[0] : '',
            ipAddress: Array.isArray(equipment.ipAddress) ? equipment.ipAddress.join(', ') : '',
            greaseNeeded: typeof (equipment as Generator).greaseNeeded === 'string'
                ? (equipment as Generator).greaseNeeded === 'true'
                : !!(equipment as Generator).greaseNeeded,
        },
    });

    const { register, handleSubmit, formState: { isSubmitting }, watch, setValue } = form;

    const ipAddressValue = watch('ipAddress');

    useEffect(() => {
        if (isWebUi && ipAddressValue) {
            const firstIp = ipAddressValue.split(',')[0].trim();
            if (firstIp) {
                const url = firstIp.includes(':') ? `http://${firstIp}` : `http://${firstIp}:80`;
                setValue('url', url);
            }
        } else if (!isWebUi) {
            setValue('url', '');
        }
    }, [isWebUi, ipAddressValue, setValue]);


    const onSubmit = async (data: EditEquipmentFormValues) => {
        const { id, ...updateData } = data;
        
        const finalData: Partial<AnyEquipment> = {
            ...(updateData as unknown as Partial<AnyEquipment>),
            siteId: updateData.siteId === CORPORATE_SITE_ID ? undefined : updateData.siteId,
            ipAddress: typeof updateData.ipAddress === 'string' ? updateData.ipAddress.split(',').map((ip: string) => ip.trim()) : [],
        };

        if(finalData.siteId === undefined) {
            delete finalData.locationInSite;
        } else {
            delete finalData.storageLocation;
        }

        const result = await updateEquipment(id, finalData);
        if (result.success) {
            toast({ title: "Success", description: "Equipment updated." });
            onSave();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const renderCategorySpecificFields = () => {
        const category = watch('category');
        switch (category) {
            case EquipmentCategory.TRANSMITTER:
                return <>
                    <Field label="TPO"><Input {...register('tpo')} /></Field>
                    <Field label="ERP"><Input {...register('erp')} /></Field>
                    <Field label="PA Module Type"><Input {...register('paModuleType')} /></Field>
                    <Field label="Power Supply Type"><Input {...register('powerSupplyType')} /></Field>
                    <Field label="Filament Type"><Input {...register('filamentType')} /></Field>
                    <Field label="Fuse Type"><Input {...register('fuseType')} /></Field>
                    <Field label="Fuse Stock"><Input type="number" {...register('fuseStock', { valueAsNumber: true })} /></Field>
                    <Field label="Air Filter Size"><Input {...register('airFilterSize')} /></Field>
                    <Field label="Filter Count"><Input type="number" {...register('filterCount', { valueAsNumber: true })} /></Field>
                </>;
             case EquipmentCategory.EXCITER:
                return <Field label="Exciter Output"><Input {...register('exciterOutput')} /></Field>;
            case EquipmentCategory.STATION_VEHICLE:
                return <>
                    <Field label="VIN"><Input {...register('vin')} /></Field>
                    <Field label="License Plate"><Input {...register('licensePlate')} /></Field>
                    <Field label="Use Type"><Input {...register('useType')} /></Field>
                </>;
            case EquipmentCategory.AC_UNIT:
                return <>
                    <Field label="Air Filter Size"><Input {...register('airFilterSize')} /></Field>
                    <Field label="Filter Count"><Input type="number" {...register('filterCount', { valueAsNumber: true })} /></Field>
                    <Field label="Blower Belt Type"><Input {...register('blowerBeltType')} /></Field>
                    <Field label="Belt Count"><Input type="number" {...register('beltCount', { valueAsNumber: true })} /></Field>
                </>;
            case EquipmentCategory.UPS:
                return <>
                    <Field label="Battery Model"><Input {...register('batteryModel')} /></Field>
                    <Field label="Battery Count"><Input type="number" {...register('batteryCount', { valueAsNumber: true })} /></Field>
                </>;
            case EquipmentCategory.GENERATOR:
                return <>
                    <Field label="Fuel Level (%)"><Input type="number" {...register('fuelLevelPercent', { valueAsNumber: true })} /></Field>
                    <Field label="Blower Belt Type"><Input {...register('blowerBeltType')} /></Field>
                    <Field label="Grease Type"><Input {...register('greaseType')} /></Field>
                    <div className="flex items-center gap-2 pt-6">
                        <Checkbox id="greaseNeeded" checked={!!watch('greaseNeeded')} onCheckedChange={(checked) => setValue('greaseNeeded', !!checked)} />
                        <Label htmlFor="greaseNeeded">Grease Needed</Label>
                    </div>
                </>;
            default: return null;
        }
    }
    
    const availableStations = watch('siteId') ? allStations.filter(s => s.siteId === watch('siteId')) : [];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit Equipment</DialogTitle>
                    <DialogDescription className="truncate" title={equipment.name}>{equipment.name}</DialogDescription>
                </DialogHeader>
                <form id="edit-equipment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="text-md font-semibold text-foreground mb-2">Location</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <Field label="Site">
                               <Select value={watch('siteId')} onValueChange={(value) => setValue('siteId', value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={CORPORATE_SITE_ID}>Corporate (No Site)</SelectItem>
                                        {allSites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                           </Field>
                           {watch('siteId') !== CORPORATE_SITE_ID ?
                               <Field label="Location in Site"><Input {...register('locationInSite')} /></Field>
                                : <Field label="Storage Location"><Input {...register('storageLocation')} /></Field>
                           }
                        </div>
                    </div>

                    <h4 className="text-md font-semibold text-foreground">General Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Description"><Input {...register('description')} /></Field>
                        <Field label="Category">
                             <Select value={watch('category')} onValueChange={(value) => setValue('category', value as EquipmentCategory)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.values(EquipmentCategory).filter(c => c !== EquipmentCategory.SPARE_PARTS).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label="Make"><Input {...register('make')} /></Field>
                        <Field label="Model Number"><Input {...register('modelNumber')} /></Field>
                        <Field label="Serial Number"><Input {...register('serialNumber')} /></Field>
                        <Field label="Controller ID"><Input {...register('controllerId')} /></Field>
                        {watch('siteId') !== CORPORATE_SITE_ID && (
                            <>
                                <Field label="IP Address (comma-separated)"><Input {...register('ipAddress')} /></Field>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="is-web-ui-edit" checked={isWebUi} onCheckedChange={(checked) => setIsWebUi(!!checked)} />
                                        <Label htmlFor="is-web-ui-edit" className="font-normal">Has Web Interface</Label>
                                    </div>
                                    <Input {...register('url')} disabled={!isWebUi} placeholder="URL will auto-populate" />
                                </div>
                                <Field label="Username"><Input {...register('username')} /></Field>
                            </>
                        )}
                        <Field label="Install Date"><Input type="date" {...register('installDate')} /></Field>
                    </div>

                    {availableStations.length > 0 && (
                        <div className="space-y-2 pt-4 border-t">
                            <Label>Associated Stations</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {availableStations.map(station => (
                                    <div key={station.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`station-${station.id}`}
                                            checked={watch('stationIds')?.includes(station.id)}
                                            onCheckedChange={(checked) => {
                                                const currentIds = watch('stationIds') || [];
                                                if (checked) {
                                                    setValue('stationIds', [...currentIds, station.id]);
                                                } else {
                                                    setValue('stationIds', currentIds.filter((id: string) => id !== station.id));
                                                }
                                            }}
                                        />
                                        <Label htmlFor={`station-${station.id}`} className="font-normal">{station.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <h4 className="text-md font-semibold text-foreground pt-4 border-t">Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderCategorySpecificFields()}
                    </div>
                    
                    <div className="pt-4 border-t">
                        <Field label="Notes"><Textarea {...register('notes')} /></Field>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="edit-equipment-form" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
