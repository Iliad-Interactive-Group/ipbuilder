
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import jsPDF from 'jspdf';
import { useSearchParams, useRouter } from 'next/navigation';


import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';


import { useToast } from "@/hooks/use-toast";

import { Loader2, FileText, Monitor, Users, Mic, Tv, Podcast, Presentation, LayoutDashboard, Image as ImageIconLucide, Mail } from 'lucide-react';


import type { MarketingBriefBlueprint } from '@/ai/schemas/marketing-brief-schemas';

import { generateMarketingCopy } from '@/ai/flows/generate-marketing-copy';
import type { GenerateMarketingCopyOutput, PodcastOutlineStructure, BlogPostStructure } from '@/ai/flows/generate-marketing-copy';

import AppLogo from '@/components/app-logo';
import DataInputCard from '@/components/page/data-input-card';
import MarketingBriefForm, { MarketingBriefFormData, formSchema } from '@/components/page/marketing-brief-form';
import GeneratedCopyDisplay, { GeneratedCopyItem } from '@/components/page/generated-copy-display';


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

const podcastOutlineToString = (outline: PodcastOutlineStructure): string => {
  let content = `Podcast Episode Outline\n\n`;
  content += `Title: ${outline.episodeTitle}\n`;
  content += `Goal: ${outline.episodeGoal}\n`;
  content += `Target Audience: ${outline.targetAudience}\n`;
  content += `Target Length: ${outline.totalLength}\n\n`;
  content += `--- Introduction (${outline.introduction.duration}) ---\n`;
  content += `Hook: ${outline.introduction.hook}\n`;
  content += `Overview: ${outline.introduction.episodeOverview}\n\n`;

  outline.mainContent.forEach((segment, index) => {
    content += `--- Segment ${index + 1}: ${segment.segmentTitle} (${segment.duration}) ---\n`;
    content += `Key Points:\n${segment.keyPoints.map(p => `  - ${p}`).join('\n')}\n`;
    content += `Talking Points:\n${segment.talkingPoints.map(p => `  - ${p}`).join('\n')}\n`;
    if(segment.supportingMaterial) content += `Supporting Material: ${segment.supportingMaterial}\n`;
    content += `\n`;
  });

  content += `--- Conclusion (${outline.conclusion.duration}) ---\n`;
  content += `Recap: ${outline.conclusion.recap}\n`;
  content += `Call to Action: ${outline.conclusion.callToAction}\n`;
  content += `Teaser: ${outline.conclusion.teaser}\n`;

  return content;
};

const blogPostToString = (post: BlogPostStructure): string => {
    let content = `Blog Post\n\n`;
    content += `Title: ${post.title}\n\n`;
    
    post.sections.forEach(section => {
        content += `--- ${section.heading} ---\n`;
        section.contentItems.forEach(item => {
            if (item.type === 'paragraph') {
                content += `${item.text}\n\n`;
            } else if (item.type === 'list') {
                content += item.items.map(li => `  - ${li}`).join('\n') + '\n\n';
            }
        });
    });

    return content;
};


const exportTextFile = (filenameBase: string, copies: Array<GeneratedCopyItem>) => {
  let textContent = "";
  copies.forEach(copy => {
    textContent += `Content Type: ${copy.label}\n`;
    if (copy.imageSuggestion) {
      textContent += `Image Suggestion: ${copy.imageSuggestion}\n`;
    }
    textContent += `------------------------------------------\n`;
    
    if (copy.value === 'podcast outline' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'episodeTitle' in copy.marketingCopy) {
       textContent += podcastOutlineToString(copy.marketingCopy);
    } else if (copy.value === 'blog post' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'sections' in copy.marketingCopy) {
        textContent += blogPostToString(copy.marketingCopy as BlogPostStructure);
    } else {
       textContent += `${Array.isArray(copy.marketingCopy) ? copy.marketingCopy.join('\n\n') : copy.marketingCopy}\n\n\n`;
    }
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
    if (typeof window !== 'undefined') {

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
    setGeneratedCopy([]);
    toast({ title: "Form Cleared", description: "All inputs and outputs have been cleared." });
  };
  
  const handleCopy = (textToCopy: string | string[] | PodcastOutlineStructure | BlogPostStructure, label: string) => {
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

    for (const promise of generatePromises) {
        const result = await promise;
        setGeneratedCopy(prevCopies => [...prevCopies, result as GeneratedCopyItem]);
    }
    
    toast({ title: "Marketing Copy Generation Complete!", description: `Finished generating copy for ${data.contentType.length} content type(s).` });
    setIsGenerating(false);
    setGenerationProgress(null);
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
        yPosition += (labelLines.length * labelLineHeight) + 2;

        if (copy.imageSuggestion) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'italic');
            const suggestionLineHeight = 10 * lineHeightFactor;
            const suggestionText = `Image Suggestion: ${copy.imageSuggestion}`;
            const suggestionLines = doc.splitTextToSize(suggestionText, maxLineWidth);
            ensureSpace(suggestionLines.length * suggestionLineHeight + 4);
            doc.text(suggestionLines, margin, yPosition);
            yPosition += (suggestionLines.length * suggestionLineHeight) + 5;
        }

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const textLineHeight = 10 * lineHeightFactor;
        
        const marketingText = (copy.value === 'podcast outline' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'episodeTitle' in copy.marketingCopy)
          ? podcastOutlineToString(copy.marketingCopy)
          : (copy.value === 'blog post' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'sections' in copy.marketingCopy)
          ? blogPostToString(copy.marketingCopy as BlogPostStructure)
          : Array.isArray(copy.marketingCopy) ? copy.marketingCopy.join('\n\n') : String(copy.marketingCopy);

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
            h3 { font-size: 1.2em; margin-top: 15px; margin-bottom: 5px; color: #666; }
            h4 { font-size: 1.1em; margin-top: 10px; margin-bottom: 5px; color: #777; }
            p.suggestion { font-style: italic; color: #777; margin-top: -5px; margin-bottom: 10px; }
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
            div.structured-content { border: 1px solid #ddd; padding: 15px; border-radius: 4px; background-color: #fdfdfd; }
            ul { margin-top: 5px; }
            div { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Generated Marketing Copies</h1>
      `;

      generatedCopy.forEach(copy => {
        let marketingText;
        if (copy.value === 'podcast outline' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'episodeTitle' in copy.marketingCopy) {
            const outline = copy.marketingCopy as PodcastOutlineStructure;
            let outlineHtml = `<div class="structured-content"><h3>Podcast: ${outline.episodeTitle.replace(/</g, "&lt;")}</h3>`;
            outlineHtml += `<p><strong>Goal:</strong> ${outline.episodeGoal.replace(/</g, "&lt;")}</p>`;
            outlineHtml += `<p><strong>Audience:</strong> ${outline.targetAudience.replace(/</g, "&lt;")}</p>`;
            outlineHtml += `<h4>Introduction (${outline.introduction.duration.replace(/</g, "&lt;")})</h4><ul><li><strong>Hook:</strong> ${outline.introduction.hook.replace(/</g, "&lt;")}</li><li><strong>Overview:</strong> ${outline.introduction.episodeOverview.replace(/</g, "&lt;")}</li></ul>`;
            outline.mainContent.forEach(seg => {
                outlineHtml += `<h4>Segment: ${seg.segmentTitle.replace(/</g, "&lt;")} (${seg.duration.replace(/</g, "&lt;")})</h4><ul>`;
                seg.keyPoints.forEach(p => outlineHtml += `<li>${p.replace(/</g, "&lt;")}</li>`);
                outlineHtml += `</ul>`;
            });
            outlineHtml += `<h4>Conclusion (${outline.conclusion.duration.replace(/</g, "&lt;")})</h4><ul><li><strong>Recap:</strong> ${outline.conclusion.recap.replace(/</g, "&lt;")}</li><li><strong>CTA:</strong> ${outline.conclusion.callToAction.replace(/</g, "&lt;")}</li><li><strong>Teaser:</strong> ${outline.conclusion.teaser.replace(/</g, "&lt;")}</li></ul>`;
            outlineHtml += `</div>`;
            marketingText = outlineHtml;
        } else if (copy.value === 'blog post' && typeof copy.marketingCopy === 'object' && !Array.isArray(copy.marketingCopy) && 'sections' in copy.marketingCopy) {
            const post = copy.marketingCopy as BlogPostStructure;
            let postHtml = `<div class="structured-content"><h3>Blog Post: ${post.title.replace(/</g, "&lt;")}</h3>`;
            post.sections.forEach(section => {
                postHtml += `<h4>${section.heading.replace(/</g, "&lt;")}</h4>`;
                section.contentItems.forEach(item => {
                    if (item.type === 'paragraph') {
                        postHtml += `<p>${item.text.replace(/</g, "&lt;")}</p>`;
                    } else if (item.type === 'list') {
                        postHtml += `<ul>${item.items.map(li => `<li>${li.replace(/</g, "&lt;")}</li>`).join('')}</ul>`;
                    }
                });
            });
            postHtml += '</div>';
            marketingText = postHtml;
        } else {
            const rawText = Array.isArray(copy.marketingCopy) ? copy.marketingCopy.join('<br><br>') : String(copy.marketingCopy);
            marketingText = `<pre>${rawText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
        }
        
        htmlContent += `
          <div>
            <h2>Content Type: ${copy.label}</h2>
        `;
        if (copy.imageSuggestion) {
            htmlContent += `<p class="suggestion"><b>Image Suggestion:</b> ${copy.imageSuggestion.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`;
        }
        htmlContent += marketingText;
        htmlContent += `</div>`;
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

          {generatedCopy && generatedCopy.length > 0 && (
            <GeneratedCopyDisplay
              generatedCopy={generatedCopy}
              onCopy={handleCopy}
              onExportTxt={handleExportTxt}
              onExportPdf={handleExportPdf}
              onExportHtml={handleExportHtmlForGoogleDocs}
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
        <Suspense fallback={<div>Loading...</div>}>
            <IPBuilderPageContent />
        </Suspense>
    )
}
