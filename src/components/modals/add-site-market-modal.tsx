
import React from 'react';
import { addSite, addMarket } from '@/lib/actions';
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
import { Market, Site } from '@/lib/types';
import { useForm, Controller } from "react-hook-form";

export type AddModalMode = 'market' | 'site';

interface AddSiteMarketModalProps {
    mode: AddModalMode;
    marketId?: string;
    existingMarkets: Market[];
    onClose: () => void;
}

export const AddSiteMarketModal: React.FC<AddSiteMarketModalProps> = ({ mode, marketId, existingMarkets, onClose }) => {
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { isSubmitting, errors } } = useForm();
    
    const companyId = existingMarkets.length > 0 ? existingMarkets[0].companyId : "comp-img";

    const onSubmit = async (data: any) => {
        let result;
        if (mode === 'market') {
            const newMarket: Omit<Market, 'id' | 'status'> = {
                name: data.marketName,
                type: 'MARKET',
                companyId: companyId,
            };
            result = await addMarket(newMarket);
        } else {
            const selectedMarket = existingMarkets.find(m => m.id === data.marketId);
            const newSite: Omit<Site, 'id' | 'status'> = {
                name: data.name,
                shortName: data.shortName,
                location: data.location,
                marketId: data.marketId,
                companyId: selectedMarket?.companyId || companyId,
                type: 'SITE',
                networks: [],
                maintenanceHistory: []
            };
            result = await addSite(newSite);
        }

        if(result.success) {
            toast({ title: "Success", description: `${mode === 'market' ? 'Market' : 'Site'} added successfully.` });
            onClose();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const modalTitle = mode === 'market' ? "Add New Market" : "Add New Site";

    const renderMarketForm = () => (
        <form id="add-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="marketName">New Market Name</Label>
                <Input id="marketName" {...register("marketName", { required: "Market name is required" })} />
                 {errors.marketName && <p className="text-destructive text-sm mt-1">{(errors.marketName as any).message}</p>}
            </div>
        </form>
    );

    const renderSiteForm = () => (
        <form id="add-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Site Name</Label>
                <Input id="name" {...register("name", { required: "Site name is required" })} />
                 {errors.name && <p className="text-destructive text-sm mt-1">{(errors.name as any).message}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="shortName">Site Short Name (3-4 letters)</Label>
                <Input id="shortName" {...register("shortName", { required: "Short name is required" })} />
                 {errors.shortName && <p className="text-destructive text-sm mt-1">{(errors.shortName as any).message}</p>}
            </div>
            <div className="grid gap-2">
                <Label htmlFor="location">Site Location (Address)</Label>
                <Input id="location" {...register("location")} />
            </div>
            <div className="grid gap-2">
                 <Label htmlFor="marketId">Market</Label>
                 <Controller
                    name="marketId"
                    control={control}
                    defaultValue={marketId || ''}
                    rules={{ required: "Market is required" }}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select a market..." /></SelectTrigger>
                            <SelectContent>
                                {existingMarkets.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                 />
                 {errors.marketId && <p className="text-destructive text-sm mt-1">{(errors.marketId as any).message}</p>}
            </div>
        </form>
    );

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{modalTitle}</DialogTitle>
                </DialogHeader>
                {mode === 'market' ? renderMarketForm() : renderSiteForm()}
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="add-form" disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : (mode === 'market' ? 'Add Market' : 'Add Site')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
