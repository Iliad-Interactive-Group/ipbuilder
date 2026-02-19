
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Wand2, Loader2, Palette, Lightbulb, Save, History, Clock, Monitor, Users, Mic, Tv, Podcast, Presentation, LayoutDashboard, Image as ImageIconLucide, Mail, Volume2 } from 'lucide-react';
import { suggestKeywords } from '@/ai/flows/suggest-keywords-flow';
import { useToast } from "@/hooks/use-toast";

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

const EMAIL_TYPES = [
    { value: "cold_outreach", label: "Cold Outreach" },
    { value: "nurture", label: "Nurture" },
    { value: "promotional", label: "Promotional" },
];
const NO_EMAIL_TYPE_SELECTED_VALUE = "_no_email_type_";

const VOICE_GENDERS = [
    { value: "male", label: "Male Voice" },
    { value: "female", label: "Female Voice" },
];

const MALE_VOICES = [
    { value: "Puck", label: "Puck (Upbeat)" },
    { value: "Charon", label: "Charon (Informative)" },
    { value: "Fenrir", label: "Fenrir (Excitable)" },
    { value: "Orus", label: "Orus (Firm)" },
    { value: "Enceladus", label: "Enceladus (Breathy)" },
    { value: "Iapetus", label: "Iapetus (Clear)" },
    { value: "Umbriel", label: "Umbriel (Easy-going)" },
    { value: "Algieba", label: "Algieba (Smooth)" },
    { value: "Algenib", label: "Algenib (Gravelly)" },
    { value: "Rasalgethi", label: "Rasalgethi (Informative)" },
    { value: "Alnilam", label: "Alnilam (Firm)" },
    { value: "Schedar", label: "Schedar (Even)" },
    { value: "Achird", label: "Achird (Friendly)" },
    { value: "Zubenelgenubi", label: "Zubenelgenubi (Casual)" },
    { value: "Sadachbia", label: "Sadachbia (Lively)" },
    { value: "Sadaltager", label: "Sadaltager (Knowledgeable)" },
];

const FEMALE_VOICES = [
    { value: "Zephyr", label: "Zephyr (Bright)" },
    { value: "Kore", label: "Kore (Firm)" },
    { value: "Leda", label: "Leda (Youthful)" },
    { value: "Aoede", label: "Aoede (Breezy)" },
    { value: "Callirrhoe", label: "Callirrhoe (Easy-going)" },
    { value: "Autonoe", label: "Autonoe (Bright)" },
    { value: "Despina", label: "Despina (Smooth)" },
    { value: "Erinome", label: "Erinome (Clear)" },
    { value: "Laomedeia", label: "Laomedeia (Upbeat)" },
    { value: "Achernar", label: "Achernar (Soft)" },
    { value: "Gacrux", label: "Gacrux (Mature)" },
    { value: "Pulcherrima", label: "Pulcherrima (Forward)" },
    { value: "Vindemiatrix", label: "Vindemiatrix (Gentle)" },
    { value: "Sulafat", label: "Sulafat (Warm)" },
];

const NO_VOICE_SELECTED_VALUE = "_no_voice_selected_";


const NO_TONE_SELECTED_VALUE = "_no_tone_selected_";
const NO_PLATFORM_SELECTED_VALUE = "_no_platform_selected_";
const LOCAL_STORAGE_BRIEF_KEY = 'ipbuilder_saved_brief';

export const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  productDescription: z.string().min(1, "Product description is required"),
  keywords: z.string().min(1, "Keywords are required (comma-separated)"),
  contentType: z.array(z.string()).min(1, "Please select at least one content type."),
  tone: z.string().optional(),
  socialMediaPlatform: z.string().optional(),
  tvScriptLength: z.string().optional(),
  radioScriptLength: z.string().optional(),
  emailType: z.string().optional(),
  additionalInstructions: z.string().optional(),
  numberOfVariations: z.number().optional(),
  numberOfImageVariations: z.number().optional(),
  voiceGender: z.string().optional(),
  voiceName: z.string().optional(),
});

export type MarketingBriefFormData = z.infer<typeof formSchema>;

interface SavedBriefData extends Omit<MarketingBriefFormData, 'contentType'> {}

interface MarketingBriefFormProps {
  form: any; // React Hook Form's form object
  onSubmit: (data: MarketingBriefFormData) => void;
  isGenerating: boolean;
  isSummarizing: boolean;
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

const MarketingBriefForm: React.FC<MarketingBriefFormProps> = ({ form, onSubmit, isGenerating, isSummarizing }) => {
  const { toast } = useToast();
  const [isSuggestingKeywords, setIsSuggestingKeywords] = useState(false);
  const [hasSavedBrief, setHasSavedBrief] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasSavedBrief(!!localStorage.getItem(LOCAL_STORAGE_BRIEF_KEY));
    }
  }, []);

  const selectedContentTypes = form.watch('contentType');
  const showSocialMediaPlatformSelector = selectedContentTypes?.includes('social media post');
  const showTvScriptLengthSelector = selectedContentTypes?.includes('tv script');
  const showRadioScriptLengthSelector = selectedContentTypes?.includes('radio script');
  const showEmailTypeSelector = selectedContentTypes?.includes('lead generation email');
  const showVariationsSelector = selectedContentTypes?.some((ct: string) => ['radio script', 'tv script'].includes(ct));
  const showImageVariationsSelector = selectedContentTypes?.some((ct: string) => ['social media post', 'display ad copy', 'billboard'].includes(ct));
  const showVoiceSelector = selectedContentTypes?.some((ct: string) => ['radio script', 'tv script'].includes(ct));
  const selectedVoiceGender = form.watch('voiceGender');

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
        const currentKeywords = form.getValues("keywords").split(',').map((k: string) => k.trim()).filter((k: string) => k);
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
        emailType: form.getValues("emailType") || NO_EMAIL_TYPE_SELECTED_VALUE,
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
            emailType: savedBrief.emailType || NO_EMAIL_TYPE_SELECTED_VALUE,
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

  return (
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
                      Suggest
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
                          <SelectValue placeholder="Select TV script length (default: 30s)" />
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
                      Choose the desired length for the TV script.
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={"30s"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select radio script length (default: 30s)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_RADIO_LENGTH_SELECTED_VALUE}>Default (30 seconds)</SelectItem>
                        {RADIO_SCRIPT_LENGTHS.map((length) => (
                          <SelectItem key={length.value} value={length.value}>
                            {length.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the desired length for the radio script.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showEmailTypeSelector && (
              <FormField
                control={form.control}
                name="emailType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Mail className="w-4 h-4 mr-2 text-muted-foreground"/>Email Type (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={NO_EMAIL_TYPE_SELECTED_VALUE}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select email type (optional, defaults to general)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_EMAIL_TYPE_SELECTED_VALUE}>Default / General</SelectItem>
                        {EMAIL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Specify the type of lead generation email you need.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showVariationsSelector && (
              <FormField
                control={form.control}
                name="numberOfVariations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Wand2 className="w-4 h-4 mr-2 text-muted-foreground"/>Number of Variations (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "1" ? undefined : parseInt(value))} 
                      value={field.value?.toString() || "1"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="1 variation (default)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 variation (default)</SelectItem>
                        <SelectItem value="2">2 variations</SelectItem>
                        <SelectItem value="3">3 variations</SelectItem>
                        <SelectItem value="4">4 variations</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Generate multiple unique variations for radio and TV scripts.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showImageVariationsSelector && (
              <FormField
                control={form.control}
                name="numberOfImageVariations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ImageIconLucide className="w-4 h-4 mr-2 text-muted-foreground"/>Number of Image Variations (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "1" ? undefined : parseInt(value))} 
                      value={field.value?.toString() || "1"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="1 image (default)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 image (default)</SelectItem>
                        <SelectItem value="2">2 images (A/B test)</SelectItem>
                        <SelectItem value="3">3 images (A/B/C test)</SelectItem>
                        <SelectItem value="4">4 images (A/B/C/D test)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Generate multiple unique images for A/B testing visual content.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {showVoiceSelector && (
              <>
                <FormField
                  control={form.control}
                  name="voiceGender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Mic className="w-4 h-4 mr-2 text-muted-foreground"/>Voice Gender (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value === NO_VOICE_SELECTED_VALUE ? undefined : value);
                          // Reset voice name when gender changes
                          if (value !== NO_VOICE_SELECTED_VALUE) {
                            form.setValue('voiceName', undefined);
                          }
                        }} 
                        value={field.value || NO_VOICE_SELECTED_VALUE}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select voice gender (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_VOICE_SELECTED_VALUE}>Auto-select (Default)</SelectItem>
                          {VOICE_GENDERS.map((gender) => (
                            <SelectItem key={gender.value} value={gender.value}>
                              {gender.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose male or female voice for audio generation. Audio defaults to 30 seconds.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedVoiceGender && selectedVoiceGender !== NO_VOICE_SELECTED_VALUE && (
                  <FormField
                    control={form.control}
                    name="voiceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center"><Volume2 className="w-4 h-4 mr-2 text-muted-foreground"/>Specific Voice (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value === NO_VOICE_SELECTED_VALUE ? undefined : value)} 
                          value={field.value || NO_VOICE_SELECTED_VALUE}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Auto-select voice" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_VOICE_SELECTED_VALUE}>Auto-select (Default)</SelectItem>
                            {(selectedVoiceGender === 'male' ? MALE_VOICES : FEMALE_VOICES).map((voice) => (
                              <SelectItem key={voice.value} value={voice.value}>
                                {voice.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose a specific voice personality from 30 available options.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
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
                  {isGenerating ? 'Generating... Please Wait' : 'Generate Marketing Copy'}
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
  );
};

export default MarketingBriefForm;
