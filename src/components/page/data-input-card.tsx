
'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UploadCloud, Wand2, RotateCcw, LinkIcon, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { summarizeDocument, SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { summarizeWebsite, SummarizeWebsiteOutput } from '@/ai/flows/summarize-website-flow';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


interface DataInputCardProps {
  isSummarizing: boolean;
  setIsSummarizing: (isSummarizing: boolean) => void;
  isGenerating: boolean;
  onClearForm: () => void;
  onSummarizationComplete: (data: SummarizeDocumentOutput | SummarizeWebsiteOutput) => void;
}

const DataInputCard: React.FC<DataInputCardProps> = ({
  isSummarizing,
  setIsSummarizing,
  isGenerating,
  onClearForm,
  onSummarizationComplete,
}) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setWebsiteUrl("");
    } else {
      setFile(null);
      setFileName("");
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setWebsiteUrl(url);
    if (url) {
      setFile(null);
      setFileName("");
      const fileInput = document.getElementById('document-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    }
  };

  const handleSummarize = async () => {
    if (!file && !websiteUrl.trim()) {
      toast({ title: "No Input", description: "Please upload a document or enter a website URL.", variant: "destructive" });
      return;
    }
    if (file && websiteUrl.trim()) {
        toast({ title: "Multiple Inputs", description: "Please provide either a file OR a URL, not both.", variant: "destructive" });
        return;
    }

    setIsSummarizing(true);
    // onSummarizationStart();

    try {
      let summaryOutput: SummarizeDocumentOutput | SummarizeWebsiteOutput;

      if (file) {
        const dataUri = await fileToDataUri(file);
        summaryOutput = await summarizeDocument({ documentDataUri: dataUri });
      } else {
        summaryOutput = await summarizeWebsite({ websiteUrl: websiteUrl.trim() });
      }
      
      onSummarizationComplete(summaryOutput);
      
      toast({ title: "Input Summarized", description: "Form fields have been populated with extracted information." });
    } catch (error: any) {
      console.error("Error summarizing input:", error);
      let errorMessage = "Could not summarize the input. Please try again.";
      if (error.message && error.message.toLowerCase().includes("invalid url")) {
          errorMessage = "Invalid URL format. Please ensure it starts with http:// or https:// and is a valid URL.";
      } else if (error.message) {
          errorMessage = error.message;
      }
      toast({ title: "Summarization Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileName("");
    setWebsiteUrl("");
    const fileInput = document.getElementById('document-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    onClearForm();
  }

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
        <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
          <RotateCcw className="mr-2 h-4 w-4" />
          Clear Form & Inputs
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DataInputCard;
