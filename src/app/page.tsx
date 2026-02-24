
"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense, useTransition } from 'react';
import { flushSync } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"


import { useToast } from "@/hooks/use-toast";

import { Loader2, Download } from 'lucide-react';

import type { MarketingBriefBlueprint } from '@/ai/schemas/marketing-brief-schemas';

import { generateMarketingCopyAction, generateImageAction, generateAudioAction } from '@/app/actions';
import type { GenerateMarketingCopyOutput, GenerateMarketingCopyInput } from '@/ai/flows/generate-marketing-copy';

import AppLogo from '@/components/app-logo';
import ProtectedRoute from '@/components/protected-route';
import UserMenu from '@/components/user-menu';
import DataInputCard from '@/components/page/data-input-card';
import MarketingBriefForm, { MarketingBriefFormData, formSchema } from '@/components/page/marketing-brief-form';
import GeneratedCopyDisplay, { GeneratedCopyItem } from '@/components/page/generated-copy-display';
import { CONTENT_TYPES } from '@/lib/content-types';
import { exportTextFile, exportPdf, exportHtmlForGoogleDocs } from '@/lib/export-helpers';
import { isVariantsArray } from '@/lib/variant-utils';
import { Terminal } from 'lucide-react';

interface GenerationProgress {
  total: number;
  current: number;
  currentLabel: string;
}

// Function to strip production cues like [SFX: ...] or [MUSIC: ...] from a script
const stripProductionCues = (script: string): string => {
  // This regex looks for square brackets and removes them and their content.
  // It handles multiline content within the brackets as well.
  return script.replace(/\[[^\]]*\]/g, '').trim();
};


function IPBuilderPageContent() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [generatedCopy, setGeneratedCopy] = useState<GeneratedCopyItem[]>([]);
  const [editedCopy, setEditedCopy] = useState<Record<string, string>>({});
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [briefData, setBriefData] = useState<MarketingBriefBlueprint | null>(null);
  const [activeAudioItem, setActiveAudioItem] = useState<GeneratedCopyItem | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);


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
      radioScriptLength: "30s",
      emailType: "_no_email_type_",
      additionalInstructions: "",
      numberOfVariations: undefined,
      numberOfImageVariations: undefined,
      voiceGender: undefined,
      voiceName: undefined,
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
      } catch (e: unknown) {
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
      radioScriptLength: "30s",
      emailType: "_no_email_type_",
      additionalInstructions: "",
      numberOfVariations: undefined,
      numberOfImageVariations: undefined,
      voiceGender: undefined,
      voiceName: undefined,
    });
    setGeneratedCopy([]);
    setEditedCopy({});
    toast({ title: "Form Cleared", description: "All inputs and outputs have been cleared." });
  };
  
  const handleCopy = (textToCopy: string | string[] | Record<string, unknown>, label: string) => {
    if (typeof textToCopy === 'object' && textToCopy !== null && !Array.isArray(textToCopy)) {
      toast({ title: "Copy Failed", description: `Cannot copy complex object for ${label}. Please use export instead.`, variant: "destructive" });
      return;
    }
    const text = Array.isArray(textToCopy) ? textToCopy.join('\n\n') : String(textToCopy);
    try {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: `${label} copy has been copied.` });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({ title: "Copy Failed", description: `Could not copy ${label}.`, variant: "destructive" });
    }
  };

  const handleCopyEdit = (itemValue: string, newText: string) => {
    setEditedCopy(prev => ({...prev, [itemValue]: newText}));
  };

  const onSubmit = async (data: MarketingBriefFormData) => {
    console.log('[Form Submit] Button clicked, starting generation for:', {
      contentTypes: data.contentType,
      companyName: data.companyName,
      keywordCount: data.keywords.split(',').length,
    });

    // Client-side validation before calling server action
    const validationResult = formSchema.safeParse(data);
    if (!validationResult.success) {
      console.warn('[Form Submit] Validation failed:', validationResult.error);
      toast({ 
        title: "Validation Error", 
        description: "Please check your form inputs.", 
        variant: "destructive" 
      });
      return;
    }
    
    // Use flushSync to force React to update the DOM immediately
    // This ensures the loading spinner is visible BEFORE we start async work
    flushSync(() => {
      setIsGenerating(true);
      setGeneratedCopy([]); // Clear previous results immediately
      setEditedCopy({}); // Clear previous edits
      setGenerationProgress({ total: data.contentType.length, current: 0, currentLabel: "Starting..."});
    });

    // Scroll to loading indicator after it renders
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);

    toast({ 
      title: "Starting Generation", 
      description: `Generating ${data.contentType.length} content type(s)... This may take 30-60 seconds.` 
    });

    startTransition(async () => {
      try {
        console.log('[Form Submit] Transition started, setting generating state');
        
        let toneForAI = data.tone === "_no_tone_selected_" ? "" : data.tone;
        let platformForAI = (data.socialMediaPlatform === "_no_platform_selected_" || data.socialMediaPlatform === "generic") ? "" : data.socialMediaPlatform;
        let tvScriptLengthForAI = data.tvScriptLength === "_no_tv_length_" ? "" : data.tvScriptLength;
        let radioScriptLengthForAI = data.radioScriptLength === "_no_radio_length_" ? "" : data.radioScriptLength;
        let emailTypeForAI = data.emailType === "_no_email_type_" ? "" : data.emailType;

        const generatePromises = data.contentType.map(async (typeValue: string) => {
        try {
          const contentTypeDefinition = CONTENT_TYPES.find(ct => ct.value === typeValue);
          const currentLabel = contentTypeDefinition ? contentTypeDefinition.label : typeValue;
          
          setGenerationProgress((prev: GenerationProgress | null) => ({ 
            total: prev?.total || 0, 
            current: (prev?.current || 0) + 1, 
            currentLabel 
          }));
          
          toast({ 
            title: "Generating", 
            description: `Creating ${currentLabel}...` 
          });

          const marketingInput: GenerateMarketingCopyInput = { 
            keywords: data.keywords,
            contentType: typeValue,
            tone: toneForAI || undefined,
            additionalInstructions: data.additionalInstructions || undefined,
            companyName: data.companyName,
            productDescription: data.productDescription,
          };

          if (typeValue === "social media post" && platformForAI) {
              marketingInput.socialMediaPlatform = platformForAI;
          }
          
          // Add image variations for visual content types
          if (['social media post', 'display ad copy', 'billboard'].includes(typeValue)) {
            if (data.numberOfImageVariations && data.numberOfImageVariations > 1) {
              marketingInput.numberOfImageVariations = data.numberOfImageVariations;
            }
          }
          
          if (typeValue === "tv script") {
              marketingInput.tvScriptLength = tvScriptLengthForAI;
              if (data.numberOfVariations && data.numberOfVariations > 1) {
                marketingInput.numberOfVariations = data.numberOfVariations;
              }
          }
          if (typeValue === "radio script") {
              marketingInput.radioScriptLength = radioScriptLengthForAI;
              if (data.numberOfVariations && data.numberOfVariations > 1) {
                marketingInput.numberOfVariations = data.numberOfVariations;
              }
          }
          if (typeValue === "lead generation email") {
              marketingInput.emailType = emailTypeForAI;
          }

          const result: GenerateMarketingCopyOutput = await generateMarketingCopyAction(marketingInput);
          
          return {
            value: typeValue,
            label: currentLabel,
            marketingCopy: result.marketingCopy,
            imageSuggestion: result.imageSuggestion,
            imageSuggestions: result.imageSuggestions,
            isGeneratingImage: !!(result.imageSuggestion || result.imageSuggestions),
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

      // Use Promise.all to run all generations in parallel for better performance
      const initialResults = await Promise.all(generatePromises);
      console.log('[Form Submit] All generations complete, received results:', initialResults.length);
    
      // Set the initial copy (unedited)
      setGeneratedCopy(initialResults);
      
      // Also initialize the editedCopy state with the generated copy
      const initialEdits: Record<string, string> = {};
      initialResults.forEach(item => {
          if (typeof item.marketingCopy === 'string') {
              initialEdits[item.value] = item.marketingCopy;
          } else if (Array.isArray(item.marketingCopy)) {
              // Check if it's an array of variant objects
              if (isVariantsArray(item.marketingCopy)) {
                  // For variants, join all variant copies
                  initialEdits[item.value] = item.marketingCopy.map((v) => `=== Variant ${v.variant} ===\n${v.copy}`).join('\n\n');
              } else {
                  // For regular arrays (like social media posts)
                  initialEdits[item.value] = item.marketingCopy.join('\n\n');
              }
          }
      });
      setEditedCopy(initialEdits);

      toast({ title: "Marketing Copy Generation Complete!", description: `Finished generating text for ${data.contentType.length} content type(s). Now generating images...` });
      setIsGenerating(false);
      setGenerationProgress(null);
      console.log('[Form Submit] Text generation complete, starting image generation');

      // Track images that need to be generated
      const itemsWithImages = initialResults.filter(item => item.imageSuggestion || item.imageSuggestions);
      if (itemsWithImages.length > 0) {
        toast({ 
          title: "Starting Image Generation", 
          description: `Generating ${itemsWithImages.length} image(s)...` 
        });
      }

      // Now, generate images for items that have a suggestion
      initialResults.forEach(item => {
          // Handle single image
          if (item.imageSuggestion) {
              generateImageAction(item.imageSuggestion)
                  .then(imageDataUri => {
                      setGeneratedCopy((prevCopies: GeneratedCopyItem[]) => 
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
                    setGeneratedCopy((prevCopies: GeneratedCopyItem[]) => 
                        prevCopies.map(copy => 
                            copy.value === item.value 
                            ? { ...copy, isGeneratingImage: false } // Stop loading on error
                            : copy
                        )
                    );
                });
          }
          
          // Handle multiple images
          if (item.imageSuggestions && item.imageSuggestions.length > 0) {
              const imagePromises = item.imageSuggestions.map(suggestion => 
                  generateImageAction(suggestion)
              );
              
              Promise.all(imagePromises)
                  .then(imageDataUris => {
                      setGeneratedCopy((prevCopies: GeneratedCopyItem[]) => 
                          prevCopies.map(copy => 
                              copy.value === item.value 
                              ? { ...copy, generatedImages: imageDataUris, isGeneratingImage: false } 
                              : copy
                          )
                      );
                  })
                  .catch(error => {
                    console.error(`Error generating images for ${item.label}:`, error);
                    toast({
                        title: "Image Generation Failed",
                        description: `Could not generate images for ${item.label}.`,
                        variant: "destructive"
                    });
                    setGeneratedCopy((prevCopies: GeneratedCopyItem[]) => 
                        prevCopies.map(copy => 
                            copy.value === item.value 
                            ? { ...copy, isGeneratingImage: false } 
                            : copy
                        )
                    );
                });
          }
      });
      } catch (error) {
        console.error('[Form Submit] Unexpected error:', error);
        setIsGenerating(false);
        toast({
          title: "Generation Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
      }
    });
  };

  const handleGenerateAudio = async (item: GeneratedCopyItem) => {
    // Get the selected voice name from form data if available
    const voiceName = form.getValues('voiceName');

    // Check if this is a variants array (multiple variations)
    if (Array.isArray(item.marketingCopy) && isVariantsArray(item.marketingCopy)) {
      const variants = item.marketingCopy;
      
      setGeneratedCopy(prev => prev.map(copy => 
        copy.value === item.value ? { ...copy, isGeneratingAudio: true } : copy
      ));

      try {
        const audioUris: string[] = [];
        
        // Generate audio for each variant sequentially
        for (let i = 0; i < variants.length; i++) {
          const variant = variants[i];
          
          toast({
            title: `Generating Audio ${i + 1}/${variants.length}`,
            description: `Processing Variant ${variant.variant}...`,
          });
          
          // Strip production cues before sending to the TTS engine
          const cleanScript = stripProductionCues(variant.copy);
          
          const audioResult = await generateAudioAction({ 
            script: cleanScript, 
            voiceName: voiceName || undefined 
          });
          
          if (!audioResult.success) {
            throw new Error(audioResult.error);
          }
          audioUris.push(audioResult.data);
        }
        
        const updatedItem = { 
          ...item, 
          generatedAudios: audioUris, 
          isGeneratingAudio: false 
        };

        setGeneratedCopy(prev => prev.map(copy => 
          copy.value === item.value ? updatedItem : copy
        ));

        // Auto-open the audio player modal with the first variant
        setActiveAudioItem(updatedItem);

        toast({
          title: "All Audio Generated",
          description: `${audioUris.length} audio files ready. Playing Variant 1...`,
        });

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error generating audio for ${item.label}:`, errorMsg);
        toast({
          title: "Audio Generation Failed",
          description: `${item.label}: ${errorMsg}`,
          variant: "destructive"
        });
        setGeneratedCopy(prev => prev.map(copy => 
          copy.value === item.value ? { ...copy, isGeneratingAudio: false } : copy
        ));
      }
      return;
    }

    // Single copy version (original logic)
    let scriptToProcess = editedCopy[item.value];

    // Ensure we have a valid script to process.
    if (typeof scriptToProcess !== 'string' || !scriptToProcess.trim()) {
        toast({ 
            title: "Invalid Content for Audio", 
            description: "Cannot generate audio. The content is either empty or in a format that cannot be converted to speech (like a podcast outline).", 
            variant: "destructive" 
        });
        return;
    }
    
    // Strip production cues before sending to the TTS engine
    const cleanScript = stripProductionCues(scriptToProcess);

    setGeneratedCopy(prev => prev.map(copy => 
        copy.value === item.value ? { ...copy, isGeneratingAudio: true } : copy
    ));

    try {
        const audioResult = await generateAudioAction({ 
          script: cleanScript, 
          voiceName: voiceName || undefined 
        });

        if (!audioResult.success) {
          throw new Error(audioResult.error);
        }
        
        const updatedItem = { ...item, generatedAudio: audioResult.data, isGeneratingAudio: false };

        setGeneratedCopy(prev => prev.map(copy => 
            copy.value === item.value ? updatedItem : copy
        ));

        // Auto-open the audio player modal immediately after generation
        setActiveAudioItem(updatedItem);

        toast({
          title: "Audio Generated",
          description: `Audio for ${item.label} is ready. Playing now...`,
        });

    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error generating audio for ${item.label}:`, errorMsg);
        toast({
            title: "Audio Generation Failed",
            description: `${item.label}: ${errorMsg}`,
            variant: "destructive"
        });
        setGeneratedCopy(prev => prev.map(copy => 
            copy.value === item.value ? { ...copy, isGeneratingAudio: false } : copy
        ));
    }
  };


  const handleExportTxt = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      exportTextFile(generatedCopy, editedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as a .txt file.`});
    }
  };
  
  const handleExportPdf = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      exportPdf(generatedCopy, editedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as a .pdf file.`});
    } else {
      toast({ title: "No Content", description: "Nothing to export.", variant: "destructive" });
    }
  };

  const handleExportHtml = () => {
    if (generatedCopy && generatedCopy.length > 0) {
      exportHtmlForGoogleDocs(generatedCopy, editedCopy);
      toast({ title: "Copies Exported", description: `All generated copies exported as a .html file for Google Docs.`});
    } else {
      toast({ title: "No Content", description: "Nothing to export.", variant: "destructive" });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-800 selection:bg-primary/20 selection:text-primary">
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 max-w-3xl">
        <header className="mb-6 text-center flex justify-between items-center">
          <div className="w-1/3"></div>
          <div className="w-1/3 flex justify-center">
            <AppLogo />
          </div>
          <div className="w-1/3 flex justify-end items-center gap-2">
             <Link href="/dev-tools" passHref>
                <Button variant="outline" size="sm" className="bg-white border-slate-300 text-slate-900 hover:bg-slate-100">
                  <Terminal className="mr-2 h-4 w-4" />
                  Dev Tools
                </Button>
              </Link>
              <UserMenu />
          </div>
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
            isGenerating={isGenerating}
            isSummarizing={isSummarizing}
           />

          {(isGenerating || isPending) && (
            <div ref={loadingRef}>
            <Card className="shadow-lg rounded-xl overflow-hidden border-primary/50 border-2 animate-pulse">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <p className="text-xl font-semibold text-foreground">AI is generating your content...</p>
                <p className="text-muted-foreground mt-1">This typically takes 30-60 seconds. Please don&apos;t close this page.</p>
                {generationProgress && (
                  <div className="mt-4 w-full max-w-sm">
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{generationProgress.current} / {generationProgress.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="bg-primary h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(5, (generationProgress.current / generationProgress.total) * 100)}%` }}
                      />
                    </div>
                    {generationProgress.currentLabel && (
                      <p className="text-sm text-primary font-medium mt-2">
                        Currently generating: {generationProgress.currentLabel}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}
          {isSummarizing && !isGenerating && (
            <Card className="shadow-lg rounded-xl overflow-hidden border-primary/50 border-2 animate-pulse">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <p className="text-xl font-semibold text-foreground">AI is analyzing your input...</p>
                <p className="text-muted-foreground mt-1">Please wait while we process your data.</p>
              </CardContent>
            </Card>
          )}

          {generatedCopy && generatedCopy.length > 0 && (
            <GeneratedCopyDisplay
              generatedCopy={generatedCopy}
              editedCopy={editedCopy}
              onCopy={handleCopy}
              onEdit={handleCopyEdit}
              onExportTxt={handleExportTxt}
              onExportPdf={handleExportPdf}
              onExportHtml={handleExportHtml}
              onGenerateAudio={handleGenerateAudio}
            />
          )}

          {activeAudioItem && (
             <AlertDialog open={!!activeAudioItem} onOpenChange={(isOpen) => !isOpen && setActiveAudioItem(null)}>
                <AlertDialogContent className="max-w-2xl">
                   <AlertDialogHeader>
                      <AlertDialogTitle>Playing Audio for: {activeAudioItem.label}</AlertDialogTitle>
                   </AlertDialogHeader>
                   <div className="py-4 space-y-4">
                      {activeAudioItem.generatedAudios && activeAudioItem.generatedAudios.length > 1 ? (
                        <Tabs defaultValue="0" className="w-full">
                          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${activeAudioItem.generatedAudios.length}, 1fr)` }}>
                            {activeAudioItem.generatedAudios.map((_, idx) => (
                              <TabsTrigger key={idx} value={idx.toString()}>
                                Variant {idx + 1}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {activeAudioItem.generatedAudios.map((audioUrl, idx) => (
                            <TabsContent key={idx} value={idx.toString()}>
                              <div className="space-y-4">
                                <audio key={audioUrl} src={audioUrl} controls autoPlay={idx === 0} className="w-full">
                                  Your browser does not support the audio element.
                                </audio>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = audioUrl;
                                    link.download = `${activeAudioItem.label.replace(/\s+/g, '-').toLowerCase()}-variant-${idx + 1}-${Date.now()}.wav`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                  className="w-full"
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Variant {idx + 1}
                                </Button>
                              </div>
                            </TabsContent>
                          ))}
                        </Tabs>
                      ) : (
                        <>
                          <audio src={activeAudioItem.generatedAudio} controls autoPlay className="w-full">
                            Your browser does not support the audio element.
                          </audio>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = activeAudioItem.generatedAudio!;
                              link.download = `${activeAudioItem.label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.wav`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="w-full"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Audio
                          </Button>
                        </>
                      )}
                   </div>
                   <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setActiveAudioItem(null)}>Close</AlertDialogCancel>
                   </AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-slate-400 text-sm font-body">
        <p>&copy; {currentYear !== null ? currentYear : '...'} The Calton Group. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function IPBuilderPage() {
    return (
        <ProtectedRoute>
            <Suspense>
                <IPBuilderPageContent />
            </Suspense>
        </ProtectedRoute>
    )
}
