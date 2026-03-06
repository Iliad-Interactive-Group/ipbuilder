
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { AnyEquipment, EquipmentCategory, ACUnit, UPS, Generator, Transmitter } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const pluralizeCategory = (category: string): string => {
    if (!category) return 'Other';
    if (category === EquipmentCategory.SPARE_PARTS || category === EquipmentCategory.PROMOTIONS_EQUIPMENT) {
        return category;
    }
    if (category === EquipmentCategory.CAMERAS) {
        return 'Cameras';
    }
    if (category.endsWith('s')) {
        return `${category}es`;
    }
    return `${category}s`;
};

export interface MaintenanceStatus {
  level: 'ok' | 'due' | 'overdue';
  reasons: string[];
}

export interface InfoStatus {
  hasMissingInfo: boolean;
  missingFields: string[];
}


export const getEquipmentMaintenanceStatus = (equipment: AnyEquipment): MaintenanceStatus => {
  const status: MaintenanceStatus = { level: 'ok', reasons: [] };
  const now = new Date();
  const winterMonths = [0, 1, 10, 11]; // Jan, Feb, Nov, Dec
  const isWinter = winterMonths.includes(now.getMonth());

  const updateStatus = (newLevel: 'due' | 'overdue', reason: string) => {
    status.reasons.push(reason);
    if (newLevel === 'overdue') {
      status.level = 'overdue';
    } else if (newLevel === 'due' && status.level !== 'overdue') {
      status.level = 'due';
    }
  };
  
  const checkFilter = (lastChangeDate: string | undefined) => {
      if (!lastChangeDate) {
          updateStatus('overdue', 'Filter change date not recorded.');
      } else {
          const lastChange = new Date(lastChangeDate);
          const monthsSinceChange = (now.getFullYear() - lastChange.getFullYear()) * 12 + (now.getMonth() - lastChange.getMonth());
          const limit = isWinter ? 4 : 2;
          if (monthsSinceChange >= limit) {
              updateStatus('overdue', `Filter change is overdue (last changed ${lastChange.toLocaleDateString()}).`);
          } else if (monthsSinceChange >= limit - 0.5) { // Notify within the last ~2 weeks
              updateStatus('due', `Filter change is due soon (last changed ${lastChange.toLocaleDateString()}).`);
          }
      }
  };

  switch (equipment.category) {
    case EquipmentCategory.AC_UNIT:
      const ac = equipment as ACUnit;
      if (ac.airFilterSize) { checkFilter(ac.lastFilterChangeDate); }
      break;
    case EquipmentCategory.TRANSMITTER:
        const tx = equipment as Transmitter;
        if (tx.airFilterSize) { checkFilter(tx.lastFilterChangeDate); }
        break;
    case EquipmentCategory.UPS:
      const ups = equipment as UPS;
      if (ups.lastBatteryChangeDate) {
        const lastBatteryChange = new Date(ups.lastBatteryChangeDate);
        const yearsSinceChange = (now.getTime() - lastBatteryChange.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (yearsSinceChange >= 3) {
            updateStatus('overdue', `Batteries are over 3 years old (replaced ${lastBatteryChange.toLocaleDateString()}).`);
        } else if (yearsSinceChange >= 2.75) {
            updateStatus('due', `Batteries are approaching 3 years old (replaced ${lastBatteryChange.toLocaleDateString()}).`);
        }
      }
      break;
    case EquipmentCategory.GENERATOR:
      const gen = equipment as Generator;
      if (gen.greaseNeeded) {
        updateStatus('overdue', 'Generator needs grease.');
      }
      break;
  }
  return status;
}

export const getEquipmentInfoStatus = (equipment: AnyEquipment): InfoStatus => {
    const missingFields: string[] = [];
    if (!equipment.make) missingFields.push('Make');
    if (!equipment.modelNumber) missingFields.push('Model Number');
    if (!equipment.serialNumber) missingFields.push('Serial Number');

    switch(equipment.category) {
        case EquipmentCategory.AC_UNIT:
            if (!(equipment as ACUnit).airFilterSize) missingFields.push('Air Filter Size');
            break;
        case EquipmentCategory.TRANSMITTER:
            if (!(equipment as Transmitter).airFilterSize) missingFields.push('Air Filter Size');
            break;
        case EquipmentCategory.UPS:
            if (!(equipment as UPS).batteryModel) missingFields.push('Battery Model');
            break;
    }
    return { hasMissingInfo: missingFields.length > 0, missingFields };
}
