'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MaintenanceTemplate, EquipmentCategory, Station, CompanyWithMarkets } from '@/lib/types';
import { 
    ChevronDown, 
    ChevronRight, 
    Globe, 
    FileText, 
    Bot, 
    LayoutDashboard,
    Server,
    RadioTower,
    Computer,
    Network,
    Wind,
    Power,
    Car,
    Megaphone,
    Wrench,
    Camera,
    Antenna,
    Box,
    Radio,
    Satellite,
    Map,
    Database,
    Building,
    DatabaseZap,
    Siren,
    KeyRound,
    Trash2,
    Folder
} from 'lucide-react';
import { pluralizeCategory } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { archiveCompany, archiveMarket, archiveSite } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SidebarProps {
  companyHierarchy: CompanyWithMarkets[];
  allStations: Station[];
  templates: MaintenanceTemplate[];
  onSelectTemplate: (template: MaintenanceTemplate) => void;
  onAddMarket: () => void;
  onAddSite: (marketId: string) => void;
}

const NavLink: React.FC<{
  href: string;
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
  level?: number;
}> = ({ href, isActive, children, className = '', level = 0 }) => (
  <Link
    href={href}
    style={{ paddingLeft: `${0.75 + level * 1.5}rem` }}
    className={cn(
        `flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 group`, 
        className,
        isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
    )}
  >
    {children}
  </Link>
);

const CategoryIcon: React.FC<{ category?: EquipmentCategory | string; [key: string]: any }> = ({ category, ...props }) => {
    switch (category) {
        case EquipmentCategory.TRANSMITTER: return <RadioTower {...props} />;
        case EquipmentCategory.EXCITER: return <Server {...props} />;
        case EquipmentCategory.AUDIO_PROCESSOR: return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h3l3-9 4 18 3-9h9"/></svg>;
        case 'Computer': return <Computer {...props} />;
        case EquipmentCategory.NETWORK: return <Network {...props} />;
        case EquipmentCategory.AC_UNIT: return <Wind {...props} />;
        case EquipmentCategory.UPS: return <Power {...props} />;
        case EquipmentCategory.GENERATOR: return <svg {...props} width="24" height="24" viewBox="0:0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><line x1="6" y1="12" x2="7" y2="12"></line><line x1="10" y1="12" x2="11" y2="12"></line></svg>;
        case EquipmentCategory.STATION_VEHICLE: return <Car {...props} />;
        case EquipmentCategory.PROMOTIONS_EQUIPMENT: return <Megaphone {...props} />;
        case EquipmentCategory.SPARE_PARTS: return <Wrench {...props} />;
        case EquipmentCategory.CAMERAS: return <Camera {...props} />;
        case EquipmentCategory.STL: return <Antenna {...props} />;
        case EquipmentCategory.RDS_EAS: return <Siren {...props} />;
        case EquipmentCategory.MONITORING_CONTROL: return <Computer {...props} />;
        case EquipmentCategory.SATELLITE: return <Satellite {...props} />;
        default: return <Box {...props} />;
    }
};

const assetTypeFilters = Object.values(EquipmentCategory).filter(cat => cat !== EquipmentCategory.SPARE_PARTS);

export const AppSidebar: React.FC<SidebarProps> = ({ companyHierarchy, allStations, templates, onSelectTemplate, onAddMarket, onAddSite }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const activeView = searchParams.get('view');
  const activeId = searchParams.get('id');
  const activeCategory = searchParams.get('category');

  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Auto-expand based on active selection
    if (activeId && activeView && companyHierarchy.length > 0) {
        let companyId: string | undefined, marketId: string | undefined, siteId: string | undefined;
        const currentCompany = companyHierarchy[0];

        if (activeView === 'site' || activeView === 'site_asset_category') {
            siteId = activeId;
            const site = currentCompany.markets.flatMap(m => m.sites).find(s => s.id === siteId);
            if(site && site.marketId) {
                const market = currentCompany.markets.find(m => m.id === site.marketId);
                if(market) marketId = market.id;
            }
        } else if (activeView === 'market') {
            marketId = activeId;
        }

        if(currentCompany) setExpandedState(prev => ({...prev, [`company-${currentCompany.id}`]: true}));
        if(marketId) setExpandedState(prev => ({...prev, [`market-${marketId}`]: true}));
        if(siteId) setExpandedState(prev => ({...prev, [`site-${siteId}`]: true}));
    }
  }, [activeView, activeId, companyHierarchy]);


  const toggleExpansion = (name: string) => {
    setExpandedState(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleArchive = async (type: 'company' | 'market' | 'site', id: string, name: string) => {
    let result;
    if (type === 'company') result = await archiveCompany(id);
    if (type === 'market') result = await archiveMarket(id);
    if (type === 'site') result = await archiveSite(id);

    if (result?.success) {
      toast({ title: 'Archived', description: `${name} has been archived.` });
      // If the currently viewed item is the one archived, navigate home
      if (activeId === id) {
        router.push('/');
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result?.error });
    }
  };

  const sortedStations = [...allStations].sort((a,b) => (a.name || '').localeCompare(b.name || ''));

  return (
    <aside className="w-72 bg-card text-card-foreground flex flex-col border-r shrink-0">
      <div className="h-16 flex items-center justify-center shrink-0 border-b px-4">
        <h1 className="text-xl font-bold text-foreground">Broadcast InSite Pro</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-2 py-4 space-y-1">
            <NavLink href="/" isActive={!activeView || activeView === 'all_assets' || activeView === 'dashboard'}>
                <LayoutDashboard className="mr-3 shrink-0 h-5 w-5" />
                All Assets
            </NavLink>
            <NavLink href="/?view=ai_planner" isActive={activeView === 'ai_planner'}>
                <Bot className="mr-3 shrink-0 h-5 w-5" />
                AI Maintenance Planner
            </NavLink>
            <NavLink href="/?view=web_ui" isActive={activeView === 'web_ui'}>
                <Globe className="mr-3 shrink-0 h-5 w-5" />
                Web Interfaces
            </NavLink>
          
           <div className="border-t my-2"></div>
          
           <div>
            <div className="flex items-center px-1.5 mt-1">
               <Button variant="ghost" size="icon" onClick={() => toggleExpansion('Stations')} className="h-8 w-8 -ml-1 text-foreground/70 hover:text-foreground">
                {expandedState['Stations'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <span className="flex-grow text-foreground font-semibold pl-1 text-sm">Stations</span>
            </div>
            {expandedState['Stations'] && (
              <div className="space-y-1 mt-1">
                {sortedStations.map(station => (
                    <NavLink
                      key={station.id}
                      href={`/?view=station&id=${encodeURIComponent(station.id || '')}`}
                      isActive={activeView === 'station' && activeId === station.id}
                      level={1}
                      className="!pr-2"
                    >
                      <Satellite className="mr-3 shrink-0 h-5 w-5" />
                      <span className="flex-grow">{station.name}</span>
                    </NavLink>
                ))}
              </div>
            )}
          </div>
          
          <div className="border-t my-2"></div>
          
          <div className="space-y-1">
            {companyHierarchy.map(company => (
                <div key={company.id}>
                     <div className="flex items-center group/company" style={{ paddingLeft: `0rem` }}>
                        <Button variant="ghost" size="icon" onClick={() => toggleExpansion(`company-${company.id}`)} className="h-8 w-8 -ml-1 text-foreground/70 hover:text-foreground">
                          {expandedState[`company-${company.id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                        <NavLink href={`/?view=company&id=${company.id}`} isActive={activeView === 'company' && activeId === company.id} className="flex-grow !pl-1.5">
                            <Building className="mr-3 shrink-0 h-5 w-5" />
                            {company.name}
                        </NavLink>
                    </div>

                    {expandedState[`company-${company.id}`] && (
                        <div className="space-y-1 mt-1">
                            {company.markets.map(market => (
                                <div key={market.id}>
                                    <div className="flex items-center group/market" style={{ paddingLeft: `1rem` }}>
                                        <Button variant="ghost" size="icon" onClick={() => toggleExpansion(`market-${market.id}`)} className="h-8 w-8 -ml-1 text-foreground/70 hover:text-foreground">
                                          {expandedState[`market-${market.id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                        <NavLink href={`/?view=market&id=${market.id}`} isActive={activeView === 'market' && activeId === market.id} className="flex-grow !pl-1.5">
                                          <Map className="mr-3 shrink-0 h-5 w-5" />
                                          <span className="flex-grow">{market.name}</span>
                                        </NavLink>
                                    </div>

                                    {expandedState[`market-${market.id}`] && (
                                        <div className="space-y-1 mt-1">
                                            {market.sites.map(site => (
                                                <div key={site.id}>
                                                    <div className="flex items-center group/site" style={{ paddingLeft: `2rem` }}>
                                                         <Button variant="ghost" size="icon" onClick={() => toggleExpansion(`site-${site.id}`)} className="h-8 w-8 text-foreground/70 hover:text-foreground">
                                                            {expandedState[`site-${site.id}`] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                        </Button>
                                                        <NavLink href={`/?view=site&id=${site.id}`} isActive={activeView === 'site' && activeId === site.id} className="!pl-1.5 flex-grow">
                                                            <RadioTower className="mr-3 shrink-0 h-5 w-5" />
                                                            {site.name}
                                                        </NavLink>
                                                    </div>
                                                    {expandedState[`site-${site.id}`] && (
                                                      <div className="space-y-1 mt-1">
                                                          {assetTypeFilters.map(cat => (
                                                              <NavLink
                                                                key={cat}
                                                                href={`/?view=site_asset_category&id=${site.id}&category=${encodeURIComponent(cat)}`}
                                                                isActive={activeView === 'site_asset_category' && activeId === site.id && activeCategory === cat}
                                                                level={3}
                                                              >
                                                                <CategoryIcon category={cat} className="mr-3 shrink-0 h-5 w-5" />
                                                                {pluralizeCategory(cat)}
                                                              </NavLink>
                                                          ))}
                                                        
                                                        {site.stations && site.stations.length > 0 && (
                                                          <div className="space-y-1 mt-1">
                                                              {site.stations.map(station => (
                                                                  <NavLink
                                                                      key={station.id}
                                                                      href={`/?view=station&id=${station.id}`}
                                                                      isActive={activeView === 'station' && activeId === station.id}
                                                                      level={3}
                                                                      className="flex items-center gap-2"
                                                                  >
                                                                      <Radio className="mr-3 shrink-0 h-4 w-4" />
                                                                      <span className="truncate">{station.name}</span>
                                                                  </NavLink>
                                                              ))}
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
          </div>
        </nav>
        
        {activeView === 'site' && (
          <div className="px-2 py-4 space-y-1 border-t">
            <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Site Checklists</h2>
            {templates.map(template => (
              <a
                key={template.template_name}
                href="#"
                onClick={(e) => { e.preventDefault(); onSelectTemplate(template); }}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground/70 hover:bg-muted hover:text-foreground transition-colors duration-150"
              >
                <FileText className="mr-3 shrink-0 h-5 w-5" />
                <span>{template.template_name}</span>
              </a>
            ))}
          </div>
        )}
      </div>

       <div className="p-4 border-t shrink-0">
          <p className="text-xs text-muted-foreground text-center">© 2024 Broadcast InSite Pro</p>
      </div>
    </aside>
  );
};
