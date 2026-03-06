
import React from 'react';
import { useForm } from 'react-hook-form';
import { Site, MaintenanceTemplate, MaintenanceTask } from '@/lib/types';
import { addSiteMaintenanceLog } from '@/lib/actions';
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SiteChecklistModalProps {
    template: MaintenanceTemplate;
    site: Site;
    onClose: () => void;
}

export const SiteChecklistModal: React.FC<SiteChecklistModalProps> = ({ template, site, onClose }) => {
    const { toast } = useToast();
    const { register, handleSubmit, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data: any) => {
        const { technician, ...checklistData } = data;
        if (!technician.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Technician name is required.' });
            return;
        }

        const processedData: Record<string, string | number | boolean> = {};
        for (const key in checklistData) {
            const task = template.tasks.find(t => t.db_field_name === key);
            const value = checklistData[key];

            if (task && task.input_type === 'numeric' && typeof value === 'string' && value.length > 0) {
                processedData[key] = parseFloat(value);
            } else {
                processedData[key] = value;
            }
        }
        
        const logData = {
            templateName: template.template_name,
            date: new Date().toISOString(),
            technician: technician,
            data: processedData,
        };

        const result = await addSiteMaintenanceLog(site.id, logData);

        if (result.success) {
            toast({ title: 'Success', description: 'Checklist saved.' });
            onClose();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    };
    
    const renderTaskInput = (task: MaintenanceTask) => {
        if (!task.db_field_name || !task.input_type) return null;
        const fieldName = task.db_field_name;

        switch (task.input_type) {
            case 'numeric':
                return <Input type="number" {...register(fieldName)} />;
            case 'boolean':
                return <Checkbox {...register(fieldName)} />;
            case 'text':
                return <Textarea {...register(fieldName)} />;
            default: return null;
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{template.template_name}</DialogTitle>
                    <DialogDescription>For site: {site.name}</DialogDescription>
                </DialogHeader>
                 <form id="checklist-form" onSubmit={handleSubmit(onSubmit)}>
                    <ScrollArea className="max-h-[60vh] p-1 pr-4">
                        <div className="space-y-6">
                            {template.tasks.map((task, index) => {
                                if (task.task_group) {
                                    return <h4 key={index} className="text-lg font-semibold text-primary pt-4 border-t">{task.task_group}</h4>;
                                }
                                if (task.task_description && task.input_type === 'header') {
                                     return <p key={index} className="text-md font-bold text-foreground bg-muted/50 p-2 rounded-md">{task.task_description}</p>
                                }
                                if (task.task_description) {
                                    return (
                                        <div key={index} className="grid grid-cols-2 gap-4 items-center py-2">
                                            <Label htmlFor={task.db_field_name} className="font-medium">
                                                {task.task_description}
                                            </Label>
                                            <div className="flex items-center gap-2">
                                                {renderTaskInput(task)}
                                                {task.units && <span className="text-sm text-muted-foreground">{task.units}</span>}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })}
                             <div className="pt-4 border-t">
                                <Label htmlFor="technician" className="text-lg font-medium">Technician Name *</Label>
                                <Input {...register('technician')} required className="mt-2" placeholder="Enter your name" />
                            </div>
                        </div>
                    </ScrollArea>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="checklist-form" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Checklist'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
