
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from "@/hooks/use-toast";

import { UploadCloud, FileText, Wand2, Download, Loader2, Monitor, Users, Mic, Tv, Podcast, Presentation, LinkIcon, LayoutDashboard, Copy, Image as ImageIcon } from 'lucide-react';

import { summarizeDocument } from '@/ai/flows/summarize-document';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { summarizeWebsite } from '@/ai/flows/summarize-website-flow';
import type { SummarizeWebsiteOutput } from '@/ai/flows/summarize-website-flow';

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';

import AppLogo from '@/components/app-logo';

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  productDescription: z.string().min(1, "Product description is required"),
  keywords: z.string().min(1, "Keywords are required (comma-separated)"),
  contentType: z.array(z.string()).min(1, "Please select at least one content type."),
  additionalInstructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string;
}

const CONTENT_TYPES = [
  { value: "website copy", label: "Website Copy", icon: <Monitor className="w-4 h-4" /> },
  { value: "social media post", label: "Social Media Post", icon: <Users className="w-4 h-4" /> },
  { value: "blog post", label: "Blog Post", icon: <FileText className="w-4 h-4" /> },
  { value: "radio script", label: "Radio Script", icon: <Mic className="w-4 h-4" /> },
  { value: "tv script", label: "TV Script", icon: <Tv className="w-4 h-4" /> },
  { value: "podcast outline", label: "Podcast Outline", icon: <Podcast className="w-4 h-4" /> },
  { value: "billboard", label: "Billboard Ad", icon: <Presentation className="w-4 h-4" /> },
  { value: "website wireframe", label: "Website Wireframe", icon: <LayoutDashboard className="w-4 h-4" /> },
  { value: "display ad copy", label: "Display Ad Copy", icon: <ImageIcon className="w-4 h-4" /> },
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

const exportTextFile = (filenameBase: string, copies: Array<GeneratedCopyItem>) => {
  let textContent = "";
  copies.forEach(copy => {
    textContent += `Content Type: ${copy.label}\n`;
    textContent += `------------------------------------------\n`;
    textContent += `${copy.marketingCopy}\n\n\n`;
  });

  const element = document.createElement("a");
  const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = `${filenameBase}_marketing_copies.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(element.href);
};

export default function IPBuilderPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopyItem[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      productDescription: "",
      keywords: "",
      contentType: [],
      additionalInstructions: "",
    },
  });

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
    setGeneratedCopy(null); 

    try {
      let summaryOutput: SummarizeDocumentOutput | SummarizeWebsiteOutput; 

      if (file) {
        const dataUri = await fileToDataUri(file);
        summaryOutput = await summarizeDocument({ documentDataUri: dataUri });
      } else { 
        summaryOutput = await summarizeWebsite({ websiteUrl: websiteUrl.trim() });
      }
      
      form.setValue("companyName", summaryOutput.companyName || "");
      form.setValue("productDescription", summaryOutput.productDescription || "");
      form.setValue("keywords", (summaryOutput.keywords || []).join(', '));
      
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

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedCopy(null);
    const allGeneratedCopies: GeneratedCopyItem[] = [];

    try {
      for (const typeValue of data.contentType) {
        const contentTypeDefinition = CONTENT_TYPES.find(ct => ct.value === typeValue);
        const marketingInput = {
          keywords: data.keywords,
          contentType: typeValue, 
          additionalInstructions: data.additionalInstructions || "",
          companyName: data.companyName,
          productDescription: data.productDescription,
        };
        const result = await generateMarketingCopy(marketingInput);
        allGeneratedCopies.push({
          value: typeValue,
          label: contentTypeDefinition ? contentTypeDefinition.label : typeValue,
          marketingCopy: result.marketingCopy,
        });
      }
      setGeneratedCopy(allGeneratedCopies);
      toast({ title: "Marketing Copy Generated!", description: `Generated copy for ${allGeneratedCopies.length} content type(s).` });
    } catch (error) {
      console.error("Error generating copy:", error);
      toast({ title: "Generation Error", description: "Could not generate marketing copy. Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      const firstContentTypeLabel = generatedCopy[0].label || "marketing";
      const filenameBase = `${firstContentTypeLabel.toLowerCase().replace(/\s+/g, '_').substring(0,20)}`; 
      exportTextFile(filenameBase, generatedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as ${filenameBase}_marketing_copies.txt`});
    }
  };

  const handleCopy = async (textToCopy: string, label: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast({ title: "Copied to Clipboard", description: `${label} copy has been copied.` });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: "Copy Failed", description: `Could not copy ${label}.`, variant: "destructive" });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        <header className="mb-10 text-center">
          <AppLogo />
          <p className="mt-2 text-muted-foreground font-body">
            Leverage AI to build compelling intellectual property narratives and marketing content.
          </p>
        </header>

        <div className="space-y-8">
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
            <CardFooter>
              <Button onClick={handleSummarize} disabled={(!file && !websiteUrl.trim()) || isSummarizing || isGenerating} className="w-full sm:w-auto">
                {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Summarize & Autofill Form
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg rounded-xl overflow-hidden">
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
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel className="text-base">Content Types</FormLabel>
                          <FormDescription>
                            Select all content types you want to generate copy for.
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                          {CONTENT_TYPES.map((item) => (
                            <FormField
                              key={item.value}
                              control={form.control}
                              name="contentType"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.value}
                                    className="flex flex-row items-center space-x-2 space-y-0 bg-background p-3 rounded-md border hover:bg-muted/50 transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.value)}
                                        onCheckedChange={(checked) => {
                                          const currentValues = field.value || [];
                                          if (checked) {
                                            field.onChange([...currentValues, item.value]);
                                          } else {
                                            field.onChange(currentValues.filter((value: string) => value !== item.value));
                                          }
                                        }}
                                        className="h-5 w-5"
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center cursor-pointer w-full">
                                      {React.cloneElement(item.icon, { className: "w-4 h-4 mr-2 text-muted-foreground"})}
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
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

          {(isGenerating || isSummarizing) && (!generatedCopy || generatedCopy.length === 0) && (
             <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[150px]">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-foreground">AI is working its magic...</p>
                <p className="text-muted-foreground">Please wait a moment.</p>
              </CardContent>
            </Card>
          )}

          {generatedCopy && generatedCopy.length > 0 && (
            <div className="space-y-8">
              <Card className="shadow-lg rounded-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Generated Marketing Copies</CardTitle>
                    <CardDescription>Review your AI-generated marketing copies below. One for each content type you selected.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {generatedCopy.map((item) => (
                        <div key={item.value} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-primary flex items-center">
                                    {React.cloneElement(CONTENT_TYPES.find(ct => ct.value === item.value)?.icon || <FileText className="w-5 h-5" />, { className: "w-5 h-5 mr-2"})}
                                    {item.label}
                                </h3>
                                <Button variant="outline" size="sm" onClick={() => handleCopy(item.marketingCopy, item.label)}>
                                    <Copy className="w-3 h-3 mr-2" />
                                    Copy
                                </Button>
                            </div>
                            <Textarea value={item.marketingCopy} readOnly rows={item.value === 'website wireframe' || item.value === 'display ad copy' ? 15 : 8} className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50"/>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleExport} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Copies (TXT)
                    </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm font-body">
        <p>&copy; {currentYear !== null ? currentYear : '...'} IPbuilderAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
    
