import React, { useState } from 'react';
import { Site, AnyEquipment } from '@/lib/types';
import { aiPoweredSuggestions } from '@/ai/flows/ai-powered-suggestions';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';

interface AiSiteAnalysisProps {
    site: Site;
    equipment: AnyEquipment[];
}

export const AiSiteAnalysis: React.FC<AiSiteAnalysisProps> = ({ site, equipment }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');

    const handleAnalysisClick = async () => {
        setIsLoading(true);
        setAnalysisResult('');

        const siteDataForAi = {
            siteInfo: {
                id: site.id,
                name: site.name,
                location: site.location
            },
            equipment: equipment.map(({ maintenanceHistory, ...eq }) => eq), // Omit bulky history
            maintenanceLogs: site.maintenanceHistory,
        };

        try {
            const response = await aiPoweredSuggestions({
                siteData: JSON.stringify(siteDataForAi, null, 2),
                userPrompt: 'Analyze the following broadcast site data and provide a "Site Health Analysis" in markdown format. Identify strengths and areas for improvement based on the equipment list and maintenance history. Prioritize actionable recommendations.'
            });
            setAnalysisResult(response.suggestions);
        } catch (error) {
            console.error("Error getting AI analysis:", error);
            setAnalysisResult("An error occurred while generating the analysis. Please check the console for details.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex-row items-start justify-between">
                <div>
                    <CardTitle className="flex items-center">
                        <Lightbulb className="w-6 h-6 mr-3 text-yellow-400" />
                        AI Site Health Analysis
                    </CardTitle>
                    <CardDescription className="mt-1">Get data-driven insights and recommendations for this site.</CardDescription>
                </div>
                 <Button
                    onClick={handleAnalysisClick}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Analyzing...
                        </>
                    ) : (
                        "Analyze Site Health"
                    )}
                </Button>
            </CardHeader>
            
            {analysisResult && (
                <CardContent>
                    <div className="mt-4 pt-4 border-t">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{analysisResult}</ReactMarkdown>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
