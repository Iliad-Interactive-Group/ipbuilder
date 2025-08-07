
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import { useSearchParams, useRouter } from 'next/navigation';


import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

import { useToast } from "@/hooks/use-toast";

import { Download, Loader2, Copy, FileText, Monitor, Users, Mic, Tv, Podcast, Presentation, LayoutDashboard, Image as ImageIconLucide, Mail } from 'lucide-react';


import type { SummarizeDocumentOutput } from '@/ai/flows/summarize-document';
import type { SummarizeWebsiteOutput } from '@/ai/flows/summarize-website-flow';

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';

import AppLogo from '@/components/app-logo';
import DataInputCard from '@/components/page/data-input-card';
import MarketingBriefForm, { MarketingBriefFormData, formSchema } from '@/components/page/marketing-brief-form';


export const CONTENT_TYPES = [
  { value: "website copy", label: "Website Copy", icon: Monitor },
  { value: "social media post", label: "Social Media Post", icon: Users },
  { value: "blog post", label: "Blog Post", icon: FileText },
  { value: "radio script", label: "Radio Script", icon: Mic },
  { value: "tv script", label: "TV Script", icon: Tv },
  { value: "podcast outline", label: "Podcast Outline", icon: Podcast },
  { value: "billboard", label: "Billboard Ad", icon: Presentation },
  { value: "website wireframe", label: "Website Wireframe", icon: LayoutDashboard },
  { value: "display ad copy", label: "Display Ad Copy", icon: ImageIconLucide },
  { value: "lead generation email", label: "Lead Generation Email", icon: Mail },
];


export interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string | string[];
}

interface MarketingBrief {
    companyName?: string;
    productDescription?: string;
    keywords?: string[];
}

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
    textContent += `${Array.isArray(copy.marketingCopy) ? copy.marketingCopy.join('\n\n') : copy.marketingCopy}\n\n\n`;
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

  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopyItem[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [briefData, setBriefData] = useState<MarketingBrief | null>(null);

  const form = useForm<MarketingBriefFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      productDescription: "",
      keywords: "",
      contentType: [],
      tone: "_no_tone_selected_",
      socialMediaPlatform: "_no_platform_selected_",
      tvScriptLength: "_no_tv_length_",
      radioScriptLength: "_no_radio_length_",
      additionalInstructions: "",
    },
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    if (typeof window !== 'undefined') {

      const briefParam = searchParams.get('brief');
      const errorParam = searchParams.get('error');

      if (briefParam) {
        try {
          const decodedBrief = Buffer.from(briefParam, 'base64').toString('utf-8');
          const briefDataFromUrl: MarketingBrief = JSON.parse(decodedBrief);
          form.setValue("companyName", briefDataFromUrl.companyName || "");
          form.setValue("productDescription", briefDataFromUrl.productDescription || "");
          form.setValue("keywords", (briefDataFromUrl.keywords || []).join(', '));
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

  useEffect(() => {
    if (briefData) {
      form.setValue("companyName", briefData.companyName || "");
      form.setValue("productDescription", briefData.productDescription || "");
      form.setValue("keywords", (briefData.keywords || []).join(', '));
    }
  }, [briefData, form]);


  const handleClearForm = () => {
    form.reset({
      companyName: "",
      productDescription: "",
      keywords: "",
      contentType: [],
      tone: "_no_tone_selected_",
      socialMediaPlatform: "_no_platform_selected_",
      tvScriptLength: "_no_tv_length_",
      radioScriptLength: "_no_radio_length_",
      additionalInstructions: "",
    });
    setGeneratedCopy(null);
    toast({ title: "Form Cleared", description: "All inputs and outputs have been cleared." });
  };
  
  const handleCopy = async (textToCopy: string | string[], label: string) => {
    const text = Array.isArray(textToCopy) ? textToCopy.join('\n\n') : textToCopy;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: `${label} copy has been copied.` });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: "Copy Failed", description: `Could not copy ${label}.`, variant: "destructive" });
    }
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

  const onSubmit = async (data: MarketingBriefFormData) => {
    setIsGenerating(true);
    setGeneratedCopy(null);
    const allGeneratedCopies: GeneratedCopyItem[] = [];

    let toneForAI = data.tone;
    if (toneForAI === "_no_tone_selected_") {
      toneForAI = "";
    }
    let platformForAI = data.socialMediaPlatform;
    if (platformForAI === "_no_platform_selected_" || platformForAI === "generic") {
      platformForAI = "";
    }
    let tvScriptLengthForAI = data.tvScriptLength;
    if (tvScriptLengthForAI === "_no_tv_length_") {
      tvScriptLengthForAI = ""; 
    }
    let radioScriptLengthForAI = data.radioScriptLength;
    if (radioScriptLengthForAI === "_no_radio_length_") {
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
        const marketingText = Array.isArray(copy.marketingCopy) ? copy.marketingCopy.join('\n\n') : copy.marketingCopy;
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
        const marketingText = Array.isArray(copy.marketingCopy) ? copy.marketingCopy.join('<br><br>') : copy.marketingCopy;
        htmlContent += `
          <div>
            <h2>Content Type: ${copy.label}</h2>
            <pre>${marketingText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
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
  
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        <header className="mb-6 text-center">
          <AppLogo />
        </header>

        <div className="space-y-8">
          <DataInputCard
            isSummarizing={isSummarizing}
            setIsSummarizing={setIsSummarizing}
            isGenerating={isGenerating}
            onClearForm={handleClearForm}
            onSummarizationComplete={setBriefData}
          />

          <MarketingBriefForm
            form={form}
            onSubmit={onSubmit}
            isGenerating={isGenerating || isSummarizing}
           />

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
                    {generatedCopy.map((item) => {
                        const copyText = Array.isArray(item.marketingCopy) ? item.marketingCopy.join("\n\n") : item.marketingCopy;
                        const Icon = CONTENT_TYPES.find(ct => ct.value === item.value)?.icon || FileText;
                        return (
                            <div key={item.value} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-primary flex items-center">
                                       <Icon className="w-5 h-5 mr-2" />
                                        {item.label}
                                    </h3>
                                    <Button variant="outline" size="sm" onClick={() => handleCopy(item.marketingCopy, item.label)}>
                                        <Copy className="w-3 h-3 mr-2" />
                                        Copy
                                    </Button>
                                </div>
                                <Textarea value={copyText} readOnly rows={getRowsForContentType(item.value)} className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50"/>
                            </div>
                        )
                    })}
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

    