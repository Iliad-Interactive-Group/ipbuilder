
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { useToast } from "@/hooks/use-toast";

import { Loader2 } from 'lucide-react';

import type { MarketingBriefBlueprint } from '@/ai/schemas/marketing-brief-schemas';

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';
import type { GenerateMarketingCopyOutput } from '@/ai/flows/generate-marketing-copy';
import { generateImage } from '@/ai/flows/generate-image-flow';

import AppLogo from '@/components/app-logo';
import DataInputCard from '@/components/page/data-input-card';
import MarketingBriefForm, { MarketingBriefFormData, formSchema } from '@/components/page/marketing-brief-form';
import GeneratedCopyDisplay, { GeneratedCopyItem } from '@/components/page/generated-copy-display';
import { CONTENT_TYPES } from '@/lib/content-types';
import { exportTextFile, exportPdf, exportHtmlForGoogleDocs } from '@/lib/export-helpers';

interface GenerationProgress {
  total: number;
  current: number;
  currentLabel: string;
}

function IPBuilderPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopyItem[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [briefData, setBriefData] = useState<MarketingBriefBlueprint | null>(null);

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
    
    const briefParam = searchParams.get('brief');
    const errorParam = searchParams.get('error');

    if (briefParam) {
      try {
        const decodedBrief = Buffer.from(briefParam, 'base64').toString('utf-8');
        const briefDataFromUrl: MarketingBriefBlueprint = JSON.parse(decodedBrief);
        form.setValue("companyName", briefDataFromUrl.companyName || "");
        form.setValue("productDescription", briefDataFromUrl.productDescription || "");
        form.setValue("keywords", (briefDataFromUrl.keywords || []).join(', '));
        toast({ title: "Marketing Brief Loaded", description: "The brief has been autofilled from the integrated app." });
      } catch (e) {
        console.error("Failed to parse brief from URL", e);
        toast({ title: "Brief Load Error", description: "Could not read the marketing brief from the URL.", variant: "destructive" });
      } finally {
        // A non-persistent URL is a better user experience
        router.replace('/', { scroll: false });
      }
    }

    if (errorParam) {
      toast({ title: "Integration Error", description: decodeURIComponent(errorParam), variant: "destructive" });
      router.replace('/', { scroll: false });
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
    setGeneratedCopy([]);
    toast({ title: "Form Cleared", description: "All inputs and outputs have been cleared." });
  };
  
  const handleCopy = (textToCopy: any, label: string) => {
    if (typeof textToCopy === 'object' && textToCopy !== null) {
      toast({ title: "Copy Failed", description: `Cannot copy complex object for ${label}. Please use export instead.`, variant: "destructive" });
      return;
    }
    const text = Array.isArray(textToCopy) ? textToCopy.join('\n\n') : textToCopy;
    try {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: `${label} copy has been copied.` });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: "Copy Failed", description: `Could not copy ${label}.`, variant: "destructive" });
    }
  };

  const onSubmit = async (data: MarketingBriefFormData) => {
    setIsGenerating(true);
    setGeneratedCopy([]); // Clear previous results immediately
    setGenerationProgress({ total: data.contentType.length, current: 0, currentLabel: ""});
    
    let toneForAI = data.tone === "_no_tone_selected_" ? "" : data.tone;
    let platformForAI = (data.socialMediaPlatform === "_no_platform_selected_" || data.socialMediaPlatform === "generic") ? "" : data.socialMediaPlatform;
    let tvScriptLengthForAI = data.tvScriptLength === "_no_tv_length_" ? "" : data.tvScriptLength;
    let radioScriptLengthForAI = data.radioScriptLength === "_no_radio_length_" ? "" : data.radioScriptLength;

    const generatePromises = data.contentType.map(async (typeValue, index) => {
      try {
        const contentTypeDefinition = CONTENT_TYPES.find(ct => ct.value === typeValue);
        const currentLabel = contentTypeDefinition ? contentTypeDefinition.label : typeValue;
        
        setGenerationProgress(prev => ({ ...prev!, current: prev!.current + 1, currentLabel }));

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

        const result: GenerateMarketingCopyOutput = await generateMarketingCopy(marketingInput);
        
        return {
          value: typeValue,
          label: currentLabel,
          marketingCopy: result.marketingCopy,
          imageSuggestion: result.imageSuggestion,
          isGeneratingImage: !!result.imageSuggestion,
        };
      } catch (error) {
        console.error(`Error generating copy for ${typeValue}:`, error);
        const contentTypeDefinition = CONTENT_TYPES.find(ct => ct.value === typeValue);
        const currentLabel = contentTypeDefinition ? contentTypeDefinition.label : typeValue;
        return {
          value: typeValue,
          label: currentLabel,
          marketingCopy: "Error: Could not generate this content.",
          isError: true
        };
      }
    });

    const initialResults: GeneratedCopyItem[] = [];
    for (const promise of generatePromises) {
        const result = await promise;
        if (result) initialResults.push(result);
    }

    setGeneratedCopy(initialResults);
    toast({ title: "Marketing Copy Generation Complete!", description: `Finished generating text for ${data.contentType.length} content type(s). Now generating images...` });
    setIsGenerating(false);
    setGenerationProgress(null);

    // Now, generate images for items that have a suggestion
    initialResults.forEach(item => {
        if (item.imageSuggestion) {
            generateImage(item.imageSuggestion)
                .then(imageDataUri => {
                    setGeneratedCopy(prevCopies => 
                        prevCopies.map(copy => 
                            copy.value === item.value 
                            ? { ...copy, generatedImage: imageDataUri, isGeneratingImage: false } 
                            : copy
                        )
                    );
                })
                .catch(error => {
                    console.error(`Error generating image for ${item.label}:`, error);
                    toast({
                        title: "Image Generation Failed",
                        description: `Could not generate the image for ${item.label}.`,
                        variant: "destructive"
                    });
                    setGeneratedCopy(prevCopies => 
                        prevCopies.map(copy => 
                            copy.value === item.value 
                            ? { ...copy, isGeneratingImage: false } // Stop loading on error
                            : copy
                        )
                    );
                });
        }
    });
  };

  const handleExportTxt = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      exportTextFile(generatedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as a .txt file.`});
    }
  };
  
  const handleExportPdf = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      exportPdf(generatedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as a .pdf file.`});
    } else {
      toast({ title: "No Content", description: "Nothing to export.", variant: "destructive" });
    }
  };

  const handleExportHtml = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      exportHtmlForGoogleDocs(generatedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as a .html file for Google Docs.`});
    } else {
      toast({ title: "No Content", description: "Nothing to export.", variant: "destructive" });
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

          {generatedCopy && generatedCopy.length > 0 && (
            <GeneratedCopyDisplay
              generatedCopy={generatedCopy}
              onCopy={handleCopy}
              onExportTxt={handleExportTxt}
              onExportPdf={handleExportPdf}
              onExportHtml={handleExportHtml}
            />
          )}

          {isGenerating && (
            <Card className="shadow-lg rounded-xl overflow-hidden mt-8">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[150px]">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-foreground">AI is working its magic...</p>
                {generationProgress && (
                  <p className="text-muted-foreground">
                    Generating {generationProgress.current} of {generationProgress.total}: {generationProgress.currentLabel}...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {isSummarizing && !isGenerating && (
            <Card className="shadow-lg rounded-xl overflow-hidden mt-8">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[150px]">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-foreground">AI is working its magic...</p>
                <p className="text-muted-foreground">Analyzing your input...</p>
              </CardContent>
            </Card>
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
        <Suspense>
            <IPBuilderPageContent />
        </Suspense>
    )
}
