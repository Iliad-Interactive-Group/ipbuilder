
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { batchArchiveSecrets } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { X, Loader2, Trash2 } from 'lucide-react';
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

interface SecretsBatchEditToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
}

export const SecretsBatchEditToolbar: React.FC<SecretsBatchEditToolbarProps> = ({
  selectedIds,
  onClearSelection,
}) => {
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = React.useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    const result = await batchArchiveSecrets(selectedIds);
    if(result.success) {
      toast({ title: 'Success', description: `${selectedIds.length} secret(s) have been archived.` });
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
    <div className="flex items-center justify-between p-4 bg-muted/70 rounded-lg border flex-wrap gap-4 -mt-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm font-semibold">
          {selectedIds.length} item(s) selected
        </div>
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
                This will archive {selectedIds.length} secret(s). This action can be reversed if a TTL policy is not set.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleArchive}>Yes, archive</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Button variant="ghost" size="icon" onClick={onClearSelection} title="Clear selection" disabled={isArchiving}>
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
