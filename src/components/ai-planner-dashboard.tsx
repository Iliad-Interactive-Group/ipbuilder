
import React, { useState, useEffect } from 'react';
import { Site, AnyEquipment } from '@/lib/types';
import { aiPoweredSuggestions } from '@/ai/flows/ai-powered-suggestions';
import { Loader2, Wand } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth-provider';

interface AiPlannerDashboardProps {
    allSites: Site[];
    allEquipment: AnyEquipment[];
}

const PlannerLoadingState: React.FC = () => (
    <Card className="flex flex-col items-center justify-center h-96">
        <Loader2 size={48} className="animate-spin text-primary" />
        <p className="mt-4 text-xl font-semibold">Crafting Your Maintenance Schedule...</p>
        <p className="text-muted-foreground">Our AI is analyzing your assets to build the optimal plan.</p>
    </Card>
);

const PlannerSignedOutState: React.FC = () => (
    <Card className="flex flex-col items-center justify-center h-96">
        <Wand size={48} className="text-primary" />
        <p className="mt-4 text-xl font-semibold">Sign in to use the AI Maintenance Planner</p>
        <p className="text-muted-foreground">Log in to generate maintenance schedules.</p>
    </Card>
)

export const AiPlannerDashboard: React.FC<AiPlannerDashboardProps> = ({ allSites, allEquipment }) => {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [plan, setPlan] = useState('');
    const [error, setError] = useState('');

    const handlePlanGeneration = async () => {
        setIsLoading(true);
        setError('');
        setPlan('');

        try {
            const prompt = `
                You are a maintenance planner for a radio broadcast company. Based on the provided list of all sites and all equipment, generate a monthly maintenance plan. 
                Prioritize tasks based on standard broadcast engineering best practices, such as seasonal HVAC checks, annual generator servicing, and periodic transmitter inspections.
                Format the output as a clean, easy-to-read markdown document. Use headings for sites or dates to structure the plan.
                
                Current Date: ${new Date().toISOString().split('T')[0]}

                Here is all the company data in JSON format:
                Sites: ${JSON.stringify(allSites, null, 2)}
                Equipment: ${JSON.stringify(allEquipment.map(({ maintenanceHistory, attachments, ...eq }) => eq), null, 2)}
            `;

            const result = await aiPoweredSuggestions({
                siteData: `Sites: ${JSON.stringify(allSites, null, 2)}\nEquipment: ${JSON.stringify(allEquipment.map(({ maintenanceHistory, attachments, ...eq }) => eq), null, 2)}`,
                userPrompt: `
                    You are a maintenance planner for a radio broadcast company. Based on the provided list of all sites and all equipment, generate a monthly maintenance plan for the current month. 
                    Prioritize tasks based on standard broadcast engineering best practices, such as seasonal HVAC checks, annual generator servicing, and periodic transmitter inspections.
                    Format the output as a clean, easy-to-read markdown document. Use headings for sites or dates to structure the plan.
                    Current Date: ${new Date().toISOString().split('T')[0]}
                `,
            });
            setPlan(result.suggestions);
        } catch (e) {
            console.error("Error generating AI maintenance plan:", e);
            setError(`Error: Could not generate the maintenance plan. The AI model may have returned an unexpected response.`);
            toast({
              variant: 'destructive',
              title: 'AI Error',
              description: `Could not generate the maintenance plan. The AI model may have returned an unexpected response.`
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(user) {
            handlePlanGeneration();
        } else {
            setIsLoading(false);
            setPlan('');
        }
    }, [user]);
    
    if (authLoading) {
        return <PlannerLoadingState />;
    }

    if (!user) {
        return <PlannerSignedOutState />;
    }

    if (isLoading && !plan) {
        return <PlannerLoadingState />;
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center">
                            <Wand className="w-6 h-6 mr-3 text-primary" />
                            AI Maintenance Plan
                        </CardTitle>
                        <CardDescription className="mt-1">A company-wide maintenance schedule generated by AI for {user?.displayName || 'the current user'}.</CardDescription>
                    </div>
                     <div className="flex items-center gap-2">
                         <Button
                            onClick={handlePlanGeneration}
                            disabled={isLoading}
                            variant="outline"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                "Regenerate Plan"
                            )}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {error && (
                 <Card className="bg-destructive/10 border-destructive text-destructive-foreground">
                    <CardHeader>
                        <CardTitle>An error occurred</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}
            
            {isLoading && !plan && <Skeleton className="h-96 w-full" />}

            {plan && (
                 <Card>
                    <CardHeader>
                        <CardTitle>Generated Maintenance Plan</CardTitle>
                        <CardDescription>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{plan}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
