
import { FileText, Monitor, Users, Mic, Tv, Podcast, Presentation, LayoutDashboard, Image as ImageIconLucide, Mail } from 'lucide-react';

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
