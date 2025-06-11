"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";

import { UploadCloud, FileText, Wand2, Download, Loader2, Monitor, Users, Mic, Tv, Podcast, Presentation, AlertTriangle } from 'lucide-react';

import { summarizeDocument, type SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';

import AppLogo from '@/components/app-logo';

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  productDescription: z.string().min(1, "Product description is required"),
  keywords: z.string().min(1, "Keywords are required (comma-separated)"),
  contentType: z.string().min(1, "Content type is required"),
  additionalInstructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const CONTENT_TYPES = [
  { value: "website copy", label: "Website Copy", icon: <Monitor className="w-4 h-4" /> },
  { value: "social media post", label: "Social Media Post", icon: <Users className="w-4 h-4" /> },
  { value: "blog post", label: "Blog Post", icon: <FileText className="w-4 h-4" /> },
  { value: "radio script", label: "Radio Script", icon: <Mic className="w-4 h-4" /> },
  { value: "tv script", label: "TV Script", icon: <Tv className="w-4 h-4" /> },
  { value: "podcast outline", label: "Podcast Outline", icon: <Podcast className="w-4 h-4" /> },
  { value: "billboard", label: "Billboard Ad", icon: <Presentation className="w-4 h-4" /> },
];

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

const exportTextFile = (filename: string, text: string) => {
  const element = document.createElement("a");
  const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

export default function IPBuilderPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      productDescription: "",
      keywords: "",
      contentType: "",
      additionalInstructions: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    } else {
      setFile(null);
      setFileName("");
    }
  };

  const handleSummarize = async () => {
    if (!file) {
      toast({ title: "No file selected", description: "Please select a document to summarize.", variant: "destructive" });
      return;
    }
    setIsSummarizing(true);
    try {
      const dataUri = await fileToDataUri(file);
      const summaryOutput: SummarizeDocumentOutput = await summarizeDocument({ documentDataUri: dataUri });
      
      form.setValue("companyName", summaryOutput.companyName);
      form.setValue("productDescription", summaryOutput.productDescription);
      form.setValue("keywords", summaryOutput.keywords.join(', '));
      
      toast({ title: "Document Summarized", description: "Form fields have been populated with extracted information." });
    } catch (error) {
      console.error("Error summarizing document:", error);
      toast({ title: "Summarization Error", description: "Could not summarize the document. Please try again.", variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedCopy(null);
    try {
      const marketingInput = {
        keywords: data.keywords,
        contentType: data.contentType,
        additionalInstructions: data.additionalInstructions || "",
      };
      const result = await generateMarketingCopy(marketingInput);
      setGeneratedCopy(result.marketingCopy);
      toast({ title: "Marketing Copy Generated!", description: "Your new marketing copy is ready." });
    } catch (error) {
      console.error("Error generating copy:", error);
      toast({ title: "Generation Error", description: "Could not generate marketing copy. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (generatedCopy) {
      const selectedContentType = CONTENT_TYPES.find(ct => ct.value === form.getValues("contentType"))?.label || "marketing";
      const filename = `${selectedContentType.toLowerCase().replace(/\s+/g, '_')}_copy.txt`;
      exportTextFile(filename, generatedCopy);
      toast({ title: "Copy Exported", description: `Copied exported as ${filename}`});
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        <header className="mb-10 text-center">
          <AppLogo />
          <p className="mt-2 text-muted-foreground font-body">
            Leverage AI to build compelling intellectual property narratives and marketing content.
          </p>
        </header>

        <div className="space-y-8">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <UploadCloud className="w-6 h-6 mr-3 text-primary" /> Document Import (Optional)
              </CardTitle>
              <CardDescription>Upload a PDF or Word document describing your company or product to auto-fill the form below.</CardDescription>
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
                />
                {fileName && <p className="mt-2 text-sm text-muted-foreground">Selected file: {fileName}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSummarize} disabled={!file || isSummarizing} className="w-full sm:w-auto">
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Summarize Document
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <FileText className="w-6 h-6 mr-3 text-primary" /> Marketing Brief
              </CardTitle>
              <CardDescription>Provide details about your company/product, or refine the auto-filled information.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Acme Innovations" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product/Service Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Describe your product or service in a few sentences." {...field} rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Keywords</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., AI, SaaS, innovation, marketing (comma-separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a content type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONTENT_TYPES.map(ct => (
                              <SelectItem key={ct.value} value={ct.value}>
                                <div className="flex items-center">
                                  {React.cloneElement(ct.icon, { className: "w-4 h-4 mr-2 text-muted-foreground"})}
                                  {ct.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Target audience is young professionals, tone should be humorous." {...field} rows={3}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isGenerating || isSummarizing} className="w-full sm:w-auto">
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Generate Marketing Copy
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {generatedCopy && (
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Generated Marketing Copy</CardTitle>
                <CardDescription>Review your AI-generated marketing copy below.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea value={generatedCopy} readOnly rows={10} className="bg-muted/30 p-4 rounded-md font-mono text-sm leading-relaxed"/>
              </CardContent>
              <CardFooter>
                <Button onClick={handleExport} className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Export Copy (TXT)
                </Button>
              </CardFooter>
            </Card>
          )}
          {(isGenerating || isSummarizing) && !generatedCopy && (
             <Card className="shadow-lg rounded-xl">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-foreground">AI is working its magic...</p>
                <p className="text-muted-foreground">Please wait a moment.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm font-body">
        <p>&copy; {new Date().getFullYear()} IPbuilderAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
