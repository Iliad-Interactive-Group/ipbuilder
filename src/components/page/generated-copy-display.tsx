
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
import { isVariantsArray, VariantCopy } from '@/lib/variant-utils';


export interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string | string[] | PodcastOutlineStructure | BlogPostStructure | VariantCopy[];
  imageSuggestion?: string;
  imageSuggestions?: string[];
  isError?: boolean;
  isGeneratingImage?: boolean;
  generatedImage?: string;
  generatedImages?: string[];
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
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                Click to edit the copy below. Changes will be automatically saved and used for audio generation.
            </p>
            <Textarea 
                value={currentText} 
                onChange={handleTextChange}
                rows={getRowsForContentType(item.value)} 
                className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50 hover:border-primary/50 transition-colors"
                placeholder="Edit your copy here..."
            />
        </div>
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
                          {hasVariants && <span className="ml-2 text-sm text-muted-foreground">({(item.marketingCopy as VariantCopy[]).length} variations)</span>}
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
                             <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(item.marketingCopy as VariantCopy[]).length}, 1fr)` }}>
                               {(item.marketingCopy as VariantCopy[]).map((v) => (
                                 <TabsTrigger key={v.variant} value={v.variant.toString()}>
                                   Variant {v.variant}
                                 </TabsTrigger>
                               ))}
                             </TabsList>
                             {(item.marketingCopy as VariantCopy[]).map((v) => (
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
                        
                        {/* Single image display */}
                        {item.imageSuggestion && !item.imageSuggestions && (
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
                                        Failed to generate image. Please try again or check your internet connection.
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Multiple images display */}
                        {item.imageSuggestions && item.imageSuggestions.length > 0 && (
                            <div className="p-3 bg-accent/20 border-l-4 border-accent text-accent-foreground rounded-r-md space-y-3">
                                <div>
                                    <p className="font-semibold flex items-center text-sm">
                                        <Lightbulb className="w-4 h-4 mr-2"/>
                                        Image Variations for A/B Testing
                                    </p>
                                </div>
                                {item.isGeneratingImage ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {item.imageSuggestions.map((_, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <Skeleton className="h-[256px] w-full rounded-md" />
                                                <p className="text-xs text-center text-muted-foreground">Variant {idx + 1}</p>
                                            </div>
                                        ))}
                                        <p className="col-span-2 text-xs text-center text-muted-foreground animate-pulse">Generating images...</p>
                                    </div>
                                ) : item.generatedImages && item.generatedImages.length > 0 ? (
                                    <Tabs defaultValue="0" className="w-full">
                                      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${item.generatedImages.length}, 1fr)` }}>
                                        {item.generatedImages.map((_, idx) => (
                                          <TabsTrigger key={idx} value={idx.toString()}>
                                            Variant {idx + 1}
                                          </TabsTrigger>
                                        ))}
                                      </TabsList>
                                      {item.generatedImages.map((imgUrl, idx) => (
                                        <TabsContent key={idx} value={idx.toString()}>
                                          <div className="space-y-2">
                                            <p className="text-sm italic">{item.imageSuggestions![idx]}</p>
                                            <Image 
                                              src={imgUrl} 
                                              alt={item.imageSuggestions![idx]}
                                              width={512}
                                              height={512}
                                              className="rounded-lg border-2 border-border object-cover w-full"
                                              data-ai-hint="generated image"
                                            />
                                          </div>
                                        </TabsContent>
                                      ))}
                                    </Tabs>
                                ) : (
                                    <div className="p-4 bg-destructive/10 text-destructive text-center text-sm rounded-md">
                                        Failed to generate image variations. Please try again or check your internet connection.
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
                            <div className="w-full space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => onGenerateAudio({ ...item, marketingCopy: editedCopy[item.value] || item.marketingCopy })} 
                                      disabled={item.isGeneratingAudio}
                                      className="w-auto"
                                    >
                                        {item.isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="w-3 h-3 mr-2" />}
                                        {item.isGeneratingAudio ? 'Generating...' : (item.generatedAudio ? 'Regenerate Audio Spec' : 'Generate Audio Spec')}
                                    </Button>
                                    {item.generatedAudio && !item.isGeneratingAudio && (
                                      <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = item.generatedAudio!;
                                          link.download = `${item.label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.wav`;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                        className="w-auto"
                                      >
                                        <Download className="w-3 h-3 mr-2" />
                                        Download Audio
                                      </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  💡 Audio will be generated from your edited copy above. Make sure to finalize your edits first.
                                </p>
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

    