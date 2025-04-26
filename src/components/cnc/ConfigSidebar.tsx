'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder';
type ConfigOptionValue = string | number | boolean;
type ConfigOptions = Record<string, ConfigOptionValue>;

interface ConfigSidebarProps {
  configType: ConfigType;
  options: ConfigOptions;
  onChange: (newOptions: ConfigOptions) => void;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({ configType, options, onChange }) => {

  const handleChange = (field: string, value: string) => {
    onChange({ ...options, [field]: value });
  };

  const renderFields = () => {
    switch (configType) {
      case 'Perforated Panels': {
          const panelWidthValue = typeof options.panelWidth === 'string' || typeof options.panelWidth === 'number'
            ? options.panelWidth
            : '';
          const materialValue = typeof options.material === 'string' ? options.material : '';

          return (
            <>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                 {/* Use theme label color */}
                <Label htmlFor="panel-width" className="text-xs text-muted-foreground">Panel Width (mm)</Label>
                <Input
                  id="panel-width"
                  type="number"
                  placeholder="e.g., 1200"
                  value={panelWidthValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('panelWidth', e.target.value)}
                   // Use theme input styles
                  className="bg-input border border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring"
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                 {/* Use theme label color */}
                <Label htmlFor="material" className="text-xs text-muted-foreground">Material</Label>
                <Select
                  value={materialValue}
                  onValueChange={(value: string) => handleChange('material', value)}
                >
                   {/* Use theme select styles */}
                  <SelectTrigger id="material" className="bg-input border border-input text-foreground focus:border-primary focus:ring-ring">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                   {/* Use theme dropdown styles */}
                  <SelectContent className="border-border bg-popover text-popover-foreground">
                     {/* Use theme item styles */}
                    <SelectItem value="mdf" className="hover:bg-accent focus:bg-accent">MDF</SelectItem>
                    <SelectItem value="plywood" className="hover:bg-accent focus:bg-accent">Plywood</SelectItem>
                    <SelectItem value="oak" className="hover:bg-accent focus:bg-accent">Solid Oak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          );
        }
      default:
         // Use muted foreground
        return <p className="text-muted-foreground">Configuration options for {configType} coming soon.</p>;
    }
  };

  return (
     // Use card/popover styling for the container
    <div className="h-full overflow-y-auto rounded-md border border-border bg-card p-4">
        {/* Ensure Accordion uses theme styles */}
        <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full text-foreground">
          <AccordionItem value="item-1" className="border-border">
            <AccordionTrigger className="hover:no-underline">Dimensions</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {renderFields()}
              <div className="grid w-full max-w-sm items-center gap-1.5">
                 {/* Use theme label color */}
                <Label htmlFor="height" className="text-xs text-muted-foreground">Height (mm)</Label>
                 {/* Use theme input styles */}
                <Input id="height" type="number" placeholder="e.g., 800" className="bg-input border border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-ring"/>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-border">
            <AccordionTrigger className="hover:no-underline">Material & Finish</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
               {/* Use muted foreground */}
               <p className="text-sm text-muted-foreground">Material options here...</p>
            </AccordionContent>
          </AccordionItem>
          {configType === 'Perforated Panels' && (
             <AccordionItem value="item-3" className="border-border">
              <AccordionTrigger className="hover:no-underline">Pattern Details</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                  {/* Use muted foreground */}
                 <p className="text-sm text-muted-foreground">Pattern options here...</p>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
    </div>
  );
};

export default ConfigSidebar; 