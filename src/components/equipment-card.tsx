
import React from 'react';
import { AnyEquipment, EquipmentCategory, SparePart, Station } from '@/lib/types';
import { 
    AlertTriangle, 
    Info,
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
    Globe,
    Siren,
    Satellite
} from 'lucide-react';
import { getEquipmentMaintenanceStatus, getEquipmentInfoStatus } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EquipmentCardProps {
  equipment: AnyEquipment;
  allStations: Station[];
  onSelect: (equipment: AnyEquipment) => void;
}

const CategoryIcon: React.FC<{ category?: EquipmentCategory | string; [key: string]: any }> = ({ category, ...props }) => {
    switch (category) {
        case EquipmentCategory.TRANSMITTER: return <RadioTower {...props} />;
        case EquipmentCategory.EXCITER: return <Server {...props} />;
        case EquipmentCategory.AUDIO_PROCESSOR: return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h3l3-9 4 18 3-9h9"/></svg>;
        case EquipmentCategory.COMPUTER: return <Computer {...props} />;
        case EquipmentCategory.NETWORK: return <Network {...props} />;
        case EquipmentCategory.AC_UNIT: return <Wind {...props} />;
        case EquipmentCategory.UPS: return <Power {...props} />;
        case EquipmentCategory.GENERATOR: return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="10" rx="2" ry="2"></rect><line x1="6" y1="12" x2="7" y2="12"></line><line x1="10" y1="12" x2="11" y2="12"></line></svg>;
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

export const EquipmentCard: React.FC<EquipmentCardProps> = ({ equipment, onSelect, allStations }) => {
  
  const handleWebLaunch = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const maintenanceStatus = getEquipmentMaintenanceStatus(equipment);
  const infoStatus = getEquipmentInfoStatus(equipment);
  const isSparePart = equipment.category === EquipmentCategory.SPARE_PARTS;

  const associatedStations = equipment.stationIds
    ? equipment.stationIds.map(id => allStations.find(s => s.id === id)).filter((s): s is Station => !!s)
    : [];

  return (
    <Card
      onClick={() => onSelect(equipment)}
      className="flex flex-col justify-between transition-all duration-200 group relative cursor-pointer hover:border-primary hover:shadow-lg"
    >
      <TooltipProvider>
        <div className="absolute top-2 right-2 flex gap-2">
          {infoStatus.hasMissingInfo && (
              <Tooltip>
                <TooltipTrigger>
                  <Info size={20} className="text-blue-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Missing Info: {infoStatus.missingFields.join(', ')}</p>
                </TooltipContent>
              </Tooltip>
          )}
          {maintenanceStatus.level !== 'ok' && (
              <Tooltip>
                <TooltipTrigger>
                   <AlertTriangle 
                      size={20}
                      className={maintenanceStatus.level === 'overdue' ? 'text-destructive' : 'text-orange-500'}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {maintenanceStatus.reasons.map((reason, i) => <p key={i}>{reason}</p>)}
                </TooltipContent>
              </Tooltip>
          )}
        </div>
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="truncate pr-8">{equipment.name}</CardTitle>
                <CategoryIcon category={equipment.category} className="text-muted-foreground flex-shrink-0" />
            </div>
            {associatedStations.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                  {associatedStations.map(station => (
                      <Tooltip key={station.id}>
                          <TooltipTrigger>
                              <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{station.name}</span>
                          </TooltipTrigger>
                          <TooltipContent>{station.name}</TooltipContent>
                      </Tooltip>
                  ))}
              </div>
            )}
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{equipment.description}</p>
            <p className="text-xs text-muted-foreground mt-1">
                {isSparePart ? 
                    `Serves: ${(equipment as SparePart).servicesModel || 'N/A'}`
                    : `${equipment.make || 'No Make'} - ${equipment.modelNumber || 'No Model'}`
                }
            </p>
        </CardContent>
        <CardFooter className="mt-4 pt-4 border-t flex justify-between items-center">
         <p className="text-sm font-semibold text-primary truncate pr-2">
            {isSparePart ? 
                <span className={`font-bold text-lg ${(equipment as SparePart).quantity > 0 ? 'text-green-600' : 'text-destructive'}`}>
                    QTY: {(equipment as SparePart).quantity}
                </span>
                : equipment.ipAddress?.join(', ') || 'No IP Address'
            }
         </p>
         {equipment.url && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleWebLaunch(e, equipment.url!)}
              title={`Open Web UI for ${equipment.name}`}
              className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100"
            >
              <Globe />
            </Button>
         )}
        </CardFooter>
      </TooltipProvider>
    </Card>
  );
};
