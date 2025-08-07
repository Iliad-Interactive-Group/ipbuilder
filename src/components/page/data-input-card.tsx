
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, Wand2, RotateCcw, LinkIcon, Loader2 } from 'lucide-react';

interface DataInputCardProps {
  file: File | null;
  fileName: string;
  websiteUrl: string;
  isSummarizing: boolean;
  isGenerating: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSummarize: () => void;
  handleClearForm: () => void;
}

const DataInputCard: React.FC<DataInputCardProps> = ({
  file,
  fileName,
  websiteUrl,
  isSummarizing,
  isGenerating,
  handleFileChange,
  handleUrlChange,
  handleSummarize,
  handleClearForm,
}) => {
  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center">
          <UploadCloud className="w-6 h-6 mr-3 text-primary" /> Data Input
        </CardTitle>
        <CardDescription>Upload a document (PDF/Word) OR enter a website URL to auto-fill the form below.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="document-upload" className="font-medium">Upload Document</Label>
          <Input
            id="document-upload"
            type="file"
            onChange={handleFileChange}
            className="mt-1"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf"
            disabled={isSummarizing || !!websiteUrl.trim()}
          />
          {fileName && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="website-url" className="font-medium">Enter Website URL</Label>
          <div className="flex items-center space-x-2 mt-1">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              id="website-url"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={handleUrlChange}
              className="flex-grow"
              disabled={isSummarizing || !!file}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        <Button onClick={handleSummarize} disabled={(!file && !websiteUrl.trim()) || isSummarizing || isGenerating} className="w-full sm:w-auto">
          {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Summarize & Autofill
        </Button>
        <Button variant="outline" onClick={handleClearForm} className="w-full sm:w-auto">
          <RotateCcw className="mr-2 h-4 w-4" />
          Clear Form & Inputs
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataInputCard;
