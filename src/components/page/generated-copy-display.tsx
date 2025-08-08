
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, Copy, FileText, Lightbulb, Volume2, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { PodcastOutlineStructure, BlogPostStructure } from '@/ai/flows/generate-marketing-copy';
import PodcastOutlineDisplay from './podcast-outline-display';
import BlogPostDisplay from './blog-post-display';
import { CONTENT_TYPES } from '@/lib/content-types';


export interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string | string[] | PodcastOutlineStructure | BlogPostStructure;
  imageSuggestion?: string;
  isError?: boolean;
  isGeneratingImage?: boolean;
  generatedImage?: string;
  isGeneratingAudio?: boolean;
  generatedAudio?: string;
}

interface GeneratedCopyDisplayProps {
  generatedCopy: GeneratedCopyItem[] | null;
  onCopy: (textToCopy: any, label: string) => void;
  onExportTxt: () => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onGenerateAudio: (item: GeneratedCopyItem) => void;
}

const GeneratedCopyDisplay: React.FC<GeneratedCopyDisplayProps> = ({
  generatedCopy,
  onCopy,
  onExportTxt,
  onExportPdf,
  onExportHtml,
  onGenerateAudio,
}) => {
  if (!generatedCopy || generatedCopy.length === 0) {
    return null;
  }

  const getRowsForContentType = (contentTypeValue: string) => {
    switch (contentTypeValue) {
      case 'website wireframe':
        return 20;
      case 'blog post':
          return 25;
      default:
        return 8;
    }
  };

  const isAudioContent = (item: GeneratedCopyItem) => {
    return ['radio script', 'tv script'].includes(item.value);
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Generated Marketing Copies</CardTitle>
          <CardDescription>Review your AI-generated marketing copies below. Click each section to expand.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={generatedCopy.map(item => item.value)} className="w-full space-y-2">
            {generatedCopy.map((item) => {
              const isPodcast = item.value === 'podcast outline' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'episodeTitle' in item.marketingCopy;
              const isBlogPost = item.value === 'blog post' && typeof item.marketingCopy === 'object' && !Array.isArray(item.marketingCopy) && 'sections' in item.marketingCopy;
              const isStructuredContent = isPodcast || isBlogPost;
              const copyText = isStructuredContent ? '' : (Array.isArray(item.marketingCopy) ? item.marketingCopy.join("\n\n") : String(item.marketingCopy));
              
              const Icon = CONTENT_TYPES.find(ct => ct.value === item.value)?.icon || FileText;
              
              return (
                <AccordionItem value={item.value} key={item.value} className="border bg-background/50 rounded-lg px-4">
                   <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
                     <div className="flex items-center justify-between w-full">
                        <span className="flex items-center">
                          <Icon className="w-5 h-5 mr-3" />
                          {item.label}
                        </span>
                     </div>
                   </AccordionTrigger>
                   <AccordionContent className="pt-2">
                      <div className="space-y-4">
                        {isPodcast ? (
                           <PodcastOutlineDisplay outline={item.marketingCopy as PodcastOutlineStructure} />
                        ) : isBlogPost ? (
                            <BlogPostDisplay post={item.marketingCopy as BlogPostStructure} />
                        ) : (
                          <Textarea value={copyText} readOnly rows={getRowsForContentType(item.value)} className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50"/>
                        )}
                        
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
                          {!isStructuredContent && (
                            <Button variant="outline" size="sm" onClick={() => onCopy(item.marketingCopy, item.label)} className="w-full sm:w-auto">
                              <Copy className="w-3 h-3 mr-2" />
                              Copy {item.label}
                            </Button>
                          )}

                          {isAudioContent(item) && (
                            <div className="w-full sm:w-auto">
                                {!item.generatedAudio && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => onGenerateAudio(item)} 
                                    disabled={item.isGeneratingAudio}
                                    className="w-full"
                                  >
                                      {item.isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="w-3 h-3 mr-2" />}
                                      {item.isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
                                  </Button>
                                )}
                                {item.generatedAudio && (
                                  <audio controls src={item.generatedAudio} className="w-full">
                                    Your browser does not support the audio element.
                                  </audio>
                                )}
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
