
import React from 'react';
import { Site } from '@/lib/types';
import { Globe, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SiteNetworkInfoProps {
    site: Site;
}

export const SiteNetworkInfo: React.FC<SiteNetworkInfoProps> = ({ site }) => {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                    <Globe className="w-6 h-6 mr-3" />
                    Network Information for {site.name}
                </CardTitle>
                {site.mapUrl && (
                    <a href={site.mapUrl} target="_blank" rel="noopener noreferrer">
                         <Button variant="outline">
                            <Map className="w-4 h-4 mr-2" />
                            Directions
                        </Button>
                    </a>
                )}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Network Name</TableHead>
                            <TableHead>Subnet</TableHead>
                            <TableHead>Gateway</TableHead>
                            <TableHead>External IP</TableHead>
                            <TableHead>DNS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(site.networks || []).map((net, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{net.network_name}</TableCell>
                                <TableCell>{net.subnet || 'N/A'}</TableCell>
                                <TableCell>{net.gateway || 'N/A'}</TableCell>
                                <TableCell>{net.external_ip || 'N/A'}</TableCell>
                                <TableCell>{net.dns_servers?.join(', ') || 'N/A'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};
