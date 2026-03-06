'use client';
import React, { useState, useMemo } from 'react';
import { AnyEquipment, Site, Market, Company, Station } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchEditToolbar } from './batch-edit-toolbar';

interface AllEquipmentListViewProps {
  equipment: AnyEquipment[];
  onSelectEquipment: (equipment: AnyEquipment) => void;
  allSites: Site[];
  allMarkets: Market[];
  allCompanies: Company[];
  allStations: Station[];
}

export const AllEquipmentListView: React.FC<AllEquipmentListViewProps> = ({ 
    equipment, 
    onSelectEquipment, 
    allSites,
    allMarkets,
    allCompanies,
    allStations,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? equipment.map(e => e.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const isAllSelected = selectedIds.length > 0 && selectedIds.length === equipment.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < equipment.length;

  const getSiteName = useMemo(() => {
    const siteMap = new Map(allSites.map(s => [s.id, s.name]));
    return (siteId?: string) => siteId ? siteMap.get(siteId) || 'N/A' : 'Corporate/Unassigned';
  }, [allSites]);

  const getMarketName = useMemo(() => {
    const marketMap = new Map(allMarkets.map(m => [m.id, m.name]));
    return (marketId?: string) => marketId ? marketMap.get(marketId) || 'N/A' : 'N/A';
  }, [allMarkets]);


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>All Equipment ({equipment.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <BatchEditToolbar 
                selectedIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
                allSites={allSites}
                allMarkets={allMarkets}
                allCompanies={allCompanies}
                allStations={allStations}
            />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map(item => (
                    <TableRow
                      key={item.id}
                      onClick={() => onSelectEquipment(item)}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectOne(item.id, !!checked)}
                          aria-label={`Select ${item.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.equipmentType || item.category || 'N/A'}</TableCell>
                      <TableCell>{getSiteName(item.siteId)}</TableCell>
                      <TableCell>{getMarketName(item.marketId)}</TableCell>
                      <TableCell>{Array.isArray(item.ipAddress) ? item.ipAddress.join(', ') : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
