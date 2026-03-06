
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, FileText, Lightbulb, Volume2, Loader2, Info, Pencil, AlertTriangle, Upload, ImageIcon, X, Monitor } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { PodcastOutlineStructure, BlogPostStructure, BillboardAdStructure, DisplayAdVariation, LandingPageStructure, WebsitePageStructure, WireframeSiteStructure, EmailStructure } from '@/ai/flows/generate-marketing-copy';
import { validateGeneratedText, type BusinessFacts, type ValidationWarning } from '@/lib/validation-utils';
import PodcastOutlineDisplay from './podcast-outline-display';
import BlogPostDisplay from './blog-post-display';
import { CONTENT_TYPES } from '@/lib/content-types';
import { isVariantsArray, VariantCopy } from '@/lib/variant-utils';
import { BILLBOARD_SIZES, compositeBillboard, downloadBlob, type BillboardSize } from '@/lib/billboard-compositor';


export interface GeneratedCopyItem {
  value: string;
  label: string;
  marketingCopy: string | string[] | PodcastOutlineStructure | BlogPostStructure | BlogPostStructure[] | BillboardAdStructure | DisplayAdVariation[] | LandingPageStructure | WebsitePageStructure[] | WireframeSiteStructure | VariantCopy[] | EmailStructure;
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
  onEditEmail: (itemValue: string, field: keyof EmailStructure, value: string) => void;
  onEditDisplayAd: (itemValue: string, variationIndex: number, field: keyof DisplayAdVariation, value: string) => void;
  onEditVariant: (itemValue: string, variantNumber: number, text: string) => void;
  onEditPost: (itemValue: string, postIndex: number, text: string) => void;
  editedVariants: Record<string, Record<number, string>>;
  editedPosts: Record<string, Record<number, string>>;
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

// ---------------------------------------------------------------------------
// Billboard Composite Download Panel
// ---------------------------------------------------------------------------
const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const BillboardCompositePanel: React.FC<{
  ad: BillboardAdStructure;
  generatedImage?: string;
  generatedImages?: string[];
}> = ({ ad, generatedImage, generatedImages }) => {
  const [selectedSize, setSelectedSize] = useState<BillboardSize>(BILLBOARD_SIZES[0]);
  const [bgSource, setBgSource] = useState<'ai' | 'custom'>('ai');
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [customBgDataUri, setCustomBgDataUri] = useState<string | null>(null);
  const [logoDataUri, setLogoDataUri] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [customBgFileName, setCustomBgFileName] = useState<string>('');
  const [isCompositing, setIsCompositing] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Determine the active background image
  const aiBgUri = generatedImages && generatedImages.length > 0
    ? generatedImages[selectedVariant] || generatedImages[0]
    : generatedImage || null;
  const activeBg = bgSource === 'custom' ? customBgDataUri : aiBgUri;
  const hasBackground = !!activeBg;

  // Render live preview whenever inputs change
  useEffect(() => {
    if (!previewCanvasRef.current || !activeBg) return;
    const canvas = previewCanvasRef.current;
    // We render at full resolution then CSS scales it down
    compositeBillboard(
      {
        size: selectedSize,
        backgroundDataUri: activeBg,
        headline: ad.headline,
        subheadline: ad.subheadline,
        cta: ad.cta,
        logoDataUri: logoDataUri || undefined,
      },
      canvas,
    ).catch((err) => console.error('Preview render failed:', err));
  }, [activeBg, selectedSize, ad.headline, ad.subheadline, ad.cta, logoDataUri]);

  const handleDownload = async () => {
    if (!activeBg) return;
    setIsCompositing(true);
    try {
      const blob = await compositeBillboard({
        size: selectedSize,
        backgroundDataUri: activeBg,
        headline: ad.headline,
        subheadline: ad.subheadline,
        cta: ad.cta,
        logoDataUri: logoDataUri || undefined,
      });
      const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      downloadBlob(blob, `billboard_${selectedSize.key}_${ts}.png`);
    } catch (err) {
      console.error('Billboard compositing failed:', err);
    } finally {
      setIsCompositing(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    const uri = await fileToDataUri(file);
    setLogoDataUri(uri);
  };

  const handleCustomBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomBgFileName(file.name);
    const uri = await fileToDataUri(file);
    setCustomBgDataUri(uri);
    setBgSource('custom');
  };

  return (
    <div className="mt-6 border-2 border-dashed border-primary/30 rounded-xl p-5 space-y-5 bg-muted/30">
      <div className="flex items-center gap-2">
        <Monitor className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-sm uppercase tracking-wider text-primary">Billboard Compositor</h3>
        <span className="text-xs text-muted-foreground ml-auto">Combine image + text → download print-ready PNG</span>
      </div>

      {/* Controls row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Size selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Billboard Size</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            value={selectedSize.key}
            onChange={(e) => setSelectedSize(BILLBOARD_SIZES.find(s => s.key === e.target.value) || BILLBOARD_SIZES[0])}
          >
            {BILLBOARD_SIZES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} — {s.width}×{s.height} — {s.description}
              </option>
            ))}
          </select>
        </div>

        {/* Background source */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Background</label>
          <div className="flex gap-2">
            <button
              onClick={() => setBgSource('ai')}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                bgSource === 'ai'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input text-muted-foreground hover:bg-accent'
              }`}
              disabled={!aiBgUri}
            >
              AI Generated
            </button>
            <label
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium text-center cursor-pointer transition-colors ${
                bgSource === 'custom'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input text-muted-foreground hover:bg-accent'
              }`}
            >
              <Upload className="w-3 h-3 inline mr-1" />
              {customBgFileName ? customBgFileName.slice(0, 12) + '…' : 'Upload'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleCustomBgUpload}
              />
            </label>
          </div>
        </div>

        {/* AI variant selector (only if multiple) */}
        {bgSource === 'ai' && generatedImages && generatedImages.length > 1 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Variant</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(Number(e.target.value))}
            >
              {generatedImages.map((_, idx) => (
                <option key={idx} value={idx}>Variant {idx + 1}</option>
              ))}
            </select>
          </div>
        )}

        {/* Logo upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logo (Optional)</label>
          {logoDataUri ? (
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
              <img src={logoDataUri} alt="Logo" className="h-8 w-auto object-contain" />
              <span className="text-xs text-muted-foreground truncate flex-1">{logoFileName}</span>
              <button
                onClick={() => { setLogoDataUri(null); setLogoFileName(''); }}
                className="text-muted-foreground hover:text-destructive"
                title="Remove logo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background px-3 py-2 text-xs text-muted-foreground cursor-pointer hover:bg-accent transition-colors">
              <ImageIcon className="w-3.5 h-3.5" />
              Upload Logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </label>
          )}
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
        {hasBackground ? (
          <div className="rounded-lg border-2 border-border overflow-hidden bg-slate-900">
            <canvas
              ref={previewCanvasRef}
              className="w-full h-auto"
              style={{ aspectRatio: `${selectedSize.width} / ${selectedSize.height}` }}
            />
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-border p-8 text-center bg-muted/40">
            <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {!aiBgUri && bgSource === 'ai'
                ? 'Generate a background image above first, or upload a custom one.'
                : 'Upload a background image to see the composite preview.'}
            </p>
          </div>
        )}
      </div>

      {/* Download */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleDownload}
          disabled={!hasBackground || isCompositing}
          className="gap-2"
        >
          {isCompositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {isCompositing ? 'Compositing…' : `Download ${selectedSize.label} PNG`}
        </Button>
        <span className="text-xs text-muted-foreground">
          {selectedSize.width} × {selectedSize.height} px · ~100 DPI proof quality
        </span>
      </div>
    </div>
  );
};

// Display Ad variation card — editable
const DisplayAdVariationCard: React.FC<{
  variation: DisplayAdVariation;
  index: number;
  total: number;
  onFieldChange: (field: keyof DisplayAdVariation, value: string) => void;
}> = ({ variation, index, total, onFieldChange }) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const EditableAdField: React.FC<{
    fieldKey: keyof DisplayAdVariation;
    value: string;
    label: string;
    wordLimit?: number;
    className?: string;
    inputType?: 'input' | 'textarea';
  }> = ({ fieldKey, value, label, wordLimit, className = '', inputType = 'input' }) => {
    const isEditing = editingField === `${index}-${fieldKey}`;
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 mb-0.5">
          {wordLimit && <WordCountBadge text={value} limit={wordLimit} />}
          {!isEditing && (
            <button
              onClick={() => setEditingField(`${index}-${fieldKey}`)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title={`Edit ${label}`}
            >
              <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </button>
          )}
        </div>
        {isEditing ? (
          inputType === 'textarea' ? (
            <Textarea
              value={value}
              onChange={(e) => onFieldChange(fieldKey, e.target.value)}
              onBlur={() => setEditingField(null)}
              rows={2}
              autoFocus
              className={`text-sm border-primary/50 focus:ring-primary ${className}`}
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onFieldChange(fieldKey, e.target.value)}
              onBlur={() => setEditingField(null)}
              autoFocus
              className={`text-sm border-primary/50 focus:ring-primary ${className}`}
            />
          )
        ) : (
          <div
            onClick={() => setEditingField(`${index}-${fieldKey}`)}
            className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors ${className}`}
          >
            {value || <span className="italic text-muted-foreground">Click to edit...</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border rounded-xl p-5 bg-card shadow-sm space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          Variation {index + 1} of {total}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1"><Pencil className="w-3 h-3" /> Click to edit</span>
      </div>
      <EditableAdField fieldKey="headline" value={variation.headline} label="Headline" wordLimit={10} className="text-xl font-bold text-foreground leading-snug" />
      <EditableAdField fieldKey="body" value={variation.body} label="Body" inputType="textarea" className="text-sm text-muted-foreground leading-relaxed" />
      <div className="flex items-center gap-3 pt-2">
        <EditableAdField fieldKey="cta" value={variation.cta} label="CTA" wordLimit={5} className="inline-block bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded-md text-xs uppercase tracking-wide" />
      </div>
      <div className="text-xs text-muted-foreground pt-2 border-t mt-3">
        <EditableAdField fieldKey="visualNotes" value={variation.visualNotes} label="Visual Notes" inputType="textarea" className="text-xs text-muted-foreground" />
      </div>
    </div>
  );
};

// --- Email Display component (structured, editable) ---
const EditableEmailDisplay: React.FC<{
  email: EmailStructure;
  onFieldChange: (field: keyof EmailStructure, value: string) => void;
  businessFacts?: BusinessFacts;
}> = ({ email, onFieldChange, businessFacts }) => {
  const [editingField, setEditingField] = useState<string | null>(null);

  const allText = `${email.subjectLine} ${email.bodyParagraphs.join(' ')} ${email.cta}`;
  const warnings = businessFacts ? validateGeneratedText(allText, businessFacts) : [];

  const EditableField: React.FC<{
    fieldKey: keyof EmailStructure;
    value: string;
    label: string;
    className?: string;
    inputType?: 'input' | 'textarea';
  }> = ({ fieldKey, value, label, className = '', inputType = 'input' }) => {
    const isEditing = editingField === fieldKey;
    return (
      <div className="group relative">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          {!isEditing && (
            <button onClick={() => setEditingField(fieldKey)} className="opacity-0 group-hover:opacity-100 transition-opacity" title={`Edit ${label}`}>
              <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </button>
          )}
        </div>
        {isEditing ? (
          inputType === 'textarea' ? (
            <Textarea value={value} onChange={(e) => onFieldChange(fieldKey, e.target.value)} onBlur={() => setEditingField(null)} rows={3} autoFocus className={`text-sm border-primary/50 focus:ring-primary ${className}`} />
          ) : (
            <Input value={value} onChange={(e) => onFieldChange(fieldKey, e.target.value)} onBlur={() => setEditingField(null)} autoFocus className={`text-sm border-primary/50 focus:ring-primary ${className}`} />
          )
        ) : (
          <div onClick={() => setEditingField(fieldKey)} className={`cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors ${className}`}>
            {value || <span className="italic text-muted-foreground">Click to edit...</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 text-left animate-in fade-in duration-500">
      {/* Email preview card */}
      <div className="border rounded-xl overflow-hidden shadow-sm">
        {/* Subject line bar */}
        <div className="bg-muted/50 px-6 py-3 border-b">
          <EditableField fieldKey="subjectLine" value={email.subjectLine} label="Subject" className="text-base font-bold text-foreground" />
          <p className="text-xs text-muted-foreground mt-1">{email.preheaderText}</p>
        </div>

        {/* Email body */}
        <div className="bg-card px-6 py-5 space-y-4">
          <EditableField fieldKey="greeting" value={email.greeting} label="Greeting" className="text-sm text-foreground" />

          <div className="space-y-3">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Body</p>
            {email.bodyParagraphs.map((para, idx) => (
              <div key={idx} className="group relative">
                {editingField === `body-${idx}` ? (
                  <Textarea
                    value={para}
                    onChange={(e) => {
                      const updated = [...email.bodyParagraphs];
                      updated[idx] = e.target.value;
                      onFieldChange('bodyParagraphs' as keyof EmailStructure, updated as unknown as string);
                    }}
                    onBlur={() => setEditingField(null)}
                    rows={3}
                    autoFocus
                    className="text-sm border-primary/50 focus:ring-primary"
                  />
                ) : (
                  <p
                    onClick={() => setEditingField(`body-${idx}`)}
                    className="text-sm text-foreground/90 leading-relaxed cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  >
                    {para}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 inline">
                      <Pencil className="w-3 h-3 text-muted-foreground inline" />
                    </button>
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* CTA button */}
          <div className="text-center py-3">
            <EditableField fieldKey="cta" value={email.cta} label="Call to Action" className="inline-block bg-primary text-primary-foreground font-bold px-8 py-2.5 rounded-lg text-sm uppercase tracking-wider" />
            {email.ctaUrl && <p className="text-xs text-muted-foreground mt-1">Links to: {email.ctaUrl}</p>}
          </div>

          {/* Signature */}
          <div className="border-t pt-3">
            <EditableField fieldKey="signature" value={email.signature} label="Signature" className="text-sm text-muted-foreground italic whitespace-pre-line" />
          </div>
        </div>

        {/* Compliance footer */}
        <div className="bg-muted/30 px-6 py-3 border-t">
          <EditableField fieldKey="complianceNote" value={email.complianceNote} label="Compliance" className="text-xs text-muted-foreground" />
        </div>
      </div>

      {/* Email type badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          {email.emailType || 'general'} email
        </span>
      </div>

      <ValidationWarnings warnings={warnings} />
    </div>
  );
};

// --- Social Media Per-Post Card Display ---
const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  'twitter': 280, 'x': 280,
  'instagram': 2200,
  'facebook': 63206,
  'linkedin': 3000,
  'tiktok': 2200,
};

const SocialMediaPostDisplay: React.FC<{
  item: GeneratedCopyItem;
  editedPosts: Record<string, Record<number, string>>;
  onEditPost: (itemValue: string, postIndex: number, text: string) => void;
}> = ({ item, editedPosts, onEditPost }) => {
  const posts = Array.isArray(item.marketingCopy) ? item.marketingCopy.map(p => typeof p === 'string' ? p : String(p)) : [String(item.marketingCopy)];
  const platform = (item as any).platform || '';
  const charLimit = PLATFORM_CHAR_LIMITS[platform.toLowerCase()] || 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground font-medium">
        {posts.length} post{posts.length !== 1 ? 's' : ''} generated{platform ? ` for ${platform}` : ''}
      </p>
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post, idx) => {
          const editedText = editedPosts[item.value]?.[idx];
          const currentText = editedText !== undefined ? editedText : post;
          const charCount = currentText.length;
          const isOverLimit = charLimit > 0 && charCount > charLimit;

          return (
            <div key={idx} className="border rounded-xl p-4 bg-card shadow-sm space-y-2 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Post {idx + 1} of {posts.length}
                </span>
                {charLimit > 0 && (
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    isOverLimit ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                  }`}>
                    {charCount}/{charLimit} chars
                  </span>
                )}
              </div>
              <Textarea
                value={currentText}
                onChange={(e) => onEditPost(item.value, idx, e.target.value)}
                rows={4}
                className="bg-muted/20 p-3 rounded-md text-sm leading-relaxed border-border/50 hover:border-primary/50 transition-colors"
                placeholder="Edit this post..."
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- TV Script Scene Breakdown Preview ---
const TV_SCRIPT_TAGS = /\[(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|VO|NARRATOR|CHARACTER|SFX|MUSIC|SUPER|SCENE|INT\.|EXT\.)[^\]]*\]/gi;

const TvScriptPreview: React.FC<{ text: string }> = ({ text }) => {
  // Split on script tags, keeping delimiters
  const parts = text.split(/(\[[^\]]+\])/g).filter(Boolean);
  if (parts.length <= 1) return null; // No tags found, skip preview

  return (
    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Scene Breakdown Preview</p>
      {parts.map((part, idx) => {
        const isTag = /^\[.*\]$/.test(part.trim());
        if (isTag) {
          return (
            <span key={idx} className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold px-2 py-0.5 rounded mr-1 mt-1">
              {part}
            </span>
          );
        }
        const trimmed = part.trim();
        if (!trimmed) return null;
        return (
          <p key={idx} className="text-sm text-foreground/90 leading-relaxed pl-4 border-l-2 border-blue-200 dark:border-blue-800 my-1">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

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
  onEditEmail,
  onEditDisplayAd,
  onEditVariant,
  onEditPost,
  editedVariants,
  editedPosts,
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

              // Lead Generation Email (structured with subjectLine)
              const isEmail = item.value === 'lead generation email' &&
                              typeof item.marketingCopy === 'object' &&
                              !Array.isArray(item.marketingCopy) &&
                              'subjectLine' in (item.marketingCopy as object);

              // Social Media Post (array of strings)
              const isSocialMedia = item.value === 'social media post' &&
                                    Array.isArray(item.marketingCopy) &&
                                    item.marketingCopy.length > 0 &&
                                    typeof item.marketingCopy[0] === 'string';
              
              const hasVariants = isVariantsArray(item.marketingCopy);
              const Icon = CONTENT_TYPES.find(ct => ct.value === item.value)?.icon || FileText;

              // Generate proper text for clipboard copy — handles all structured types
              const getCopiableText = (): string => {
                // Simple string — check editedCopy first
                if (typeof item.marketingCopy === 'string') {
                  return editedCopy[item.value] ?? item.marketingCopy;
                }
                // Variants (radio/TV scripts)
                if (hasVariants) {
                  return (item.marketingCopy as VariantCopy[]).map(v => {
                    const text = editedVariants[item.value]?.[v.variant] ?? v.copy;
                    return `--- Variant ${v.variant} ---\n${text}`;
                  }).join('\n\n');
                }
                // Social media posts
                if (isSocialMedia) {
                  return (item.marketingCopy as string[]).map((p, idx) => {
                    const text = editedPosts[item.value]?.[idx] ?? p;
                    return `--- Post ${idx + 1} ---\n${text}`;
                  }).join('\n\n');
                }
                // Email
                if (isEmail) {
                  const e = item.marketingCopy as EmailStructure;
                  return `Subject: ${e.subjectLine}\nPreheader: ${e.preheaderText}\n\n${e.greeting}\n\n${e.bodyParagraphs.join('\n\n')}\n\n[CTA] ${e.cta}\n\n${e.signature}\n\n---\n${e.complianceNote}`;
                }
                // Billboard
                if (isBillboardAd) {
                  const b = item.marketingCopy as BillboardAdStructure;
                  return `Headline: ${b.headline}\nSubheadline: ${b.subheadline}\nCTA: ${b.cta}\nVisual Notes: ${b.visualNotes}\nConcept: ${b.overallConcept}`;
                }
                // Display ad variations
                if (isDisplayAd) {
                  return (item.marketingCopy as DisplayAdVariation[]).map((v, i) =>
                    `--- Variation ${i + 1} ---\nHeadline: ${v.headline}\nBody: ${v.body}\nCTA: ${v.cta}\nVisual Notes: ${v.visualNotes}`
                  ).join('\n\n');
                }
                // Podcast outline
                if (isPodcast) {
                  const o = item.marketingCopy as PodcastOutlineStructure;
                  let text = `${o.episodeTitle}\nGoal: ${o.episodeGoal}\nAudience: ${o.targetAudience}\nLength: ${o.totalLength}\n\n`;
                  text += `Introduction (${o.introduction.duration})\nHook: ${o.introduction.hook}\nOverview: ${o.introduction.episodeOverview}\n\n`;
                  o.mainContent.forEach((s, i) => {
                    text += `Segment ${i + 1}: ${s.segmentTitle} (${s.duration})\nKey Points:\n${s.keyPoints.map(p => `  - ${p}`).join('\n')}\nTalking Points:\n${s.talkingPoints.map(p => `  - ${p}`).join('\n')}\n\n`;
                  });
                  text += `Conclusion (${o.conclusion.duration})\nRecap: ${o.conclusion.recap}\nCTA: ${o.conclusion.callToAction}\nTeaser: ${o.conclusion.teaser}`;
                  return text;
                }
                // Blog post — single 
                if (isGenericBlogPost && !isBlogSeries) {
                  const p = item.marketingCopy as BlogPostStructure;
                  let text = `${p.title}\n`;
                  if (p.metaDescription) text += `Meta: ${p.metaDescription}\n`;
                  if (p.keyTakeaways?.length) text += `Key Takeaways:\n${p.keyTakeaways.map(t => `  - ${t}`).join('\n')}\n\n`;
                  (p.sections || []).forEach(s => {
                    text += `${s.heading}\n`;
                    (s.contentItems || []).forEach(ci => {
                      if (ci.paragraph) text += `${ci.paragraph}\n\n`;
                      if (ci.listItems?.length) text += ci.listItems.map(li => `  - ${li}`).join('\n') + '\n\n';
                    });
                  });
                  return text;
                }
                // Blog series
                if (isBlogSeries) {
                  return (item.marketingCopy as BlogPostStructure[]).map((p, i) => {
                    let text = `[Part ${i + 1}] ${p.title}\n`;
                    (p.sections || []).forEach(s => {
                      text += `${s.heading}\n`;
                      (s.contentItems || []).forEach(ci => {
                        if (ci.paragraph) text += `${ci.paragraph}\n\n`;
                      });
                    });
                    return text;
                  }).join('\n' + '='.repeat(50) + '\n\n');
                }
                // Fallback — JSON
                return typeof item.marketingCopy === 'object' ? JSON.stringify(item.marketingCopy, null, 2) : String(item.marketingCopy);
              };
              
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
                           <>
                             <EditableBillboardAdDisplay 
                               ad={item.marketingCopy as BillboardAdStructure} 
                               onFieldChange={(field, value) => onEditBillboard(item.value, field, value)}
                               businessFacts={businessFacts}
                             />
                             <BillboardCompositePanel
                               ad={item.marketingCopy as BillboardAdStructure}
                               generatedImage={item.generatedImage}
                               generatedImages={item.generatedImages}
                             />
                           </>
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
                                   onFieldChange={(field, value) => onEditDisplayAd(item.value, idx, field, value)}
                                 />
                               ))}
                             </div>
                           </div>
                        ) : isEmail ? (
                           <EditableEmailDisplay
                             email={item.marketingCopy as EmailStructure}
                             onFieldChange={(field, value) => onEditEmail(item.value, field, value)}
                             businessFacts={businessFacts}
                           />
                        ) : isLandingPage ? (
                           <LandingPageDisplay page={item.marketingCopy as LandingPageStructure} />
                        ) : isStandardWebsite ? (
                           <StandardWebsiteDisplay pages={item.marketingCopy as WebsitePageStructure[]} />
                        ) : isWireframe ? (
                           <WebsiteWireframeDisplay wireframe={item.marketingCopy as WireframeSiteStructure} />
                        ) : isSocialMedia ? (
                           <SocialMediaPostDisplay
                             item={item}
                             editedPosts={editedPosts}
                             onEditPost={onEditPost}
                           />
                        ) : hasVariants ? (
                           <Tabs defaultValue="1" className="w-full">
                             <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${(item.marketingCopy as VariantCopy[]).length}, 1fr)` }}>
                               {(item.marketingCopy as VariantCopy[]).map((v) => (
                                 <TabsTrigger key={v.variant} value={v.variant.toString()}>
                                   Variant {v.variant}
                                 </TabsTrigger>
                               ))}
                             </TabsList>
                             {(item.marketingCopy as VariantCopy[]).map((v) => {
                               const variantText = editedVariants[item.value]?.[v.variant] ?? v.copy;
                               const wordCount = variantText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
                               const estimatedDuration = Math.round(wordCount / 2.2);
                               return (
                                 <TabsContent key={v.variant} value={v.variant.toString()} className="space-y-2">
                                   <div className="flex justify-between items-center">
                                     <p className="text-xs text-muted-foreground flex items-center gap-1">
                                       <Info className="w-3 h-3" /> Click to edit. Changes save automatically.
                                     </p>
                                     <div className={`text-xs font-medium px-2 py-1 rounded-md ${estimatedDuration > 30 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
                                       {wordCount} words ≈ {estimatedDuration}s
                                     </div>
                                   </div>
                                   <Textarea
                                     value={variantText}
                                     onChange={(e) => onEditVariant(item.value, v.variant, e.target.value)}
                                     rows={8}
                                     className="bg-muted/20 p-4 rounded-md font-mono text-sm leading-relaxed border-border/50 hover:border-primary/50 transition-colors"
                                   />
                                   {item.value === 'tv script' && <TvScriptPreview text={variantText} />}
                                 </TabsContent>
                               );
                             })}
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
                          {!item.isError && (
                            <Button variant="outline" size="sm" onClick={() => onCopy(getCopiableText(), item.label)} className="w-full sm:w-auto">
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

    