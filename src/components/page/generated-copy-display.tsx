
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, FileText, Lightbulb, Volume2, Loader2, Info, Pencil, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { PodcastOutlineStructure, BlogPostStructure, BillboardAdStructure, DisplayAdVariation, LandingPageStructure, WebsitePageStructure, WireframeSiteStructure } from '@/ai/flows/generate-marketing-copy';
import { validateGeneratedText, type BusinessFacts, type ValidationWarning } from '@/lib/validation-utils';
import PodcastOutlineDisplay from './podcast-outline-display';
import BlogPostDisplay from './blog-post-display';
import { CONTENT_TYPES } from '@/lib/content-types';
import { isVariantsArray, VariantCopy } from '@/lib/variant-utils';


export interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string | string[] | PodcastOutlineStructure | BlogPostStructure | BlogPostStructure[] | BillboardAdStructure | DisplayAdVariation[] | LandingPageStructure | WebsitePageStructure[] | WireframeSiteStructure | VariantCopy[];
  imageSuggestion?: string;
  imageSuggestions?: string[];
  isError?: boolean;
  isGeneratingImage?: boolean;
  generatedImage?: string;
  generatedImages?: string[];
  isGeneratingAudio?: boolean;
  generatedAudio?: string;
  generatedAudios?: string[]; // Multiple audio files for variants
}

interface GeneratedCopyDisplayProps {
  generatedCopy: GeneratedCopyItem[] | null;
  editedCopy: Record<string, string>;
  onCopy: (textToCopy: any, label: string) => void;
  onEdit: (itemValue: string, newText: string) => void;
  onEditBillboard: (itemValue: string, field: keyof BillboardAdStructure, value: string) => void;
  onExportTxt: () => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onGenerateAudio: (item: GeneratedCopyItem) => void;
  businessFacts?: BusinessFacts;
}


// NEW Helper Component for the updated Blog format
const SingleBlogPostDisplay: React.FC<{ post: BlogPostStructure }> = ({ post }) => (
  <div className="space-y-6 text-left animate-in fade-in duration-500">
    <div className="border-b pb-4">
      <div className="flex justify-between items-start mb-2">
         <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase border border-border px-2 py-1 rounded">
            {post.topic_theme || "Blog Post"}
         </span>
      </div>
      <h3 className="text-3xl font-bold text-primary mb-3 leading-tight">{post.title}</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {post.seoKeywords && post.seoKeywords.map((kw, i) => (
          <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">#{kw}</span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/50 pl-3">
        Meta: {post.metaDescription}
      </p>
    </div>

    {/* LLM Optimization Section - The "Zero Click" Answer */}
    {post.keyTakeaways && (
       <div className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm">
          <h4 className="text-xs font-black text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-widest flex items-center">
             <Lightbulb className="w-4 h-4 mr-2" />
             AI Snapshot / Key Takeaways
          </h4>
          <ul className="space-y-2">
             {post.keyTakeaways.map((pt, i) => (
                <li key={i} className="text-sm text-foreground/90 flex items-start">
                    <span className="mr-2 text-blue-500">•</span> {pt}
                </li>
             ))}
          </ul>
       </div>
    )}

    <div className="space-y-8 mt-6">
      {post.sections.map((section, idx) => (
        <div key={idx} className="prose dark:prose-invert max-w-none">
          <h4 className="text-xl font-bold mb-3">{section.heading}</h4>
          <div className="text-muted-foreground whitespace-pre-line leading-relaxed space-y-4">
            {section.contentItems.map((item, itemIdx) => {
                if (item.paragraph) return <p key={itemIdx}>{item.paragraph}</p>;
                if (item.listItems) return (
                    <ul key={itemIdx} className="list-disc pl-5 space-y-2">
                        {item.listItems.map((li, liIdx) => <li key={liIdx}>{li}</li>)}
                    </ul>
                );
                return null;
            })}
          </div>
        </div>
      ))}
    </div>

    {/* FAQ Schema Section */}
    {post.faqSnippet && (
        <div className="mt-10 pt-6 border-t border-dashed">
            <h4 className="font-semibold text-lg mb-3 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                People Also Ask (Schema Ready)
            </h4>
            <div className="bg-muted/50 p-5 rounded-lg border">
                <p className="font-bold text-foreground mb-2">Q: {post.faqSnippet.question}</p>
                <p className="text-sm text-muted-foreground">A: {post.faqSnippet.answer}</p>
            </div>
        </div>
    )}
  </div>
);

// Word count helper
const countWords = (text: string): number => text.trim().split(/\s+/).filter(w => w.length > 0).length;

// Word count badge component
const WordCountBadge: React.FC<{ text: string; limit: number }> = ({ text, limit }) => {
  const count = countWords(text);
  const isOver = count > limit;
  const isClose = count === limit;
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
      isOver ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
      isClose ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
    }`}>
      {count}/{limit} words
    </span>
  );
};

// Validation warnings display component
const ValidationWarnings: React.FC<{ warnings: ValidationWarning[] }> = ({ warnings }) => {
  if (warnings.length === 0) return null;
  return (
    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" /> Factual Data Warnings
      </p>
      {warnings.map((w, i) => (
        <p key={i} className="text-xs text-yellow-800 dark:text-yellow-300">
          {w.type === 'fabricated_url' && `Potential fabricated URL found: "${w.found}" — No website URL was provided in the form.`}
          {w.type === 'wrong_url' && `URL mismatch: Found "${w.found}" but expected "${w.expected}".`}
          {w.type === 'fabricated_phone' && `Potential fabricated phone found: "${w.found}" — No phone number was provided in the form.`}
          {w.type === 'wrong_phone' && `Phone mismatch: Found "${w.found}" but expected "${w.expected}".`}
        </p>
      ))}
    </div>
  );
};

// Editable Billboard Ad display component
const EditableBillboardAdDisplay: React.FC<{
  ad: BillboardAdStructure;
  onFieldChange: (field: keyof BillboardAdStructure, value: string) => void;
  businessFacts?: BusinessFacts;
}> = ({ ad, onFieldChange, businessFacts }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Compute validation warnings from all text fields
  const allText = `${ad.headline} ${ad.subheadline} ${ad.cta}`;
  const warnings = businessFacts ? validateGeneratedText(allText, businessFacts) : [];

  const EditableField: React.FC<{
    fieldKey: keyof BillboardAdStructure;
    value: string;
    label: string;
    wordLimit?: number;
    className?: string;
    inputType?: 'input' | 'textarea';
  }> = ({ fieldKey, value, label, wordLimit, className = '', inputType = 'input' }) => {
    const isEditing = editingField === fieldKey;
    
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-xs uppercase tracking-wider text-slate-400">{label}</p>
          {wordLimit && <WordCountBadge text={value} limit={wordLimit} />}
          {!isEditing && (
            <button 
              onClick={() => setEditingField(fieldKey)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title={`Edit ${label}`}
            >
              <Pencil className="w-3 h-3 text-slate-400 hover:text-white" />
            </button>
          )}
        </div>
        {isEditing ? (
          inputType === 'textarea' ? (
            <Textarea
              value={value}
              onChange={(e) => onFieldChange(fieldKey, e.target.value)}
              onBlur={() => setEditingField(null)}
              rows={3}
              autoFocus
              className={`bg-slate-700/80 border-amber-400/50 text-white text-sm focus:ring-amber-400 ${className}`}
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onFieldChange(fieldKey, e.target.value)}
              onBlur={() => setEditingField(null)}
              autoFocus
              className={`bg-slate-700/80 border-amber-400/50 text-white focus:ring-amber-400 ${className}`}
            />
          )
        ) : (
          <div 
            onClick={() => setEditingField(fieldKey)}
            className={`cursor-pointer hover:bg-slate-700/50 rounded px-1 -mx-1 transition-colors ${className}`}
          >
            {value || <span className="italic text-slate-500">Click to edit...</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 text-left animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Billboard Concept</p>
          <p className="text-xs text-slate-500 flex items-center gap-1"><Pencil className="w-3 h-3" /> Click any field to edit</p>
        </div>
        <EditableField 
          fieldKey="headline" 
          value={ad.headline} 
          label="Headline" 
          wordLimit={7}
          className="text-4xl font-extrabold leading-tight tracking-tight"
        />
        <div className="mt-3">
          <EditableField 
            fieldKey="subheadline" 
            value={ad.subheadline} 
            label="Subheadline" 
            wordLimit={10}
            className="text-lg text-slate-300 leading-relaxed"
          />
        </div>
        <div className="mt-6">
          <EditableField 
            fieldKey="cta" 
            value={ad.cta} 
            label="Call to Action" 
            wordLimit={5}
            className="inline-block bg-amber-400 text-slate-900 font-bold px-6 py-2.5 rounded-lg text-sm uppercase tracking-wider"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-muted/50 rounded-lg p-4 border group">
          <EditableField
            fieldKey="visualNotes"
            value={ad.visualNotes}
            label="Visual Notes"
            inputType="textarea"
            className="text-foreground"
          />
        </div>
        <div className="bg-muted/50 rounded-lg p-4 border group">
          <EditableField
            fieldKey="overallConcept"
            value={ad.overallConcept}
            label="Overall Concept"
            inputType="textarea"
            className="text-foreground"
          />
        </div>
      </div>
      <ValidationWarnings warnings={warnings} />
    </div>
  );
};

// Display Ad variation card
const DisplayAdVariationCard: React.FC<{ variation: DisplayAdVariation; index: number; total: number }> = ({ variation, index, total }) => (
  <div className="border rounded-xl p-5 bg-card shadow-sm space-y-3 animate-in fade-in duration-500">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
        Variation {index + 1} of {total}
      </span>
    </div>
    <h3 className="text-xl font-bold text-foreground leading-snug">{variation.headline}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{variation.body}</p>
    <div className="flex items-center gap-3 pt-2">
      <span className="inline-block bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded-md text-xs uppercase tracking-wide">
        {variation.cta}
      </span>
    </div>
    <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
      <span className="font-semibold">Visual Notes:</span> {variation.visualNotes}
    </div>
  </div>
);

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

    // Calculate word count and estimated duration
    // Standard speaking rate is ~130-150 wpm.
    // For radio/AI TTS with pauses, ~2.2 words/sec is a good estimator.
    const wordCount = currentText.trim().split(/\s+/).filter(w => w.length > 0).length;
    const estimatedDuration = Math.round(wordCount / 2.2);
    
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Click to edit. Changes save automatically.
                </p>
                {['radio script', 'tv script'].includes(item.value) && (
                    <div className={`text-xs font-medium px-2 py-1 rounded-md ${estimatedDuration > 30 ? 'bg-yellow-100 text-yellow-800' : 'bg-muted text-muted-foreground'}`}>
                        {wordCount} words ≈ {estimatedDuration}s
                        {estimatedDuration > 30 && estimatedDuration < 60 && " (Aim for ~60-65 words for 30s)"}
                    </div>
                )}
            </div>
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


// Landing Page Display component
const LandingPageDisplay: React.FC<{ page: LandingPageStructure }> = ({ page }) => (
  <div className="space-y-6 text-left animate-in fade-in duration-500">
    {/* Hero Section */}
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8 border border-primary/20">
      <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-3">Hero Section</p>
      <h2 className="text-3xl font-extrabold text-foreground leading-tight mb-3">{page.headline}</h2>
      <p className="text-lg text-muted-foreground leading-relaxed mb-5">{page.subheadline}</p>
      <span className="inline-block bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-lg text-sm uppercase tracking-wider">
        {page.heroCtaText}
      </span>
      {page.heroCtaDestination && (
        <p className="text-xs text-muted-foreground mt-2">Links to: {page.heroCtaDestination}</p>
      )}
    </div>

    {/* Problem / Solution */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-6 border border-red-100 dark:border-red-900">
        <p className="text-xs font-bold uppercase tracking-widest text-red-500 dark:text-red-400 mb-3">Problem</p>
        <p className="text-sm text-foreground/90 leading-relaxed">{page.problemStatement}</p>
      </div>
      <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-6 border border-green-100 dark:border-green-900">
        <p className="text-xs font-bold uppercase tracking-widest text-green-500 dark:text-green-400 mb-3">Solution</p>
        <p className="text-sm text-foreground/90 leading-relaxed">{page.solutionOverview}</p>
      </div>
    </div>

    {/* Features */}
    {page.features && page.features.length > 0 && (
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Key Features & Benefits</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {page.features.map((feat, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-card shadow-sm">
              <h4 className="font-bold text-sm text-foreground mb-1">{feat.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Social Proof */}
    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-6 border border-blue-100 dark:border-blue-900 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2">Social Proof</p>
      <p className="text-sm text-foreground italic leading-relaxed">{page.socialProof}</p>
    </div>

    {/* Urgency */}
    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800 text-center">
      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">{page.urgencyElement}</p>
    </div>

    {/* Final CTA */}
    <div className="text-center py-4">
      <span className="inline-block bg-primary text-primary-foreground font-bold px-8 py-3 rounded-lg text-base uppercase tracking-wider">
        {page.finalCtaText}
      </span>
      {page.finalCtaDestination && (
        <p className="text-xs text-muted-foreground mt-2">Links to: {page.finalCtaDestination}</p>
      )}
    </div>

    {/* Design Notes + Meta */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="bg-muted/50 rounded-lg p-4 border">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Design Notes</p>
        <p className="text-foreground text-sm">{page.designNotes}</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 border">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">SEO</p>
        <p className="text-foreground text-sm"><strong>Title:</strong> {page.metaTitle}</p>
        <p className="text-foreground text-sm"><strong>Meta:</strong> {page.metaDescription}</p>
      </div>
    </div>
  </div>
);

// Standard Website Page section display
const WebsitePageSectionDisplay: React.FC<{ section: WebsitePageStructure['sections'][0] }> = ({ section }) => (
  <div className="border rounded-lg p-4 bg-card shadow-sm">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{section.sectionType}</span>
    </div>
    <h4 className="font-bold text-foreground mb-1">{section.heading}</h4>
    {section.subheading && <p className="text-sm text-muted-foreground italic mb-2">{section.subheading}</p>}
    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{section.bodyContent}</p>
    {section.ctaText && (
      <div className="mt-3">
        <span className="inline-block bg-primary/10 text-primary font-semibold px-3 py-1 rounded text-xs">
          {section.ctaText}
        </span>
        {section.ctaDestination && <span className="text-xs text-muted-foreground ml-2">→ {section.ctaDestination}</span>}
      </div>
    )}
    {section.designNotes && (
      <p className="text-xs text-muted-foreground mt-2 italic border-t pt-2">Design: {section.designNotes}</p>
    )}
  </div>
);

// Standard 5-Page Website Display component (tabbed)
const StandardWebsiteDisplay: React.FC<{ pages: WebsitePageStructure[] }> = ({ pages }) => (
  <div className="space-y-4 text-left animate-in fade-in duration-500">
    <Tabs defaultValue={pages[0]?.pageSlug || '/'} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(pages.length, 5)}, 1fr)` }}>
        {pages.map((page) => (
          <TabsTrigger key={page.pageSlug} value={page.pageSlug} className="text-xs py-2">
            {page.pageName}
          </TabsTrigger>
        ))}
      </TabsList>
      {pages.map((page) => (
        <TabsContent key={page.pageSlug} value={page.pageSlug} className="mt-0 p-6 border rounded-xl bg-card shadow-sm">
          <div className="mb-6 border-b pb-4">
            <h3 className="text-2xl font-bold text-foreground mb-2">{page.pageName}</h3>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-2 py-0.5 rounded">{page.pageSlug}</span>
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              <p><strong>Meta Title:</strong> {page.metaTitle}</p>
              <p><strong>Meta Desc:</strong> {page.metaDescription}</p>
            </div>
          </div>
          <div className="space-y-4">
            {page.sections.map((section, idx) => (
              <WebsitePageSectionDisplay key={idx} section={section} />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  </div>
);

// Website Wireframe Display component (blueprint-style)
const WebsiteWireframeDisplay: React.FC<{ wireframe: WireframeSiteStructure }> = ({ wireframe }) => (
  <div className="space-y-6 text-left animate-in fade-in duration-500">
    {/* Navigation */}
    <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-5 border-2 border-dashed border-slate-300 dark:border-slate-700">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Site Navigation</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-slate-300 dark:bg-slate-600 px-3 py-1 rounded text-xs font-bold">[LOGO]</span>
          <span className="text-xs text-muted-foreground">{wireframe.siteNavigation.logoPosition}</span>
        </div>
        <div className="flex items-center gap-3">
          {wireframe.siteNavigation.menuItems.map((item, idx) => (
            <span key={idx} className="text-xs font-medium text-foreground bg-white dark:bg-slate-800 px-2 py-1 rounded border">{item}</span>
          ))}
          {wireframe.siteNavigation.ctaButton && (
            <span className="text-xs font-bold text-white bg-primary px-3 py-1 rounded">{wireframe.siteNavigation.ctaButton}</span>
          )}
        </div>
      </div>
    </div>

    {/* Pages */}
    <Tabs defaultValue={wireframe.pages[0]?.pageSlug || '/'} className="w-full">
      <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Math.min(wireframe.pages.length, 5)}, 1fr)` }}>
        {wireframe.pages.map((page) => (
          <TabsTrigger key={page.pageSlug} value={page.pageSlug} className="text-xs py-2">
            {page.pageName}
          </TabsTrigger>
        ))}
      </TabsList>
      {wireframe.pages.map((page) => (
        <TabsContent key={page.pageSlug} value={page.pageSlug} className="mt-0">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground mb-2">{page.pageName} <span className="text-xs font-mono text-muted-foreground">{page.pageSlug}</span></h3>
            {page.sections.map((section, idx) => (
              <div key={idx} className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-foreground">{section.sectionName}</span>
                  <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{section.layoutType}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{section.contentPlaceholder}</p>
                {section.functionalNotes && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">⚙ {section.functionalNotes}</p>
                )}
                {section.designSpecs && (
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">🎨 {section.designSpecs}</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>

    {/* Footer Wireframe */}
    <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-5 border-2 border-dashed border-slate-300 dark:border-slate-700">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Footer</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {wireframe.footer.columns.map((col, idx) => (
          <div key={idx}>
            <p className="font-bold text-xs text-foreground mb-1">{col.heading}</p>
            {col.items.map((item, i) => (
              <p key={i} className="text-xs text-muted-foreground">{item}</p>
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3 border-t pt-2">{wireframe.footer.copyright}</p>
    </div>

    {/* Design System + User Flow */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-muted/50 rounded-lg p-4 border">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Design System</p>
        <p className="text-xs text-foreground"><strong>Colors:</strong> {wireframe.designSystem.colorScheme}</p>
        <p className="text-xs text-foreground"><strong>Typography:</strong> {wireframe.designSystem.typography}</p>
        <p className="text-xs text-foreground"><strong>Spacing:</strong> {wireframe.designSystem.spacing}</p>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 border">
        <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">User Flow Notes</p>
        <p className="text-xs text-foreground leading-relaxed">{wireframe.userFlowNotes}</p>
      </div>
    </div>
  </div>
);


const GeneratedCopyDisplay: React.FC<GeneratedCopyDisplayProps> = ({
  generatedCopy,
  editedCopy,
  onCopy,
  onEdit,
  onEditBillboard,
  onExportTxt,
  onExportPdf,
  onExportHtml,
  onGenerateAudio,
  businessFacts,
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
              
              // DETECT IF IT IS A BLOG SERIES (Array of objects with titles)
              const isBlogSeries = item.value === 'blog post' && 
                                   Array.isArray(item.marketingCopy) && 
                                   (item.marketingCopy.length > 0) &&
                                   (item.marketingCopy[0] as any).title;

              // Fallback for old single posts
              const isGenericBlogPost = item.value === 'blog post' && !isBlogSeries && typeof item.marketingCopy === 'object';

              // Billboard Ad structured detection
              const isBillboardAd = item.value === 'billboard' &&
                                    typeof item.marketingCopy === 'object' &&
                                    !Array.isArray(item.marketingCopy) &&
                                    'headline' in (item.marketingCopy as object);

              // Display Ad Copy structured detection (array of variations with headline)
              const isDisplayAd = item.value === 'display ad copy' &&
                                  Array.isArray(item.marketingCopy) &&
                                  item.marketingCopy.length > 0 &&
                                  typeof item.marketingCopy[0] === 'object' &&
                                  'headline' in (item.marketingCopy[0] as object) &&
                                  'body' in (item.marketingCopy[0] as object);

              // Website Copy — Landing Page (single object with heroCtaText)
              const isLandingPage = item.value === 'website copy' &&
                                    typeof item.marketingCopy === 'object' &&
                                    !Array.isArray(item.marketingCopy) &&
                                    'heroCtaText' in (item.marketingCopy as object);

              // Website Copy — Standard 5-Page (array of page objects with pageName)
              const isStandardWebsite = item.value === 'website copy' &&
                                        Array.isArray(item.marketingCopy) &&
                                        item.marketingCopy.length > 0 &&
                                        typeof item.marketingCopy[0] === 'object' &&
                                        'pageName' in (item.marketingCopy[0] as object);

              // Website Wireframe (object with siteNavigation + pages)
              const isWireframe = item.value === 'website wireframe' &&
                                  typeof item.marketingCopy === 'object' &&
                                  !Array.isArray(item.marketingCopy) &&
                                  'siteNavigation' in (item.marketingCopy as object) &&
                                  'pages' in (item.marketingCopy as object);
              
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
                        ) : isBlogSeries ? (
                           <Tabs defaultValue="week1" className="w-full">
                                <div className="flex items-center justify-between mb-4">
                                    <TabsList className="grid w-full max-w-lg grid-cols-4 h-auto p-1">
                                        {(item.marketingCopy as BlogPostStructure[]).map((_, idx) => (
                                            <TabsTrigger key={idx} value={`week${idx + 1}`} className="text-xs py-2">
                                                Week {idx + 1}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>
                                
                                {(item.marketingCopy as BlogPostStructure[]).map((post, idx) => (
                                    <TabsContent key={idx} value={`week${idx + 1}`} className="mt-0 p-6 border rounded-xl bg-card shadow-sm">
                                        <SingleBlogPostDisplay post={post} />
                                        <div className="mt-8 flex justify-end border-t pt-4">
                                            <Button variant="secondary" size="sm" onClick={() => onCopy(JSON.stringify(post, null, 2), `Blog Week ${idx + 1}`)}>
                                                <Copy className="w-3 h-3 mr-2" /> Copy Week {idx + 1} JSON
                                            </Button>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        ) : isGenericBlogPost ? (
                           <BlogPostDisplay post={item.marketingCopy as BlogPostStructure} />
                        ) : isBillboardAd ? (
                           <EditableBillboardAdDisplay 
                             ad={item.marketingCopy as BillboardAdStructure} 
                             onFieldChange={(field, value) => onEditBillboard(item.value, field, value)}
                             businessFacts={businessFacts}
                           />
                        ) : isDisplayAd ? (
                           <div className="space-y-4">
                             <p className="text-sm text-muted-foreground font-medium">
                               {(item.marketingCopy as DisplayAdVariation[]).length} ad variations generated for A/B testing
                             </p>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {(item.marketingCopy as DisplayAdVariation[]).map((variation, idx) => (
                                 <DisplayAdVariationCard
                                   key={idx}
                                   variation={variation}
                                   index={idx}
                                   total={(item.marketingCopy as DisplayAdVariation[]).length}
                                 />
                               ))}
                             </div>
                           </div>
                        ) : isLandingPage ? (
                           <LandingPageDisplay page={item.marketingCopy as LandingPageStructure} />
                        ) : isStandardWebsite ? (
                           <StandardWebsiteDisplay pages={item.marketingCopy as WebsitePageStructure[]} />
                        ) : isWireframe ? (
                           <WebsiteWireframeDisplay wireframe={item.marketingCopy as WireframeSiteStructure} />
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
                           <>
                             <EditableTextDisplay 
                                  item={item} 
                                  editedText={editedCopy[item.value]} 
                                  onEdit={(newText) => onEdit(item.value, newText)}
                             />
                             {businessFacts && (
                               <ValidationWarnings 
                                 warnings={validateGeneratedText(
                                   editedCopy[item.value] || (typeof item.marketingCopy === 'string' ? item.marketingCopy : ''),
                                   businessFacts
                                 )} 
                               />
                             )}
                           </>
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
                                    <div className="space-y-2">
                                      <Image 
                                        src={item.generatedImage} 
                                        alt={item.imageSuggestion}
                                        width={512}
                                        height={512}
                                        className="rounded-lg border-2 border-border object-cover w-full"
                                        data-ai-hint="generated image"
                                      />
                                      <a
                                        href={item.generatedImage}
                                        download={`${item.label.replace(/\s+/g, '_')}_image.png`}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                      >
                                        <Download className="w-3.5 h-3.5" /> Download Image
                                      </a>
                                    </div>
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
                                            <a
                                              href={imgUrl}
                                              download={`${item.label.replace(/\s+/g, '_')}_variant_${idx + 1}.png`}
                                              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                            >
                                              <Download className="w-3.5 h-3.5" /> Download Variant {idx + 1}
                                            </a>
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
                          {!isPodcast && !isBlogSeries && !isGenericBlogPost && !item.isError && (
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
                                      onClick={() => onGenerateAudio(item)} 
                                      disabled={item.isGeneratingAudio}
                                      className="w-auto"
                                    >
                                        {item.isGeneratingAudio ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Volume2 className="w-3 h-3 mr-2" />}
                                        {item.isGeneratingAudio 
                                          ? 'Generating...' 
                                          : ((item.generatedAudio || item.generatedAudios) ? 'Regenerate Audio Spec' : 'Generate Audio Spec')
                                        }
                                    </Button>
                                    {(item.generatedAudio || item.generatedAudios) && !item.isGeneratingAudio && (
                                      <div className="w-full space-y-2 mt-2">
                                        {item.generatedAudio && (
                                            <audio controls className="w-full h-10" src={item.generatedAudio} />
                                        )}
                                        {item.generatedAudios && item.generatedAudios.length > 0 && (
                                            <div className="space-y-2 border-t pt-2 mt-2">
                                                <p className="text-xs font-semibold text-muted-foreground">Audio Variants:</p>
                                                {item.generatedAudios.map((audioSrc, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <span className="text-xs font-medium w-20 shrink-0">Variant {idx + 1}</span>
                                                        <audio controls className="flex-1 h-8" src={audioSrc} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                      </div>
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

    