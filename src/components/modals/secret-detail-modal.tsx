
import React from 'react';
import { AnySecret, WebsitePassword, GateCode, SecureNote, MultiLogin, CustomFieldsSecret } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { archiveSecret } from '@/lib/actions';
import {
    Pencil, KeyRound, Copy, Globe, StickyNote, Lock, Info, Building, BookUser, FileJson, Hash, Trash2
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


interface SecretDetailModalProps {
  secret: AnySecret;
  onClose: () => void;
  onEdit: () => void;
}

const DetailRow: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; isSecret?: boolean }> = ({ label, value, children, isSecret = false }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        if(typeof value === 'string' || typeof value === 'number') {
            navigator.clipboard.writeText(String(value));
            toast({ title: 'Copied to clipboard' });
        }
    }
  
    return (
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm text-foreground sm:mt-0 sm:col-span-2">
          {children ? children :
            (value ? 
            <div className="flex items-center gap-2">
                <span className={isSecret ? 'blur-sm hover:blur-none transition-all' : ''}>{value}</span>
                {isSecret && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>}
            </div> : <span className="text-muted-foreground/70">N/A</span>)
          }
        </dd>
      </div>
    );
};

export const SecretDetailModal: React.FC<SecretDetailModalProps> = ({ secret, onClose, onEdit }) => {
  const { toast } = useToast();

  const handleArchive = async () => {
    const result = await archiveSecret(secret.id);
    if (result.success) {
        toast({ title: 'Archived', description: `${secret.name} has been archived.`});
        onClose();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const renderSecretDetails = () => {
    switch (secret.type) {
        case 'websitePassword':
            const wp = secret as WebsitePassword;
            return (
                <>
                    <DetailRow label="URL" value={wp.url} />
                    <DetailRow label="Username" value={wp.username} />
                    <DetailRow label="Password" value={wp.password} isSecret />
                </>
            );
        case 'gateCode':
            const gc = secret as GateCode;
            return (
                <>
                    <DetailRow label="Location" value={gc.location} />
                    <DetailRow label="Code" value={gc.code} isSecret />
                    <DetailRow label="Unlock Instructions" value={gc.unlockInstructions} />
                </>
            );
        case 'secureNote':
            const sn = secret as SecureNote;
            return <DetailRow label="Content" value={sn.content} />;
        case 'multiLogin':
            const ml = secret as MultiLogin;
            return (
                <>
                    <DetailRow label="URL" value={ml.url} />
                    {ml.accounts.map((acc, i) => (
                        <div key={i} className="my-4 p-3 border rounded-lg">
                            <h4 className="font-semibold text-primary">{acc.label}</h4>
                            <DetailRow label="Username" value={acc.username} />
                            <DetailRow label="Password" value={acc.password} isSecret />
                            {acc.notes && <DetailRow label="Notes" value={acc.notes} />}
                        </div>
                    ))}
                </>
            )
        case 'customFields':
            const cf = secret as CustomFieldsSecret;
            return (
                 <>
                    {cf.fields.map((field, i) => (
                        <DetailRow key={i} label={field.name} value={field.value} isSecret={field.isSecret} />
                    ))}
                </>
            )
        default: return null;
    }
  };

  const getIcon = () => {
    switch(secret.type) {
        case 'websitePassword': return <Globe />;
        case 'gateCode': return <Hash/>;
        case 'secureNote': return <StickyNote />;
        case 'multiLogin': return <BookUser />;
        case 'customFields': return <FileJson />;
        default: return <Lock />;
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
    <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-3">
                {getIcon()}
                {secret.name}
              </DialogTitle>
              <DialogDescription>{secret.description}</DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onEdit} size="icon" variant="ghost"><Pencil className="h-5 w-5"/></Button>
               <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="destructive_ghost"><Trash2 className="h-5 w-5"/></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive the item '{secret.name}'. It can be restored later if needed.
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
                <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-foreground mb-2">Details</h4>
                    <dl>
                        {renderSecretDetails()}
                    </dl>
                </div>

                {secret.notes && (
                     <div className="bg-muted/30 p-4 rounded-lg">
                        <h4 className="text-md font-semibold text-foreground mb-2">Notes</h4>
                        <p className="text-sm whitespace-pre-wrap">{secret.notes}</p>
                    </div>
                )}
                
                 <div className="bg-muted/30 p-4 rounded-lg text-xs text-muted-foreground">
                    <h4 className="text-sm font-semibold mb-2">Metadata</h4>
                    <p>Last updated by {secret.updatedBy} on {new Date(secret.updatedAt).toLocaleString()}</p>
                    <p>Created by {secret.createdBy} on {new Date(secret.createdAt).toLocaleString()}</p>
                 </div>
            </div>
        </ScrollArea>
    </DialogContent>
    </Dialog>
  );
};
