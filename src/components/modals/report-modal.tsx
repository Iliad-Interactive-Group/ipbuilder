import React, { useState, useEffect } from 'react';
import { Site } from '@/lib/types';
import { generateEquipmentReport } from '@/ai/flows/generate-equipment-report';
import { Loader2, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReportModalProps {
    reportType: string;
    site: Site | null;
    onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ reportType, site, onClose }) => {
    const [reportContent, setReportContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setIsLoading(true);
            const siteName = site?.name || "the selected site";
            try {
                const response = await generateEquipmentReport({
                    equipmentData: '', // This can be expanded to pass relevant data
                    siteHealth: '',    // This can be expanded
                    userPrompt: `Generate a "${reportType}" for the broadcast site named "${siteName}". The report should be in markdown format. For a 'Site Visit Checklist', create a list of actionable items with markdown checkboxes. For a 'Failure Analysis', hypothesize potential points of failure and suggest diagnostic steps.`,
                });
                setReportContent(response.report);
            } catch (error) {
                console.error("Error generating report:", error);
                setReportContent("Failed to generate report. Please try again.");
            }
            setIsLoading(false);
        };
        fetchReport();
    }, [reportType, site]);

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <FileText className="w-6 h-6 mr-3" />
                        {reportType}
                    </DialogTitle>
                    <DialogDescription>For {site?.name || 'Current Site'}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] p-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">Generating your report with AI...</p>
                        </div>
                    ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                           <ReactMarkdown>{reportContent}</ReactMarkdown>
                        </div>
                    )}
                </ScrollArea>
                <DialogFooter>
                     <Button onClick={() => window.print()} variant="outline">Print</Button>
                     <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
