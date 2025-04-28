'use client';

import React, { useState, useCallback } from 'react';
import ConfigSidebar from './ConfigSidebar';
import { VisualizerPreview, QuoteActions } from './VisualizerArea';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Waves, LayoutGrid, Shapes } from 'lucide-react'; // Removed Box, Radius

// Adjusted ConfigType - If this type is defined elsewhere, import it
type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder';
// Removed Box Builder / Radius from the type definition here

// Use a more specific, yet still general type for options
type ConfigOptionValue = string | number | boolean;
type ConfigOptions = Record<string, ConfigOptionValue>;

interface CustomizerViewProps {
  // ConfigType might need adjustment if Box/Radius are truly removed
  configType: 'Curves' | 'Perforated Panels' | 'Shape Builder';
  onBack: () => void;
}

// Map configType to its icon component - Removed Box, Radius
const iconMap: Record<ConfigType, React.ElementType> = {
  'Curves': Waves,
  'Perforated Panels': LayoutGrid,
  'Shape Builder': Shapes,
};

// Simplified CustomizerView only for generic types
const CustomizerView: React.FC<CustomizerViewProps> = ({ configType, onBack }) => {
  // Simplified state - only for generic config options
  const [configOptions, setConfigOptions] = useState<ConfigOptions>({});
  const [price, setPrice] = useState<number>(123.45); // Example price
  const [turnaround, setTurnaround] = useState<number>(3); // Example turnaround

  // Removed Box Builder specific state (product, isLoading, error, boxConfig)
  // Removed Radius specific state (radiusBuilderState)
  // Removed useEffect for data fetching
  // Removed handleBoxConfigChange and handleRadiusStateChange

  const handleConfigChange = useCallback((newOptions: ConfigOptions) => {
    setConfigOptions(newOptions);
    // Recalculate price/turnaround based on newOptions
    setPrice(Math.random() * 500); // Simulate price change
    setTurnaround(Math.floor(Math.random() * 5) + 2); // Simulate turnaround change
  }, []);

  const handleReset = useCallback(() => {
    setConfigOptions({});
    // Reset price/turnaround to defaults for this configType
    setPrice(123.45);
    setTurnaround(3);
  }, []);

  const handleAddToCart = useCallback(() => {
    console.log('Adding to cart:', { configType, options: configOptions, price, turnaround });
    // Add actual add to cart logic here
  }, [configType, configOptions, price, turnaround]);

  const handleSaveConfig = useCallback(() => {
    console.log('Saving configuration:', { configType, options: configOptions });
    // Add actual save logic here
  }, [configType, configOptions]);

  // Removed radiusQuoteProps
  // Removed box dimension derivations

  return (
    <div className="flex h-[calc(100vh-theme(space.28))] flex-col text-foreground">
      {/* Back Button / Header */}
      <div className="mb-1 mt-[-1rem] flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2 h-10 w-10 text-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back to Dashboard</span>
        </Button>
        <div className="flex items-center gap-2">
          {/* Render icon based on the remaining types */}
          {configType in iconMap && React.createElement(iconMap[configType], { className: "h-5 w-5 text-primary" })}
          <h1 className="text-xl font-semibold">{configType}</h1>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-grow gap-6 md:flex-row flex-col">

        {/* Left Column: Configuration + Actions */}
        <aside className="w-full md:w-96 lg:w-[28rem] flex-shrink-0 flex flex-col space-y-6">
          {/* Configuration Form Area - Always use ConfigSidebar now */}
          <div className="flex-shrink-0">
              <ConfigSidebar
                configType={configType}
                options={configOptions}
                onChange={handleConfigChange}
              />
          </div>

          {/* Quote & Actions Area - Always use QuoteActions now */}
          <div className="flex-shrink-0">
                 <QuoteActions
                    price={price}
                    turnaround={turnaround}
                    onAddToCart={handleAddToCart}
                    onSaveConfig={handleSaveConfig}
                    onReset={handleReset}
                    // Add any necessary disabled states
                 />
          </div>
        </aside>

        {/* Right Column: Visualization - Always use VisualizerPreview now */}
        <main className="flex-grow min-h-[300px] md:min-h-0 rounded-lg border border-border bg-muted/40 flex items-center justify-center relative">
             <VisualizerPreview
              />
        </main>
      </div>
    </div>
  );
};

export default CustomizerView; 