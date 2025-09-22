'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SampleSnapshotPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [snapshotPath, setSnapshotPath] = useState<string | null>(null);
    const [outputName, setOutputName] = useState('snapshot');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleCreateSnapshot = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) {
            toast({
                variant: 'destructive',
                title: 'No Folder Selected',
                description: 'Please select a folder to process.',
            });
            return;
        }
        
        setIsLoading(true);
        setSnapshotPath(null);

        try {
            const fileContents: Record<string, string> = {};
            const filePaths: string[] = [];

            const filePromises = Array.from(files).map(file => {
                return new Promise<void>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const content = e.target?.result as string;
                        const relativePath = (file as any).webkitRelativePath;
                        if (relativePath) {
                            filePaths.push(relativePath);
                            fileContents[relativePath] = content;
                        }
                        resolve();
                    };
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });
            });

            await Promise.all(filePromises);

            if (filePaths.length === 0) {
                throw new Error("Could not read files from the selected folder. Your browser might not support folder uploads correctly.");
            }

            const snapshotJson = { files: fileContents };

            const response = await fetch('/api/sample-snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outputName: outputName,
                    snapshotData: snapshotJson
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to create snapshot on the server.');
            }
            
            setSnapshotPath(result.snapshotPath);
            toast({
                title: 'Snapshot Created',
                description: `Sample state saved to: ${result.snapshotPath}`,
            });

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Reset file input
            }
        }
    };

    return (
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
            <Card className="shadow-lg rounded-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center">
                        <Terminal className="w-6 h-6 mr-3 text-primary" /> Dev Tool: Sample Snapshot
                    </CardTitle>
                    <CardDescription>Upload a folder from your local machine to create a structured JSON snapshot of its contents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateSnapshot} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="outputName">Snapshot File Name</Label>
                            <Input 
                                id="outputName"
                                value={outputName}
                                onChange={(e) => setOutputName(e.target.value)}
                                placeholder="e.g., new-feature-snapshot"
                                required
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                               This will be the base name for the generated JSON file. A timestamp will be added automatically.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="folder-upload">Folder to Upload</Label>
                            <Input 
                                id="folder-upload"
                                type="file"
                                // @ts-ignore - webkitdirectory is non-standard but required for folder uploads
                                webkitdirectory=""
                                ref={fileInputRef}
                                disabled={isLoading}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            />
                            <p className="text-sm text-muted-foreground">
                                Select a folder from your computer to generate a snapshot.
                            </p>
                        </div>
                    
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Snapshot...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Folder & Create Snapshot
                                </>
                            )}
                        </Button>

                        {snapshotPath && (
                            <Alert>
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>Snapshot Complete!</AlertTitle>
                                <AlertDescription>
                                    The sample snapshot has been successfully created at:
                                    <pre className="mt-2 text-sm rounded bg-muted p-2"><code>{snapshotPath}</code></pre>
                                </AlertDescription>
                            </Alert>
                        )}
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}