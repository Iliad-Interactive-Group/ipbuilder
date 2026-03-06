import React from 'react';
import { SiteMaintenanceLog } from '@/lib/types';
import { ClipboardCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface SiteMaintenanceHistoryProps {
    logs: SiteMaintenanceLog[];
}

const LogDetail: React.FC<{ log: SiteMaintenanceLog }> = ({ log }) => {
    return (
        <div className="p-4 pt-0">
            <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                {Object.entries(log.data).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                        <dt className="font-semibold text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                        <dd className="text-foreground">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) || 'N/A'}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

export const SiteMaintenanceHistory: React.FC<SiteMaintenanceHistoryProps> = ({ logs }) => {
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <ClipboardCheck className="w-6 h-6 mr-3" />
                    Site Maintenance History
                </CardTitle>
            </CardHeader>
            <CardContent>
                {sortedLogs.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full">
                        {sortedLogs.map(log => (
                            <AccordionItem value={log.id} key={log.id}>
                                <AccordionTrigger>
                                    <div className="flex justify-between items-center w-full pr-4">
                                        <p className="font-semibold text-foreground">{log.templateName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            By {log.technician} on {new Date(log.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <LogDetail log={log} />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground p-3">No site maintenance logs recorded yet.</p>
                )}
            </CardContent>
        </Card>
    );
};
