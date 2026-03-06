
import { User } from 'firebase/auth';

export type CollectionName = 'companies' | 'markets' | 'sites' | 'stations' | 'equipment' | 'secrets' | 'archive' | 'changelog';

export enum EquipmentCategory {
  TRANSMITTER = 'Transmitter',
  EXCITER = 'Exciter',
  AUDIO_PROCESSOR = 'Audio Processor',
  COMPUTER = 'Computer',
  NETWORK = 'Network',
  AC_UNIT = 'Air Conditioner',
  UPS = 'UPS',
  GENERATOR = 'Generator',
  STATION_VEHICLE = 'Station Vehicle',
  PROMOTIONS_EQUIPMENT = 'Promotions Equipment',
  SPARE_PARTS = 'Spare Parts',
  CAMERAS = 'Cameras',
  STL = 'Studio-Transmitter Link',
  RDS_EAS = 'RDS/EAS',
  MONITORING_CONTROL = 'Monitoring/Control',
  SATELLITE = 'Satellite',
  OTHER = 'Other',
}

export type MaintenanceType = 'Routine' | 'Emergency Repair' | 'Installation' | 'Part Replacement' | 'Note';

export interface MaintenanceLog {
  id: string;
  date: string; // ISO string
  notes: string;
  technician: string;
  type: MaintenanceType;
}

export type AttachmentType = 'Manual' | 'Receipt' | 'Warranty' | 'Other';

export interface Attachment {
    id: string;
    fileName: string;
    fileType: string; // Mime type e.g. "application/pdf"
    size: number; // in bytes
    type: AttachmentType;
    url: string; // URL to the file in Firebase Storage
}

interface BaseAsset {
  id: string;
  status?: 'Active' | 'Archived';
  archivedAt?: string; // ISO string
  type: 'COMPANY' | 'MARKET' | 'SITE' | 'STATION' | 'EQUIPMENT';
  name?: string;
}

// Base Interface for all equipment
export interface Equipment extends BaseAsset {
  type: 'EQUIPMENT';
  description?: string; 
  category?: EquipmentCategory | string;
  equipmentType?: string;
  
  // Relational Fields
  companyId?: string;
  marketId?: string;
  siteId?: string;
  stationIds?: string[];
  
  // Core Fields
  make?: string;
  modelNumber?: string;
  serialNumber?: string;
  ipAddress?: string[];
  url?: string;
  username?: string;
  notes?: string;
  
  // Location & Quantity
  locationInSite?: string; 
  storageLocation?: string;
  quantity?: number;
  
  // Maintenance & Lifecycle
  installDate?: string; // ISO String
  acquisitionDate?: string; // ISO String
  warrantyEndDate?: string; // ISO String
  lastServiceDate?: string; // ISO String
  nextServiceDate?: string; // ISO String
  maintenanceHistory?: MaintenanceLog[];
  attachments?: Attachment[];

  // Technical Specs
  firmwareVersion?: string;
  powerConsumptionWatts?: number;
  rackUnitSize?: number;

  // Controller
  controllerId?: string;
}

// Extended Interfaces for specific equipment types
export interface Transmitter extends Equipment {
  category: EquipmentCategory.TRANSMITTER | 'RF Transmitter' | 'RF Exciter';
  tpo?: number;
  erp?: number;
  paModuleType?: string;
  powerSupplyType?: string;
  filamentType?: string;
  fuseType?: string;
  airFilterSize?: string;
  lastPaChangeDate?: string; // ISO string
  lastPsuChangeDate?: string; // ISO string
  lastFilamentChangeDate?: string; // ISO string
  lastFilterChangeDate?: string; // ISO string
  fuseStock?: number;
  filterCount?: number;
}

export interface Exciter extends Equipment {
    category: EquipmentCategory.EXCITER | 'RF Exciter';
    exciterOutput?: number;
}

export interface ACUnit extends Equipment {
  category: EquipmentCategory.AC_UNIT;
  airFilterSize?: string;
  lastFilterChangeDate?: string; // ISO string
  filterCount?: number;
  blowerBeltType?: string;
  beltCount?: number;
}

export interface UPS extends Equipment {
  category: EquipmentCategory.UPS;
  batteryModel?: string;
  lastBatteryChangeDate?: string; // ISO string
  batteryCount?: number;
}

export interface Generator extends Equipment {
  category: EquipmentCategory.GENERATOR;
  lastRefuelDate?: string; // ISO string
  fuelLevelPercent?: number;
  blowerBeltType?: string;
  lastBeltCheckDate?: string; // ISO string
  greaseType?: string;
  greaseNeeded?: boolean | string;
}

export interface StationVehicle extends Equipment {
    category: EquipmentCategory.STATION_VEHICLE;
    vin?: string;
    licensePlate?: string;
    useType?: string;
}

export interface SparePart extends Equipment {
  category: EquipmentCategory.SPARE_PARTS;
  quantity: number;
  servicesModel?: string;
  compatibleEquipment?: string;
}

export type AnyEquipment = 
    | Transmitter 
    | Exciter
    | ACUnit 
    | UPS 
    | Generator 
    | StationVehicle
    | SparePart 
    | (Equipment & { category?: EquipmentCategory | string });


export interface NetworkInfo {
  network_name?: string;
  subnet?: string;
  external_ip?: string;
  gateway?: string;
  dns_servers?: string[];
}

export interface Company extends BaseAsset {
  type: 'COMPANY';
  name: string;
}

export interface Market extends BaseAsset {
  type: 'MARKET';
  name: string;
  companyId: string;
}

export interface Site extends BaseAsset {
  type: 'SITE';
  name: string;
  shortName?: string;
  marketId: string;
  companyId: string;
  location?: string;
  mapUrl?: string;
  networks?: NetworkInfo[];
  maintenanceHistory?: SiteMaintenanceLog[];
}

export interface Station extends BaseAsset {
    type: 'STATION';
    name: string;
    siteId: string;
    marketId: string;
    companyId: string;
    pronunciation?: string;
    callSign?: string;
    signal?: string;
    fin?: string;
    col?: string;
    rawStreamUrl?: string;
    historyJsonUrl?: string;
}

export type Asset = AnyEquipment | Site | Station | Market | Company;

export interface MaintenanceTask {
    task_group?: string;
    task_description?: string;
    input_type?: 'numeric' | 'boolean' | 'text' | 'header';
    db_field_name?: string;
    units?: string;
}

export interface MaintenanceTemplate {
  template_name: string;
  frequency: string;
  description: string;
  tasks: MaintenanceTask[];
}

export interface SiteMaintenanceLog {
  id: string;
  templateName: string;
  date: string; // ISO string
  technician: string;
  data: Record<string, string | number | boolean>;
}

// Sidebar hierarchy types
export type SiteWithStations = Site & { stations: Station[] };
export type MarketWithSites = Market & { sites: SiteWithStations[] };
export type CompanyWithMarkets = Company & { markets: MarketWithSites[] };


export type Selection = 
  | { type: 'all_assets' }
  | { type: 'company'; company: Company }
  | { type: 'market'; market: Market }
  | { type: 'site'; site: Site }
  | { type: 'station'; station: Station }
  | { type: 'site_asset_category'; site: Site; category: EquipmentCategory | string }
  | { type: 'web_ui_filter' }
  | { type: 'ai_planner' }
  | { type: 'data_management' }
  | { type: 'raw_data' }
  | { type: 'credentials' }
  | { type: 'changelog' };

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Secrets Management Types
export interface SecretBase {
    id: string;
    type: 'websitePassword' | 'gateCode' | 'multiLogin' | 'customFields' | 'secureNote';
    organizationId: string;
    name: string;
    description: string;
    tags: string[];
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    createdBy: string;
    updatedBy: string;
    notes?: string;
}

export interface WebsitePassword extends SecretBase {
    type: 'websitePassword';
    url: string;
    username: string;
    password?: string;
}

export interface GateCode extends SecretBase {
    type: 'gateCode';
    location: string;
    code: string;
    unlockInstructions?: string;
}

export interface MultiLoginAccount {
    username: string;
    password?: string;
    label: string;
    notes?: string;
}

export interface MultiLogin extends SecretBase {
    type: 'multiLogin';
    url?: string;
    accounts: MultiLoginAccount[];
}

export interface CustomField {
    name: string;
    value: string;
    isSecret: boolean;
}

export interface CustomFieldsSecret extends SecretBase {
    type: 'customFields';
    fields: CustomField[];
}

export interface SecureNote extends SecretBase {
    type: 'secureNote';
    content: string;
}

export type AnySecret = WebsitePassword | GateCode | MultiLogin | CustomFieldsSecret | SecureNote;


// Changelog
export interface ChangeEvent {
    id: string;
    timestamp: string; // ISO string
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'archive' | 'batch-archive';
    collection: CollectionName;
    docId: string;
    docName?: string;
    summary: string;
}

    