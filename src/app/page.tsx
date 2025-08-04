
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import { useSearchParams, useRouter } from 'next/navigation';


import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";

import { UploadCloud, FileText, Wand2, Download, Loader2, Monitor, Users, Mic, Tv, Podcast, Presentation, LinkIcon, LayoutDashboard, Copy, Image as ImageIconLucide, RotateCcw, Palette, Lightbulb, Save, History, Clock, Mail } from 'lucide-react';

import { summarizeDocument } from '@/ai/flows/summarize-document';
import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import { summarizeWebsite } from '@/ai/flows/summarize-website-flow';
import type { SummarizeWebsiteOutput } from '@/ai/flows/summarize-website-flow';
import { suggestKeywords } from '@/ai/flows/suggest-keywords-flow.ts';

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';

import AppLogo from '@/components/app-logo';

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "humorous", label: "Humorous" },
  { value: "urgent", label: "Urgent" },
  { value: "persuasive", label: "Persuasive" },
  { value: "informative", label: "Informative" },
  { value: "inspirational", label: "Inspirational" },
];

const SOCIAL_MEDIA_PLATFORMS = [
  { value: "generic", label: "Generic / Not Specified" },
  { value: "twitter", label: "Twitter / X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
];

const TV_SCRIPT_LENGTHS = [
  { value: "8s", label: "8 seconds (VEO)" },
  { value: "15s", label: "15 seconds" },
  { value: "30s", label: "30 seconds" },
];
const NO_TV_LENGTH_SELECTED_VALUE = "_no_tv_length_";

const RADIO_SCRIPT_LENGTHS = [
  { value: "10s", label: "10 seconds" },
  { value: "15s", label: "15 seconds" },
  { value: "30s", label: "30 seconds" },
  { value: "60s", label: "60 seconds" },
];
const NO_RADIO_LENGTH_SELECTED_VALUE = "_no_radio_length_";


const NO_TONE_SELECTED_VALUE = "_no_tone_selected_";
const NO_PLATFORM_SELECTED_VALUE = "_no_platform_selected_";
const LOCAL_STORAGE_BRIEF_KEY = 'ipbuilder_saved_brief';

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  productDescription: z.string().min(1, "Product description is required"),
  keywords: z.string().min(1, "Keywords are required (comma-separated)"),
  contentType: z.array(z.string()).min(1, "Please select at least one content type."),
  tone: z.string().optional(),
  socialMediaPlatform: z.string().optional(),
  tvScriptLength: z.string().optional(),
  radioScriptLength: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SavedBriefData extends Omit<FormData, 'contentType'> {}
interface MarketingBrief {
    companyName?: string;
    productDescription?: string;
    keywords?: string[];
}


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
  { value: "display ad copy", label: "Display Ad Copy", icon: <ImageIconLucide className="w-4 h-4" /> },
  { value: "lead generation email", label: "Lead Generation Email", icon: <Mail className="w-4 h-4" /> },
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

function IPBuilderPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopyItem[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingKeywords, setIsSuggestingKeywords] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [hasSavedBrief, setHasSavedBrief] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      productDescription: "",
      keywords: "",
      contentType: [],
      tone: NO_TONE_SELECTED_VALUE,
      socialMediaPlatform: NO_PLATFORM_SELECTED_VALUE,
      tvScriptLength: NO_TV_LENGTH_SELECTED_VALUE,
      radioScriptLength: NO_RADIO_LENGTH_SELECTED_VALUE,
      additionalInstructions: "",
    },
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    if (typeof window !== 'undefined') {
      setHasSavedBrief(!!localStorage.getItem(LOCAL_STORAGE_BRIEF_KEY));

      const briefParam = searchParams.get('brief');
      const errorParam = searchParams.get('error');

      if (briefParam) {
        try {
          const decodedBrief = Buffer.from(briefParam, 'base64').toString('utf-8');
          const briefData: MarketingBrief = JSON.parse(decodedBrief);
          form.setValue("companyName", briefData.companyName || "");
          form.setValue("productDescription", briefData.productDescription || "");
          form.setValue("keywords", (briefData.keywords || []).join(', '));
          toast({ title: "Marketing Brief Loaded", description: "The brief has been autofilled from the integrated app." });
        } catch (e) {
          console.error("Failed to parse brief from URL", e);
          toast({ title: "Brief Load Error", description: "Could not read the marketing brief from the URL.", variant: "destructive" });
        } finally {
            router.replace('/', undefined);
        }
      }

      if (errorParam) {
        toast({ title: "Integration Error", description: errorParam, variant: "destructive" });
        router.replace('/', undefined);
      }
    }
  }, [searchParams, form, router, toast]);

  const selectedContentTypes = form.watch('contentType');
  const showSocialMediaPlatformSelector = selectedContentTypes?.includes('social media post');
  const showTvScriptLengthSelector = selectedContentTypes?.includes('tv script');
  const showRadioScriptLengthSelector = selectedContentTypes?.includes('radio script');

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

  const handleSuggestKeywords = async () => {
    const companyName = form.getValues("companyName");
    const productDescription = form.getValues("productDescription");

    if (!companyName || !productDescription) {
      toast({ title: "Missing Information", description: "Please provide Company Name and Product Description to suggest keywords.", variant: "destructive"});
      return;
    }
    setIsSuggestingKeywords(true);
    try {
      const result = await suggestKeywords({ companyName, productDescription });
      if (result.suggestedKeywords && result.suggestedKeywords.length > 0) {
        const currentKeywords = form.getValues("keywords").split(',').map(k => k.trim()).filter(k => k);
        const newKeywords = result.suggestedKeywords.filter(sk => !currentKeywords.includes(sk));
        const updatedKeywords = [...currentKeywords, ...newKeywords].join(', ');
        form.setValue("keywords", updatedKeywords);
        toast({ title: "Keywords Suggested", description: `${newKeywords.length} new keyword(s) added to your list.`});
      } else {
        toast({ title: "No New Keywords", description: "The AI couldn't suggest additional unique keywords at this time."});
      }
    } catch (error: any) {
      console.error("Error suggesting keywords:", error);
      toast({ title: "Keyword Suggestion Error", description: error.message || "Could not suggest keywords.", variant: "destructive"});
    } finally {
      setIsSuggestingKeywords(false);
    }
  };
  
  const handleSaveBrief = () => {
    try {
      const briefData: SavedBriefData = {
        companyName: form.getValues("companyName"),
        productDescription: form.getValues("productDescription"),
        keywords: form.getValues("keywords"),
        tone: form.getValues("tone") || NO_TONE_SELECTED_VALUE,
        socialMediaPlatform: form.getValues("socialMediaPlatform") || NO_PLATFORM_SELECTED_VALUE,
        tvScriptLength: form.getValues("tvScriptLength") || NO_TV_LENGTH_SELECTED_VALUE,
        radioScriptLength: form.getValues("radioScriptLength") || NO_RADIO_LENGTH_SELECTED_VALUE,
        additionalInstructions: form.getValues("additionalInstructions") || "",
      };
      localStorage.setItem(LOCAL_STORAGE_BRIEF_KEY, JSON.stringify(briefData));
      setHasSavedBrief(true);
      toast({ title: "Brief Saved", description: "Your marketing brief has been saved locally in your browser."});
    } catch (error) {
      console.error("Error saving brief to localStorage:", error);
      toast({ title: "Save Error", description: "Could not save the brief. Your browser might be blocking localStorage or out of space.", variant: "destructive"});
    }
  };

  const handleLoadBrief = () => {
    try {
      const savedBriefJson = localStorage.getItem(LOCAL_STORAGE_BRIEF_KEY);
      if (savedBriefJson) {
        const savedBrief: SavedBriefData = JSON.parse(savedBriefJson);
        form.reset({
            companyName: savedBrief.companyName || "",
            productDescription: savedBrief.productDescription || "",
            keywords: savedBrief.keywords || "",
            contentType: form.getValues('contentType'), 
            tone: savedBrief.tone || NO_TONE_SELECTED_VALUE,
            socialMediaPlatform: savedBrief.socialMediaPlatform || NO_PLATFORM_SELECTED_VALUE,
            tvScriptLength: savedBrief.tvScriptLength || NO_TV_LENGTH_SELECTED_VALUE,
            radioScriptLength: savedBrief.radioScriptLength || NO_RADIO_LENGTH_SELECTED_VALUE,
            additionalInstructions: savedBrief.additionalInstructions || "",
        });
        toast({ title: "Brief Loaded", description: "Your saved marketing brief has been loaded into the form."});
      } else {
        toast({ title: "No Saved Brief", description: "No marketing brief found in local storage.", variant: "default"});
      }
    } catch (error) {
      console.error("Error loading brief from localStorage:", error);
      toast({ title: "Load Error", description: "Could not load the brief from localStorage. The data might be corrupted.", variant: "destructive"});
    }
  };


  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setGeneratedCopy(null);
    const allGeneratedCopies: GeneratedCopyItem[] = [];

    let toneForAI = data.tone;
    if (toneForAI === NO_TONE_SELECTED_VALUE) {
      toneForAI = "";
    }
    let platformForAI = data.socialMediaPlatform;
    if (platformForAI === NO_PLATFORM_SELECTED_VALUE || platformForAI === "generic") {
      platformForAI = "";
    }
    let tvScriptLengthForAI = data.tvScriptLength;
    if (tvScriptLengthForAI === NO_TV_LENGTH_SELECTED_VALUE) {
      tvScriptLengthForAI = ""; 
    }
    let radioScriptLengthForAI = data.radioScriptLength;
    if (radioScriptLengthForAI === NO_RADIO_LENGTH_SELECTED_VALUE) {
      radioScriptLengthForAI = ""; 
    }


    try {
      for (const typeValue of data.contentType) {
        const contentTypeDefinition = CONTENT_TYPES.find(ct => ct.value === typeValue);
        const marketingInput: any = { 
          keywords: data.keywords,
          contentType: typeValue,
          tone: toneForAI || "",
          additionalInstructions: data.additionalInstructions || "",
          companyName: data.companyName,
          productDescription: data.productDescription,
        };

        if (typeValue === "social media post" && platformForAI) {
            marketingInput.socialMediaPlatform = platformForAI;
        }
        if (typeValue === "tv script") {
            marketingInput.tvScriptLength = tvScriptLengthForAI;
        }
        if (typeValue === "radio script") {
            marketingInput.radioScriptLength = radioScriptLengthForAI;
        }


        const result = await generateMarketingCopy(marketingInput);
        allGeneratedCopies.push({
          value: typeValue,
          label: contentTypeDefinition ? contentTypeDefinition.label : typeValue,
          marketingCopy: result.marketingCopy,
        });
      }
      setGeneratedCopy(allGeneratedCopies);
      toast({ title: "Marketing Copy Generated!", description: `Generated copy for ${allGeneratedCopies.length} content type(s).` });
    } catch (error: any) {
      console.error("Error generating copy:", error);
      let errorMessage = "Could not generate marketing copy. Please try again or check your input.";
       if (error.message) {
        errorMessage = error.message;
      }
      toast({ title: "Generation Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTxt = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      const firstContentTypeLabel = generatedCopy[0].label || "marketing";
      const filenameBase = `${firstContentTypeLabel.toLowerCase().replace(/\s+/g, '_').substring(0,20)}`;
      exportTextFile(filenameBase, generatedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as ${filenameBase}_marketing_copies.txt`});
    }
  };
  
  const handleExportPdf = () => {
    if (!generatedCopy || generatedCopy.length === 0) {
      toast({ title: "No Content", description: "Nothing to export.", variant: "destructive" });
      return;
    }

    try {
      const doc = new jsPDF();
      let yPosition = 15;
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const maxLineWidth = pageWidth - margin * 2;
      const lineHeightFactor = 1.15;

      doc.setFontSize(18);
      const mainTitle = "Generated Marketing Copies";
      const mainTitleWidth = doc.getTextWidth(mainTitle);
      doc.text(mainTitle, (pageWidth - mainTitleWidth) / 2, yPosition);
      yPosition += 10;

      generatedCopy.forEach((copy) => {
        const ensureSpace = (neededHeight: number) => {
          if (yPosition + neededHeight > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
        };

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        const labelLineHeight = 14 * lineHeightFactor;
        const contentTypeLabel = `Content Type: ${copy.label}`;
        const labelLines = doc.splitTextToSize(contentTypeLabel, maxLineWidth);
        ensureSpace(labelLines.length * labelLineHeight);
        doc.text(labelLines, margin, yPosition);
        yPosition += (labelLines.length * labelLineHeight) + 5;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const textLineHeight = 10 * lineHeightFactor;
        const marketingText = copy.marketingCopy;
        const textLines = doc.splitTextToSize(marketingText, maxLineWidth);
        
        textLines.forEach((line: string) => {
          ensureSpace(textLineHeight);
          doc.text(line, margin, yPosition);
          yPosition += textLineHeight;
        });

        yPosition += 10;
      });

      const filenameBase = generatedCopy[0]?.label.toLowerCase().replace(/\s+/g, '_').substring(0,20) || "marketing";
      doc.save(`${filenameBase}_marketing_copies.pdf`);
      toast({ title: "Copies Exported", description: `All generated copies exported as ${filenameBase}_marketing_copies.pdf` });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "PDF Export Error", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    }
  };

  const handleExportHtmlForGoogleDocs = () => {
    if (!generatedCopy || generatedCopy.length === 0) {
      toast({ title: "No Content", description: "Nothing to export.", variant: "destructive" });
      return;
    }
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Generated Marketing Copies</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { font-size: 1.8em; margin-bottom: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px;}
            h2 { font-size: 1.4em; margin-top: 20px; margin-bottom: 8px; color: #555; }
            pre {
              background-color: #f8f8f8;
              border: 1px solid #ddd;
              padding: 15px;
              white-space: pre-wrap;
              word-wrap: break-word;
              font-family: Consolas, 'Courier New', monospace;
              font-size: 0.95em;
              border-radius: 4px;
              overflow-x: auto;
            }
            div { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Generated Marketing Copies</h1>
      `;

      generatedCopy.forEach(copy => {
        htmlContent += `
          <div>
            <h2>Content Type: ${copy.label}</h2>
            <pre>${copy.marketingCopy.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </div>
        `;
      });

      htmlContent += `
        </body>
        </html>
      `;
      
      const filenameBase = generatedCopy[0]?.label.toLowerCase().replace(/\s+/g, '_').substring(0,20) || "marketing";
      const filename = `${filenameBase}_marketing_copies.html`;

      const blob = new Blob([htmlContent], {
        type: 'text/html;charset=utf-8'
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: "Copies Exported", description: `All generated copies exported as ${filename}. You can import this file into Google Docs.` });

    } catch (error) {
      console.error("Error generating HTML for Google Docs:", error);
      toast({ title: "HTML Export Error", description: "Could not generate HTML file. Please try again.", variant: "destructive" });
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

  const handleClearForm = () => {
    form.reset({
      companyName: "",
      productDescription: "",
      keywords: "",
      contentType: [],
      tone: NO_TONE_SELECTED_VALUE,
      socialMediaPlatform: NO_PLATFORM_SELECTED_VALUE,
      tvScriptLength: NO_TV_LENGTH_SELECTED_VALUE,
      radioScriptLength: NO_RADIO_LENGTH_SELECTED_VALUE,
      additionalInstructions: "",
    });
    setFile(null);
    setFileName("");
    setWebsiteUrl("");
    setGeneratedCopy(null);
    
    const fileInput = document.getElementById('document-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    toast({ title: "Form Cleared", description: "All inputs and outputs have been cleared." });
  };

  const getRowsForContentType = (contentTypeValue: string) => {
    switch (contentTypeValue) {
      case 'website wireframe':
      case 'display ad copy':
      case 'podcast outline':
      case 'radio script':
      case 'blog post':
        return 15;
      default:
        return 8;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        <header className="mb-6 text-center">
          <AppLogo />
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
                        <div className="flex items-center gap-2">
                            <FormControl className="flex-grow">
                                <Input placeholder="e.g., AI, SaaS, marketing (comma-separated)" {...field} />
                            </FormControl>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleSuggestKeywords}
                                disabled={isSuggestingKeywords || !form.getValues("companyName") || !form.getValues("productDescription")}
                                className="shrink-0"
                            >
                                {isSuggestingKeywords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                                Suggest Keywords
                            </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Palette className="w-4 h-4 mr-2 text-muted-foreground"/>Desired Tone (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={NO_TONE_SELECTED_VALUE}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a tone (optional, AI default)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_TONE_SELECTED_VALUE}>None (AI Default)</SelectItem>
                            {TONES.map((tone) => (
                              <SelectItem key={tone.value} value={tone.value}>
                                {tone.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select a tone to influence the style of the generated copy.
                        </FormDescription>
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

                  {showSocialMediaPlatformSelector && (
                     <FormField
                        control={form.control}
                        name="socialMediaPlatform"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Social Media Platform (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} defaultValue={NO_PLATFORM_SELECTED_VALUE}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select platform (optional, for Social Media Posts)" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value={NO_PLATFORM_SELECTED_VALUE}>Generic / Not Specified</SelectItem>
                                {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                                <SelectItem key={platform.value} value={platform.value}>
                                    {platform.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormDescription>
                            Tailor social media posts for a specific platform.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}

                  {showTvScriptLengthSelector && (
                    <FormField
                      control={form.control}
                      name="tvScriptLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center"><Clock className="w-4 h-4 mr-2 text-muted-foreground"/>TV Script Length (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={NO_TV_LENGTH_SELECTED_VALUE}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select TV script length (optional, default 30s)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NO_TV_LENGTH_SELECTED_VALUE}>Default (30 seconds)</SelectItem>
                              {TV_SCRIPT_LENGTHS.map((length) => (
                                <SelectItem key={length.value} value={length.value}>
                                  {length.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the desired length for the TV script. Defaults to 30 seconds if not specified.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {showRadioScriptLengthSelector && (
                    <FormField
                      control={form.control}
                      name="radioScriptLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center"><Clock className="w-4 h-4 mr-2 text-muted-foreground"/>Radio Script Length (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={NO_RADIO_LENGTH_SELECTED_VALUE}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select radio script length (optional, default all)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={NO_RADIO_LENGTH_SELECTED_VALUE}>Default (All lengths: 10, 15, 30, 60s)</SelectItem>
                              {RADIO_SCRIPT_LENGTHS.map((length) => (
                                <SelectItem key={length.value} value={length.value}>
                                  {length.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose a specific length or get all standard radio script lengths.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="additionalInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="e.g., Target audience is young professionals, specific phrases to include/avoid." {...field} rows={3}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" disabled={isGenerating || isSummarizing || isSuggestingKeywords} className="w-full sm:w-auto">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        Generate Marketing Copy
                    </Button>
                    <Button type="button" variant="outline" onClick={handleSaveBrief} className="w-full sm:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save Brief
                    </Button>
                    <Button type="button" variant="outline" onClick={handleLoadBrief} disabled={!hasSavedBrief} className="w-full sm:w-auto">
                        <History className="mr-2 h-4 w-4" />
                        Load Brief
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {(isGenerating || isSummarizing || isSuggestingKeywords) && (!generatedCopy || generatedCopy.length === 0) && (
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
                            <Textarea value={item.marketingCopy} readOnly rows={getRowsForContentType(item.value)} className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50"/>
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                    <Button onClick={handleExportTxt} disabled={!generatedCopy || generatedCopy.length === 0} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export All (TXT)
                    </Button>
                    <Button onClick={handleExportPdf} disabled={!generatedCopy || generatedCopy.length === 0} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export All (PDF)
                    </Button>
                    <Button onClick={handleExportHtmlForGoogleDocs} disabled={!generatedCopy || generatedCopy.length === 0} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export All (HTML for Google Docs)
                    </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm font-body">
        <p>&copy; {currentYear !== null ? currentYear : '...'} The Calton Group. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function IPBuilderPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <IPBuilderPageContent />
        </Suspense>
    )
}
