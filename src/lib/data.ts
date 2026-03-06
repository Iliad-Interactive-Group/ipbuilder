import { MaintenanceTemplate } from './types';

export const getMaintenanceTemplates = (): MaintenanceTemplate[] => {
  return [
    {
      template_name: "Monthly Site Inspection",
      frequency: "Monthly",
      description: "Routine monthly check of all critical systems at the site.",
      tasks: [
        { task_group: "Site Exterior" },
        { task_description: "Check building exterior for damage or leaks.", db_field_name: "building_ok", input_type: "boolean" },
        { task_description: "Weed eat around building and fuel tanks.", db_field_name: "weeds_ok", input_type: "boolean" },
        { task_group: "HVAC System" },
        { task_description: "Check HVAC units for normal operation.", db_field_name: "hvac_ok", input_type: "boolean" },
        { task_description: "Filters changed this visit?", db_field_name: "hvac_filter_changed", input_type: "boolean" },
        { task_group: "Generator" },
        { task_description: "Check generator for leaks or alarms.", db_field_name: "gen_ok", input_type: "boolean" },
        { task_description: "Run generator under load for 15 minutes.", db_field_name: "gen_load_test_ok", input_type: "boolean" },
        { task_description: "Fuel Level (%)", db_field_name: "gen_fuel_level_pct", input_type: "numeric", units: "%" },
        { task_group: "Transmitter" },
        { task_description: "Record transmitter readings (Forward/Reflected Power).", db_field_name: "tx_readings", input_type: "text" },
        { task_description: "Clean transmitter air filters?", db_field_name: "tx_filter_changed", input_type: "boolean" },
      ]
    },
    {
      template_name: "Quarterly Deep Dive",
      frequency: "Quarterly",
      description: "In-depth quarterly service for major systems.",
      tasks: [
        { task_group: "Safety Equipment"},
        { task_description: "Check fire extinguisher charge and date.", db_field_name: "fire_extinguisher_ok", input_type: "boolean" },
        { task_description: "Test emergency lighting.", db_field_name: "emergency_lights_ok", input_type: "boolean" },
      ]
    },
  ];
};
