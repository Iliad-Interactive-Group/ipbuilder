
'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Site, AnyEquipment, MaintenanceTemplate, Selection, EquipmentCategory, Station, Asset, Market, Company, CompanyWithMarkets, AnySecret, ChangeEvent } from '@/lib/types';
import { getMaintenanceTemplates } from '@/lib/data';
import { useCompanies, useMarkets, useSites, useStations, useEquipment, useAllAssets, useSecrets, useChangelog } from '@/lib/hooks';

import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { Dashboard } from '@/components/dashboard';
import { EquipmentDetailModal } from '@/components/modals/equipment-detail-modal';
import { AddEquipmentModal } from '@/components/modals/add-equipment-modal';
import { EditEquipmentModal } from '@/components/modals/edit-equipment-modal';
import { SiteChecklistModal } from '@/components/modals/site-checklist-modal';
import { AddSiteMarketModal, AddModalMode } from '@/components/modals/add-site-market-modal';
import { AddStationModal } from '@/components/modals/add-station-modal';
import { AiPlannerDashboard } from '@/components/ai-planner-dashboard';
import { DataManagementDashboard } from '@/components/data-management-dashboard';
import { RawDataView } from '@/components/raw-data-view';
import { pluralizeCategory } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { CredentialsDashboard } from '@/components/credentials-dashboard';
import { TopNav } from '@/components/top-nav';
import { ChangelogDashboard } from '@/components/changelog-dashboard';


function AppContent() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [allCompanies, companiesLoading, companiesError] = useCompanies();
  const [allMarkets, marketsLoading, marketsError] = useMarkets();
  const [allSites, sitesLoading, sitesError] = useSites();
  const [allStations, stationsLoading, stationsError] = useStations();
  const [allEquipment, equipmentLoading, equipmentError] = useEquipment();
  const [allAssets, assetsLoading, assetsError] = useAllAssets();
  const [allSecrets, secretsLoading, secretsError] = useSecrets();
  const [changelog, changelogLoading, changelogError] = useChangelog();
  
  const loading = authLoading || companiesLoading || marketsLoading || sitesLoading || stationsLoading || equipmentLoading || assetsLoading || secretsLoading || changelogLoading;

  const maintenanceTemplates = useMemo(() => getMaintenanceTemplates(), []);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [addSiteMarketModalState, setAddSiteMarketModalState] = useState<{isOpen: boolean, mode: AddModalMode, marketId?: string}>({isOpen: false, mode: 'market'});
  const [isAddStationModalOpen, setIsAddStationModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeChecklistTemplate, setActiveChecklistTemplate] = useState<MaintenanceTemplate | null>(null);
  
  const selectedEquipment = useMemo(() => {
    if (!selectedEquipmentId) return null;
    return allEquipment.find(eq => eq.id === selectedEquipmentId) || null;
  }, [selectedEquipmentId, allEquipment]);

  const activeSelection = useMemo((): Selection => {
    const view = searchParams.get('view');
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    
    // Handle main navigation views first
    if (view === 'data_management') return { type: 'data_management' };
    if (view === 'raw_data') return { type: 'raw_data' };
    if (view === 'credentials') return { type: 'credentials' };
    if (view === 'changelog') return { type: 'changelog' };

    // Default to dashboard/asset views
    if (view === 'company' && id) {
      const company = allCompanies.find(c => c.id === id);
      return company ? { type: 'company', company } : { type: 'all_assets' };
    }
    if (view === 'market' && id) {
      const market = allMarkets.find(m => m.id === id);
      return market ? { type: 'market', market } : { type: 'all_assets' };
    }
    if (view === 'site' && id) {
      const site = allSites.find(s => s.id === id);
      return site ? { type: 'site', site } : { type: 'all_assets' };
    }
    if (view === 'station' && id) {
      const station = allStations.find(s => s.id === id);
      return station ? { type: 'station', station } : { type: 'all_assets' };
    }
    if (view === 'site_asset_category' && id && category) {
        const site = allSites.find(s => s.id === id);
        return site ? { type: 'site_asset_category', site, category: category as EquipmentCategory } : { type: 'all_assets' };
    }
    if (view === 'web_ui') {
      return { type: 'web_ui_filter' };
    }
    if (view === 'ai_planner') {
      return { type: 'ai_planner' };
    }

    return { type: 'all_assets' };
  }, [searchParams, allCompanies, allMarkets, allSites, allStations]);
  
  const companyHierarchy: CompanyWithMarkets[] = useMemo(() => {
    if (companiesLoading || marketsLoading || sitesLoading || stationsLoading || !allCompanies.length) return [];

    return allCompanies.map(company => {
      const marketsForCompany = allMarkets
        .filter(market => market.companyId === company.id)
        .map(market => {
          const sitesForMarket = allSites
            .filter(site => site.marketId === market.id)
            .map(site => {
              const stationsForSite = allStations.filter(station => station.siteId === site.id);
              return { ...site, stations: stationsForSite.sort((a,b) => (a.name || '').localeCompare(b.name || '')) };
            })
            .sort((a,b) => (a.name || '').localeCompare(b.name || ''));
          return { ...market, sites: sitesForMarket };
        })
        .sort((a,b) => (a.name || '').localeCompare(b.name || ''));
      
      return { ...company, markets: marketsForCompany };
    });
  }, [allCompanies, allMarkets, allSites, allStations, companiesLoading, marketsLoading, sitesLoading, stationsLoading]);

  const filteredEquipment = useMemo(() => {
    let equipmentToFilter: AnyEquipment[] = [];
    
    switch (activeSelection.type) {
      case 'all_assets':
        equipmentToFilter = allEquipment;
        break;
      case 'company':
        equipmentToFilter = allEquipment.filter(eq => eq.companyId === activeSelection.company.id);
        break;
      case 'market':
        equipmentToFilter = allEquipment.filter(eq => eq.marketId === activeSelection.market.id);
        break;
      case 'site':
        equipmentToFilter = allEquipment.filter(eq => eq.siteId === activeSelection.site.id);
        break;
      case 'station':
        equipmentToFilter = allEquipment.filter(eq => eq.stationIds?.includes(activeSelection.station.id));
        break;
      case 'site_asset_category':
        equipmentToFilter = allEquipment.filter(eq => eq.siteId === activeSelection.site.id && (eq.equipmentType === activeSelection.category || eq.category === activeSelection.category));
        break;
      case 'web_ui_filter':
        equipmentToFilter = allEquipment.filter(eq => !!(eq.url && eq.url.trim() !== ''));
        break;
      default:
        equipmentToFilter = [];
        break;
    }

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      return equipmentToFilter.filter(eq =>
        (eq.name || '').toLowerCase().includes(lowercasedQuery) ||
        (eq.description || '').toLowerCase().includes(lowercasedQuery) ||
        (eq.modelNumber || '').toLowerCase().includes(lowercasedQuery) ||
        (eq.serialNumber || '').toLowerCase().includes(lowercasedQuery) ||
        (eq.make || '').toLowerCase().includes(lowercasedQuery) ||
        (Array.isArray(eq.ipAddress) && eq.ipAddress.some(ip => ip.toLowerCase().includes(lowercasedQuery))) ||
        (eq.category && eq.category.toLowerCase().includes(lowercasedQuery)) ||
        (eq.equipmentType && eq.equipmentType.toLowerCase().includes(lowercasedQuery))
      );
    }

    return equipmentToFilter.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  }, [searchQuery, activeSelection, allEquipment]);
  
  const headerName = useMemo(() => {
    if (activeSelection.type === 'company') return activeSelection.company.name;
    if (activeSelection.type === 'market') return activeSelection.market.name;
    if (activeSelection.type === 'site') return activeSelection.site.name;
    if (activeSelection.type === 'station') return activeSelection.station.name;
    if (activeSelection.type === 'site_asset_category') return `${pluralizeCategory(activeSelection.category)} at ${activeSelection.site.name}`;
    if (activeSelection.type === 'web_ui_filter') return 'All Web Interfaces';
    if (activeSelection.type === 'ai_planner') return 'AI Maintenance Planner';
    if (activeSelection.type === 'data_management') return 'Data Management';
    if (activeSelection.type === 'raw_data') return 'Raw Firestore Data';
    if (activeSelection.type === 'credentials') return 'Credentials Manager';
    if (activeSelection.type === 'changelog') return 'Changelog';
    return 'All Company Equipment';
  }, [activeSelection]);

  const dashboardTitle = useMemo(() => {
      if (activeSelection.type === 'company') return `All Equipment for ${activeSelection.company.name}`;
      if (activeSelection.type === 'market') return `Equipment in ${activeSelection.market.name}`;
      if (activeSelection.type === 'site') return `Equipment at ${activeSelection.site.name}`;
      if (activeSelection.type === 'station') return `Equipment for ${activeSelection.station.name}`;
      if (activeSelection.type === 'site_asset_category') return `Viewing ${pluralizeCategory(activeSelection.category)} at ${activeSelection.site.name}`;
      if (activeSelection.type === 'web_ui_filter') return `All Equipment with a Web Interface`;
      return 'All Company Equipment';
  }, [activeSelection]);

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-12 w-1/3" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    const anyError = assetsError || secretsError || changelogError;
    if (anyError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            There was a problem fetching data from the database. Please check the browser console for more details and ensure Firestore security rules are configured correctly.
            <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs text-muted-foreground">{anyError}</pre>
          </AlertDescription>
        </Alert>
      )
    }

    switch (activeSelection.type) {
      case 'ai_planner':
        return <AiPlannerDashboard allSites={allSites} allEquipment={allEquipment} />;
      case 'data_management':
        return <DataManagementDashboard allMarkets={allMarkets} allSites={allSites} onAddStation={() => setIsAddStationModalOpen(true)}/>;
      case 'raw_data':
        return <RawDataView assets={allAssets} />;
      case 'credentials':
        return <CredentialsDashboard secrets={allSecrets} />;
      case 'changelog':
        return <ChangelogDashboard changelog={changelog} />;
      default:
        return (
          <Dashboard 
            equipment={filteredEquipment}
            title={dashboardTitle}
            onSelectEquipment={(eq) => setSelectedEquipmentId(eq.id)}
            site={activeSelection.type === 'site' ? activeSelection.site : null}
            activeSelection={activeSelection}
            allStations={allStations}
            allSites={allSites}
            allMarkets={allMarkets}
            allCompanies={allCompanies}
          />
        );
    }
  };

  const locationContext = useMemo(() => {
    if (!selectedEquipment) return '';
    const parts = [];
    if (selectedEquipment.siteId) {
        const site = allSites.find(s => s.id === selectedEquipment.siteId);
        if (site) parts.push(`Site: ${site.name}`);
    } else {
        parts.push('Corporate Asset');
    }
    
    if (selectedEquipment.stationIds && selectedEquipment.stationIds.length > 0) {
        const stationNames = selectedEquipment.stationIds.map(id => allStations.find(s => s.id === id)?.name).filter(Boolean).join(', ');
        if(stationNames) parts.push(`Station(s): ${stationNames}`);
    }
    
    return parts.join(' | ');
  }, [selectedEquipment, allSites, allStations]);

  const isDashboardView = !['ai_planner', 'data_management', 'raw_data', 'credentials', 'changelog'].includes(activeSelection.type);
  const showAddItemButton = isDashboardView;
  const isAddContextValid = isDashboardView;
  
  return (
    <div className="flex h-screen bg-background">
      {isDashboardView && (
        <AppSidebar 
          companyHierarchy={companyHierarchy}
          allStations={allStations}
          templates={maintenanceTemplates}
          onSelectTemplate={setActiveChecklistTemplate}
          onAddMarket={() => setAddSiteMarketModalState({isOpen: true, mode: 'market'})}
          onAddSite={(marketId) => setAddSiteMarketModalState({isOpen: true, mode: 'site', marketId: marketId})}
        />
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          siteName={headerName || 'Loading...'}
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          onAddItemClick={() => setIsAddEquipmentModalOpen(true)}
          isAddDisabled={!isAddContextValid}
          showAddItemButton={showAddItemButton}
        />
        <TopNav activeView={activeSelection.type} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/40 p-6">
          {renderMainContent()}
        </main>
      </div>

      {selectedEquipment && (
        <EquipmentDetailModal
          key={selectedEquipment.id}
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipmentId(null)}
          onEditClick={() => setIsEditModalOpen(true)}
          locationContext={locationContext}
          allEquipment={allEquipment}
          allStations={allStations}
        />
      )}
      {isAddEquipmentModalOpen && (
        <AddEquipmentModal
            onClose={() => setIsAddEquipmentModalOpen(false)}
            allSites={allSites}
            allStations={allStations}
            selection={activeSelection}
        />
      )}
      {addSiteMarketModalState.isOpen && (
        <AddSiteMarketModal
            mode={addSiteMarketModalState.mode}
            marketId={addSiteMarketModalState.marketId}
            existingMarkets={allMarkets}
            onClose={() => setAddSiteMarketModalState({isOpen: false, mode: 'market'})}
        />
      )}
      {isAddStationModalOpen && (
        <AddStationModal 
            allSites={allSites}
            onClose={() => setIsAddStationModalOpen(false)}
        />
      )}
      {isEditModalOpen && selectedEquipment && (
        <EditEquipmentModal
          equipment={selectedEquipment}
          allSites={allSites}
          allStations={allStations}
          onClose={() => setIsEditModalOpen(false)}
          onSave={() => {
            setIsEditModalOpen(false);
          }}
        />
      )}
      {activeChecklistTemplate && activeSelection.type === 'site' && (
        <SiteChecklistModal
            template={activeChecklistTemplate}
            site={activeSelection.site}
            onClose={() => setActiveChecklistTemplate(null)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    }>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Suspense>
  );
}

    