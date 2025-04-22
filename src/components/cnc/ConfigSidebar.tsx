'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Assuming 21st.dev uses shadcn Accordion
import { Input } from "@/components/ui/input"; // Assuming 21st.dev uses shadcn Input
import { Label } from "@/components/ui/label"; // Assuming 21st.dev uses shadcn Label
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming 21st.dev uses shadcn Select

type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder';

interface ConfigSidebarProps {
  configType: ConfigType;
  options: Record<string, any>;
  onChange: (newOptions: Record<string, any>) => void;
}

const ConfigSidebar: React.FC<ConfigSidebarProps> = ({ configType, options, onChange }) => {

  const handleChange = (field: string, value: string | number) => {
    onChange({ ...options, [field]: value });
  };

  // Placeholder fields - these would vary based on configType
  const renderFields = () => {
    switch (configType) {
      case 'Perforated Panels':
        return (
          <>
            {/* Example Input */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="panel-width" className="text-xs text-neutral-300">Panel Width (mm)</Label>
              <Input
                id="panel-width"
                type="number"
                placeholder="e.g., 1200"
                value={options.panelWidth || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('panelWidth', e.target.value)}
                className="border-neutral-600 bg-neutral-800 text-[#FAF0E6] placeholder:text-neutral-500 focus:border-[#B80F0A] focus:ring-[#B80F0A]"
              />
            </div>
            {/* Example Select */}
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="material" className="text-xs text-neutral-300">Material</Label>
              <Select
                value={options.material || ''}
                onValueChange={(value: string) => handleChange('material', value)}
              >
                <SelectTrigger id="material" className="border-neutral-600 bg-neutral-800 text-[#FAF0E6] focus:border-[#B80F0A] focus:ring-[#B80F0A]">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent className="border-neutral-600 bg-[#1A1A1A] text-[#FAF0E6]">
                  <SelectItem value="mdf" className="hover:bg-[#351210] focus:bg-[#351210]">MDF</SelectItem>
                  <SelectItem value="plywood" className="hover:bg-[#351210] focus:bg-[#351210]">Plywood</SelectItem>
                  <SelectItem value="oak" className="hover:bg-[#351210] focus:bg-[#351210]">Solid Oak</SelectItem>
                </SelectContent>
              </Select>
            </div>
             {/* Add more fields specific to Perforated Panels */}
          </>
        );
      // Add cases for 'Curves', 'Shape Builder', 'Box Builder' with relevant fields
      default:
        return <p className="text-neutral-400">Configuration options for {configType} coming soon.</p>;
    }
  };

  return (
    <div className="h-full overflow-y-auto rounded-md border border-neutral-700 bg-neutral-800/50 p-4">
        <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full text-[#FAF0E6]">
          <AccordionItem value="item-1" className="border-neutral-700">
            <AccordionTrigger className="hover:no-underline">Dimensions</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Render dimension fields based on configType */}
              {renderFields()}
              {/* Example */}
               <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="height" className="text-xs text-neutral-300">Height (mm)</Label>
                <Input id="height" type="number" placeholder="e.g., 800" className="border-neutral-600 bg-neutral-800 text-[#FAF0E6] placeholder:text-neutral-500 focus:border-[#B80F0A] focus:ring-[#B80F0A]"/>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-neutral-700">
            <AccordionTrigger className="hover:no-underline">Material & Finish</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
               {/* Render material/finish fields */}
               <p className="text-sm text-neutral-400">Material options here...</p>
            </AccordionContent>
          </AccordionItem>
          {configType === 'Perforated Panels' && (
             <AccordionItem value="item-3" className="border-neutral-700">
              <AccordionTrigger className="hover:no-underline">Pattern Details</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                 <p className="text-sm text-neutral-400">Pattern options here...</p>
              </AccordionContent>
            </AccordionItem>
          )}
          {/* Add more accordion items as needed */}
        </Accordion>
    </div>
  );
};

export default ConfigSidebar; 