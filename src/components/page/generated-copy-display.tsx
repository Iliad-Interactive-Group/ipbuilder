
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, FileText, Lightbulb, Volume2, Loader2, Info } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { PodcastOutlineStructure, BlogPostStructure } from '@/ai/flows/generate-marketing-copy';
import PodcastOutlineDisplay from './podcast-outline-display';
import BlogPostDisplay from './blog-post-display';
import { CONTENT_TYPES } from '@/lib/content-types';


export interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string | string[] | PodcastOutlineStructure | BlogPostStructure | Array<{variant: number, copy: any}>;
  imageSuggestion?: string;
  isError?: boolean;
  isGeneratingImage?: boolean;
  generatedImage?: string;
  isGeneratingAudio?: boolean;
  generatedAudio?: string;
}

interface GeneratedCopyDisplayProps {
  generatedCopy: GeneratedCopyItem[] | null;
  editedCopy: Record<string, string>;
  onCopy: (textToCopy: any, label: string) => void;
  onEdit: (itemValue: string, newText: string) => void;
  onExportTxt: () => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onGenerateAudio: (item: GeneratedCopyItem) => void;
}

const EditableTextDisplay: React.FC<{
  item: GeneratedCopyItem;
  editedText: string | undefined;
  onEdit: (newText: string) => void;
}> = ({ item, editedText, onEdit }) => {
    
    const [currentText, setCurrentText] = useState(editedText || '');

    useEffect(() => {
        // This effect ensures the textarea updates if the underlying prop changes
        // For example, when a new generation happens.
        const initialText = editedText || (Array.isArray(item.marketingCopy) ? item.marketingCopy.join('\n\n') : String(item.marketingCopy));
        setCurrentText(initialText);
    }, [editedText, item.marketingCopy]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setCurrentText(newText);
        onEdit(newText);
    };

    const getRowsForContentType = (contentTypeValue: string) => {
        switch (contentTypeValue) {
            case 'website wireframe': return 20;
            case 'blog post': return 25;
            default: return 8;
        }
    };
    
    return (
        <Textarea 
            value={currentText} 
            onChange={handleTextChange}
            rows={getRowsForContentType(item.value)} 
            className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50"
        />
    );
};


const GeneratedCopyDisplay: React.FC<GeneratedCopyDisplayProps> = ({
  generatedCopy,
  editedCopy,
  onCopy,
  onEdit,
  onExportTxt,
  onExportPdf,
  onExportHtml,
  onGenerateAudio,
}) => {
  if (!generatedCopy || generatedCopy.length === 0) {
    return null;
  }

  const isAudioContent = (item: GeneratedCopyItem) => {
    return ['radio script', 'tv script'].includes(item.value);
  }

  const isEditableContent = (item: GeneratedCopyItem) => {
    return typeof item.marketingCopy === 'string' || Array.isArray(item.marketingCopy);
  };
  
  const isVariantsArray = (marketingCopy: any): marketingCopy is Array<{variant: number, copy: any}> => {
    return Array.isArray(marketingCopy) && 
           marketingCopy.length > 0 && 
           typeof marketingCopy[0] === 'object' && 
           'variant' in marketingCopy[0] && 
           'copy' in marketingCopy[0];
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Generated Marketing Copies</CardTitle>
          <CardDescription>Review your AI-generated marketing copies below. You can edit the text and regenerate audio for scripts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={generatedCopy.map(item => item.value)} className="w-full space-y-2">
            {generatedCopy.map((item) => {
              const isPodcast = item.value === 'podcast outline' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'episodeTitle' in item.marketingCopy;
              const isBlogPost = item.value === 'blog post' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'sections' in item.marketingCopy;
              const hasVariants = isVariantsArray(item.marketingCopy);
              const Icon = CONTENT_TYPES.find(ct => ct.value === item.value)?.icon || FileText;
              
              return (
                <AccordionItem value={item.value} key={item.value} className="border bg-background/50 rounded-lg px-4">
                   <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                     <div className="flex items-center justify-between w-full">
                        <span className="flex items-center">
                          <Icon className="w-5 h-5 mr-3" />
                          {item.label}
                          {hasVariants && <span className="ml-2 text-sm text-muted-foreground">({item.marketingCopy.length} variations)</span>}
                        </span>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent className="pt-2">
                      <div className="space-y-4">
                        {item.isError ? (
                           <div className="p-3 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground rounded-r-md">
                                <p className="font-semibold flex items-center text-sm">
                                    <Info className="w-4 h-4 mr-2"/>
                                    Content Generation Failed
                                </p>
                                <p className="text-sm pl-6">{String(item.marketingCopy)}</p>
                           </div>
                        ) : isPodcast ? (
                           <PodcastOutlineDisplay outline={item.marketingCopy as PodcastOutlineStructure} />
                        ) : isBlogPost ? (
                           <BlogPostDisplay post={item.marketingCopy as BlogPostStructure} />
                        ) : hasVariants ? (
                           <Tabs defaultValue="1" className="w-full">
                             <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${item.marketingCopy.length}, 1fr)` }}>
                               {item.marketingCopy.map((v: any) => (
                                 <TabsTrigger key={v.variant} value={v.variant.toString()}>
                                   Variant {v.variant}
                                 </TabsTrigger>
                               ))}
                             </TabsList>
                             {item.marketingCopy.map((v: any) => (
                               <TabsContent key={v.variant} value={v.variant.toString()}>
                                 <Textarea 
                                   value={v.copy} 
                                   readOnly
                                   rows={8} 
                                   className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50"
                                 />
                               </TabsContent>
                             ))}
                           </Tabs>
                        ) : isEditableContent(item) ? (
                           <EditableTextDisplay 
                                item={item} 
                                editedText={editedCopy[item.value]} 
                                onEdit={(newText) => onEdit(item.value, newText)}
                           />
                        ) : null}
                        
                        {item.imageSuggestion && (
                            <div className="p-3 bg-accent/20 border-l-4 border-accent text-accent-foreground rounded-r-md space-y-3">
                                <div>
                                    <p className="font-semibold flex items-center text-sm">
                                        <Lightbulb className="w-4 h-4 mr-2"/>
                                        Image Suggestion
                                    </p>
                                    <p className="text-sm italic pl-6">{item.imageSuggestion}</p>
                                </div>
                                {item.isGeneratingImage ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-[256px] w-full rounded-md" />
                                        <p className="text-xs text-center text-muted-foreground animate-pulse">Generating image...</p>
                                    </div>
                                ) : item.generatedImage ? (
                                    <Image 
                                      src={item.generatedImage} 
                                      alt={item.imageSuggestion}
                                      width={512}
                                      height={512}
                                      className="rounded-lg border-2 border-border object-cover w-full"
                                      data-ai-hint="generated image"
                                    />
                                ) : (
                                    <div className="p-4 bg-destructive/10 text-destructive text-center text-sm rounded-md">
                                        Image generation failed.
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 items-center">
                          {!isPodcast && !isBlogPost && !item.isError && (
                            <Button variant="outline" size="sm" onClick={() => onCopy(editedCopy[item.value] || item.marketingCopy, item.label)} className="w-full sm:w-auto">
                              <Copy className="w-3 h-3 mr-2" />
                              Copy {item.label}
                            </Button>
                          )}

                          {isAudioContent(item) && !item.isError && (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => onGenerateAudio(item)} 
                                  disabled={item.isGeneratingAudio}
                                  className="w-auto"
                                >
                                    {item.isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="w-3 h-3 mr-2" />}
                                    {item.isGeneratingAudio ? 'Generating...' : (item.generatedAudio ? 'Regenerate Audio Spec' : 'Generate Audio Spec')}
                                </Button>
                            </div>
                          )}
                        </div>
                      </div>
                   </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={onExportTxt} disabled={!generatedCopy || generatedCopy.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export All (TXT)
          </Button>
          <Button onClick={onExportPdf} disabled={!generatedCopy || generatedCopy.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export All (PDF)
          </Button>
          <Button onClick={onExportHtml} disabled={!generatedCopy || generatedCopy.length === 0} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Export All (HTML for Google Docs)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default GeneratedCopyDisplay;

    