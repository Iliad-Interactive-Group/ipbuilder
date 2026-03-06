
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { addSecret } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';


interface AddSecretModalProps {
    onClose: () => void;
}

const baseSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  description: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

const websitePasswordSchema = baseSchema.extend({
  url: z.string().url().optional().or(z.literal('')),
  username: z.string().optional(),
  password: z.string().optional(),
});

const gateCodeSchema = baseSchema.extend({
  location: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  unlockInstructions: z.string().optional(),
});

const secureNoteSchema = baseSchema.extend({
  content: z.string().min(1, "Content is required."),
});

const multiLoginSchema = baseSchema.extend({
    url: z.string().url().optional().or(z.literal('')),
    accounts: z.array(z.object({
        label: z.string().min(1, "Label is required"),
        username: z.string().optional(),
        password: z.string().optional(),
        notes: z.string().optional()
    })).min(1, "At least one account is required.")
});

const customFieldsSchema = baseSchema.extend({
    fields: z.array(z.object({
        name: z.string().min(1, "Field name is required"),
        value: z.string().min(1, "Field value is required"),
        isSecret: z.boolean().default(false),
    })).min(1, "At least one field is required.")
});


export const AddSecretModal: React.FC<AddSecretModalProps> = ({ onClose }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('websitePassword');

    const formWebsite = useForm({ resolver: zodResolver(websitePasswordSchema), defaultValues: { name: '', description: '', tags: '', url: '', username: '', password: '', notes: '' }});
    const formGateCode = useForm({ resolver: zodResolver(gateCodeSchema), defaultValues: { name: '', description: '', tags: '', location: '', code: '', unlockInstructions: '', notes: '' } });
    const formSecureNote = useForm({ resolver: zodResolver(secureNoteSchema), defaultValues: { name: '', description: '', tags: '', content: '', notes: '' } });
    const formMultiLogin = useForm({ resolver: zodResolver(multiLoginSchema), defaultValues: { name: '', url: '', tags: '', notes: '', description: '', accounts: [{label: '', username: '', password: '', notes: ''}] } });
    const formCustomFields = useForm({ resolver: zodResolver(customFieldsSchema), defaultValues: { name: '', tags: '', notes: '', description: '', fields: [{name: '', value: '', isSecret: false }] } });
    
    const { fields: multiLoginFields, append: appendMultiLogin, remove: removeMultiLogin } = useFieldArray({ control: formMultiLogin.control, name: "accounts" });
    const { fields: customFields, append: appendCustomField, remove: removeCustomField } = useFieldArray({ control: formCustomFields.control, name: "fields" });


    const handleSubmit = async () => {
        let values, type;
        switch (activeTab) {
            case 'websitePassword':
                await formWebsite.trigger();
                if(!formWebsite.formState.isValid) { toast({variant: 'destructive', title: 'Invalid input'}); return };
                values = formWebsite.getValues();
                type = 'websitePassword';
                break;
            case 'gateCode':
                 await formGateCode.trigger();
                if(!formGateCode.formState.isValid) { toast({variant: 'destructive', title: 'Invalid input'}); return };
                values = formGateCode.getValues();
                type = 'gateCode';
                break;
            case 'secureNote':
                 await formSecureNote.trigger();
                if(!formSecureNote.formState.isValid) { toast({variant: 'destructive', title: 'Invalid input'}); return };
                values = formSecureNote.getValues();
                type = 'secureNote';
                break;
            case 'multiLogin':
                await formMultiLogin.trigger();
                if(!formMultiLogin.formState.isValid) { toast({variant: 'destructive', title: 'Invalid input'}); return };
                values = formMultiLogin.getValues();
                type = 'multiLogin';
                break;
            case 'customFields':
                await formCustomFields.trigger();
                if(!formCustomFields.formState.isValid) { toast({variant: 'destructive', title: 'Invalid input'}); return };
                values = formCustomFields.getValues();
                type = 'customFields';
                break;
            default:
                return;
        }

        const commonData = {
            ...values,
            type,
            tags: 'tags' in values && values.tags ? (values.tags as string).split(',').map((t: string) => t.trim()) : [],
            createdBy: user?.uid,
            updatedBy: user?.uid,
            organizationId: 'org_alpha', // Placeholder
        };

        const result = await addSecret(commonData as any);
        if (result.success) {
            toast({ title: "Success", description: "Secret added successfully." });
            onClose();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Add New Secret</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="websitePassword">Password</TabsTrigger>
                        <TabsTrigger value="gateCode">Gate Code</TabsTrigger>
                        <TabsTrigger value="secureNote">Secure Note</TabsTrigger>
                        <TabsTrigger value="multiLogin">Multi-Login</TabsTrigger>
                        <TabsTrigger value="customFields">Custom</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="h-[60vh] p-1">
                    <TabsContent value="websitePassword">
                        <div className="space-y-4 p-2">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Name</Label><Input {...formWebsite.register('name')} /></div>
                                <div><Label>URL</Label><Input {...formWebsite.register('url')} /></div>
                                <div><Label>Username</Label><Input {...formWebsite.register('username')} /></div>
                                <div><Label>Password</Label><Input type="password" {...formWebsite.register('password')} /></div>
                            </div>
                            <div><Label>Description</Label><Input {...formWebsite.register('description')} /></div>
                            <div><Label>Tags (comma-separated)</Label><Input {...formWebsite.register('tags')} /></div>
                            <div><Label>Notes</Label><Textarea {...formWebsite.register('notes')} /></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="gateCode">
                        <div className="space-y-4 p-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Name</Label><Input {...formGateCode.register('name')} /></div>
                                <div><Label>Code</Label><Input {...formGateCode.register('code')} /></div>
                            </div>
                            <div><Label>Location</Label><Input {...formGateCode.register('location')} /></div>
                             <div><Label>Description</Label><Input {...formGateCode.register('description')} /></div>
                            <div><Label>Tags (comma-separated)</Label><Input {...formGateCode.register('tags')} /></div>
                             <div><Label>Unlock Instructions</Label><Textarea {...formGateCode.register('unlockInstructions')} /></div>
                            <div><Label>Notes</Label><Textarea {...formGateCode.register('notes')} /></div>
                        </div>
                    </TabsContent>
                    <TabsContent value="secureNote">
                         <div className="space-y-4 p-2">
                            <div><Label>Name</Label><Input {...formSecureNote.register('name')} /></div>
                            <div><Label>Content</Label><Textarea {...formSecureNote.register('content')} rows={10} /></div>
                            <div><Label>Description</Label><Input {...formSecureNote.register('description')} /></div>
                            <div><Label>Tags (comma-separated)</Label><Input {...formSecureNote.register('tags')} /></div>
                            <div><Label>Notes</Label><Textarea {...formSecureNote.register('notes')} /></div>
                        </div>
                    </TabsContent>
                     <TabsContent value="multiLogin">
                        <div className="space-y-4 p-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Name</Label><Input {...formMultiLogin.register('name')} /></div>
                                <div><Label>URL</Label><Input {...formMultiLogin.register('url')} /></div>
                            </div>
                             {multiLoginFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                    <h4 className="font-semibold">Account #{index + 1}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>Label</Label><Input {...formMultiLogin.register(`accounts.${index}.label` as const)} /></div>
                                        <div><Label>Username</Label><Input {...formMultiLogin.register(`accounts.${index}.username` as const)} /></div>
                                    </div>
                                    <div><Label>Password</Label><Input type="password" {...formMultiLogin.register(`accounts.${index}.password` as const)} /></div>
                                    <div><Label>Notes</Label><Textarea {...formMultiLogin.register(`accounts.${index}.notes` as const)} /></div>
                                    <Button type="button" variant="destructive_ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeMultiLogin(index)}><Trash2/></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendMultiLogin({ label: '', username: '', password: '', notes: '' })}>Add Account</Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="customFields">
                         <div className="space-y-4 p-2">
                            <div><Label>Name</Label><Input {...formCustomFields.register('name')} /></div>
                            {customFields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                                    <h4 className="font-semibold">Field #{index + 1}</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>Field Name</Label><Input {...formCustomFields.register(`fields.${index}.name` as const)} /></div>
                                        <div><Label>Field Value</Label><Input {...formCustomFields.register(`fields.${index}.value` as const)} /></div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox id={`isSecret-${index}`} {...formCustomFields.register(`fields.${index}.isSecret` as const)} />
                                        <Label htmlFor={`isSecret-${index}`}>This field is secret</Label>
                                    </div>
                                    <Button type="button" variant="destructive_ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeCustomField(index)}><Trash2/></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={() => appendCustomField({ name: '', value: '', isSecret: false })}>Add Custom Field</Button>
                        </div>
                    </TabsContent>
                    </ScrollArea>
                </Tabs>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="button" onClick={handleSubmit}>
                        Add Secret
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
