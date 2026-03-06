
'use client';

import React from 'react';
import { Asset } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RawDataViewProps {
  assets: Asset[];
}

export const RawDataView: React.FC<RawDataViewProps> = ({ assets }) => {
  if (!assets || assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Raw Data Viewer</CardTitle>
          <CardDescription>
            A flat view of all &quot;Active&quot; documents in the Firestore &apos;assets&apos; collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>No active assets found in the database.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Data Viewer</CardTitle>
        <CardDescription>
          A flat view of all {assets.length} &quot;Active&quot; documents in the Firestore &apos;assets&apos; collection.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[75vh]">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className="w-[250px]">ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Full JSON</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell className="font-mono text-xs">{asset.id}</TableCell>
                  <TableCell>
                    <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                        {asset.type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>
                    <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-xs text-muted-foreground">
                      {JSON.stringify(asset, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
