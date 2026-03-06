
import React from 'react';
import { AnyEquipment, Site, EquipmentCategory, Selection, Station, Market, Company } from '@/lib/types';
import { EquipmentCard } from './equipment-card';
import { SiteNetworkInfo } from './site-network-info';
import { SiteMaintenanceHistory } from './site-maintenance-history';
import { EquipmentListItem } from './equipment-list-item';
import { pluralizeCategory } from '@/lib/utils';
import { AiSiteAnalysis } from './ai-site-analysis';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { AllEquipmentListView } from './all-equipment-list-view';

interface DashboardProps {
  equipment: AnyEquipment[];
  onSelectEquipment: (equipment: AnyEquipment) => void;
  site: Site | null;
  title: string;
  activeSelection: Selection;
  allStations: Station[];
  allSites: Site[];
  allMarkets: Market[];
  allCompanies: Company[];
}

const CardGrid: React.FC<{items: AnyEquipment[], onSelect: (eq: AnyEquipment) => void, allStations: Station[]}> = ({ items, onSelect, allStations }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
            <EquipmentCard key={item.id} equipment={item} onSelect={onSelect} allStations={allStations} />
        ))}
    </div>
);

const ListGroup: React.FC<{category: EquipmentCategory | string, items: AnyEquipment[], onSelect: (eq: AnyEquipment) => void, allStations: Station[]}> = ({ category, items, onSelect, allStations}) => (
    <Card>
        <CardHeader>
            <CardTitle>{pluralizeCategory(category)}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-2/5">Name / Description</TableHead>
                        <TableHead className="w-1/5">Make / Model</TableHead>
                        <TableHead className="w-1/5">IP / Quantity</TableHead>
                        <TableHead className="w-1/5 text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map(item => (
                        <EquipmentListItem key={item.id} equipment={item} onSelect={onSelect} allStations={allStations} />
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);


export const Dashboard: React.FC<DashboardProps> = ({ equipment, onSelectEquipment, site, title, activeSelection, allStations, allSites, allMarkets, allCompanies }) => {
    
    if (activeSelection.type === 'all_assets' || activeSelection.type === 'company' || activeSelection.type === 'market') {
        return (
            <AllEquipmentListView 
                equipment={equipment} 
                onSelectEquipment={onSelectEquipment} 
                allSites={allSites}
                allMarkets={allMarkets}
                allCompanies={allCompanies}
                allStations={allStations}
            />
        )
    }

    const renderEmptyState = () => (
        <Card className="flex flex-col items-center justify-center h-64">
            <CardContent className="text-center pt-6">
                <p className="text-xl text-foreground">No equipment found.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or selecting a different view from the sidebar.</p>
            </CardContent>
        </Card>
    );

    if (activeSelection.type === 'site_asset_category' || activeSelection.type === 'station') {
         if (!Array.isArray(equipment) || equipment.length === 0) {
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
                    {renderEmptyState()}
                </div>
            )
        }
        
        const isCardCategory = activeSelection.type === 'site_asset_category' && [EquipmentCategory.TRANSMITTER, EquipmentCategory.EXCITER].includes(activeSelection.category as EquipmentCategory);
        
        return (
             <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-4">{title}</h2>
                {isCardCategory ? <CardGrid items={equipment} onSelect={onSelectEquipment} allStations={allStations} /> : <ListGroup category={activeSelection.type === 'site_asset_category' ? activeSelection.category : 'Equipment'} items={equipment} onSelect={onSelectEquipment} allStations={allStations} />}
            </div>
        )
    }

    // Default view for a specific site
    const webUiEquipment = Array.isArray(equipment) ? equipment.filter(e => e.url) : [];
    const transmitterCards = Array.isArray(equipment) ? equipment.filter(e => e.category === EquipmentCategory.TRANSMITTER && !e.url) : [];
    const exciterCards = Array.isArray(equipment) ? equipment.filter(e => e.category === EquipmentCategory.EXCITER && !e.url) : [];
    
    const listEquipment = Array.isArray(equipment) ? equipment.filter(e => 
        !e.url &&
        e.category !== EquipmentCategory.TRANSMITTER &&
        e.category !== EquipmentCategory.EXCITER
    ) : [];
    
    const listEquipmentGroups = listEquipment.reduce((acc, curr) => {
        const category = curr.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(curr);
        return acc;
    }, {} as Record<string, AnyEquipment[]>);
    
    const categoryOrder = Object.values(EquipmentCategory);
    
  return (
    <div className="space-y-8">
      {site && <AiSiteAnalysis site={site} equipment={equipment} />}
      
      {site && <SiteNetworkInfo site={site} />}
      
      {site && <SiteMaintenanceHistory logs={site.maintenanceHistory || []} />}
        
      {(webUiEquipment.length === 0 && transmitterCards.length === 0 && exciterCards.length === 0 && listEquipment.length === 0) && renderEmptyState()}

        <>
            {webUiEquipment.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">Web Interfaces</h2>
                    <CardGrid items={webUiEquipment} onSelect={onSelectEquipment} allStations={allStations} />
                </div>
            )}
            {transmitterCards.length > 0 && (
                <div>
                     <h2 className="text-2xl font-bold text-foreground mb-4">Transmitters</h2>
                    <CardGrid items={transmitterCards} onSelect={onSelectEquipment} allStations={allStations}/>
                </div>
            )}
            {exciterCards.length > 0 && (
                <div>
                     <h2 className="text-2xl font-bold text-foreground mb-4">Exciters</h2>
                    <CardGrid items={exciterCards} onSelect={onSelectEquipment} allStations={allStations} />
                </div>
            )}
            
            {Object.keys(listEquipmentGroups).length > 0 && (
                 <div className="space-y-6">
                    {categoryOrder
                        .filter(cat => listEquipmentGroups[cat])
                        .map(category => (
                           <ListGroup key={category} category={category} items={listEquipmentGroups[category]} onSelect={onSelectEquipment} allStations={allStations} />
                        ))
                    }
                    {listEquipmentGroups['Other'] && (
                        <ListGroup key="Other" category="Other" items={listEquipmentGroups['Other']} onSelect={onSelectEquipment} allStations={allStations} />
                    )}
                </div>
            )}
        </>
    </div>
  );
};
