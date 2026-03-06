
'use client';

import React from 'react';
import { addStation } from '@/lib/actions';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { useToast } from '@/hooks/use-toast';
import { Site, Station } from '@/lib/types';
import { useForm, Controller } from "react-hook-form";
import { useSites } from '@/lib/hooks';

interface AddStationModalProps {
    allSites: Site[];
    onClose: () => void;
}

export const AddStationModal: React.FC<AddStationModalProps> = ({ allSites, onClose }) => {
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { isSubmitting, errors } } = useForm();
    
    const onSubmit = async (data: any) => {
        const newStation: Omit<Station, 'id' | 'status' | 'marketId' | 'companyId'> = {
            name: data.name,
            callSign: data.callSign,
            siteId: data.siteId,
            type: 'STATION',
        };
        const result = await addStation(newStation, allSites);

        if(result.success) {
            toast({ title: "Success", description: "Station added successfully." });
            onClose();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Station</DialogTitle>
                </DialogHeader>
                <form id="add-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Station Name</Label>
                        <Input id="name" {...register("name", { required: "Station name is required" })} />
                        {errors.name && <p className="text-destructive text-sm mt-1">{(errors.name as any).message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="callSign">Call Sign</Label>
                        <Input id="callSign" {...register("callSign", { required: "Call sign is required" })} />
                        {errors.callSign && <p className="text-destructive text-sm mt-1">{(errors.callSign as any).message}</p>}
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="siteId">Site</Label>
                         <Controller
                            name="siteId"
                            control={control}
                            rules={{ required: "Site is required" }}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <SelectTrigger><SelectValue placeholder="Select a site..." /></SelectTrigger>
                                    <SelectContent>
                                        {allSites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                         />
                         {errors.siteId && <p className="text-destructive text-sm mt-1">{(errors.siteId as any).message}</p>}
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="add-form" disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : 'Add Station'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
