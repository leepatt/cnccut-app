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
  const [quantity, setQuantity] = useState<number>(1); // Add quantity state

  // Removed Box Builder specific state (product, isLoading, error, boxConfig)
  // Removed Radius specific state (radiusBuilderState)
  // Removed useEffect for data fetching
  // Removed handleBoxConfigChange and handleRadiusStateChange

  const handleConfigChange = useCallback((newOptions: ConfigOptions) => {
    setConfigOptions(newOptions);
    // Recalculate price/turnaround based on newOptions AND QUANTITY
    const basePrice = Math.random() * 500; // Simulate base price calculation
    setPrice(basePrice * quantity); // Update total price based on quantity
    setTurnaround(Math.floor(Math.random() * 5) + 2); // Simulate turnaround change
  }, [quantity]); // Add quantity dependency

  const handleReset = useCallback(() => {
    setConfigOptions({});
    setQuantity(1); // Reset quantity to 1
    // Reset price/turnaround to defaults for this configType
    setPrice(123.45); // Reset price based on quantity 1
    setTurnaround(3);
  }, []);

  // Add handler for quantity changes
  const handleQuantityChange = useCallback((newQuantity: number) => {
    setQuantity(newQuantity);
    // Update total price based on new quantity and existing config
    // This assumes price calculation depends on configOptions stored in state
    // Re-using the simulated price logic for simplicity
    const basePrice = price / quantity; // Estimate base price from current total
    setPrice(basePrice * newQuantity);
  }, [price, quantity]);

  const handleAddToCart = useCallback(() => {
    console.log('Adding to cart:', { configType, options: configOptions, price, turnaround, quantity });
    // Add actual add to cart logic here
  }, [configType, configOptions, price, turnaround, quantity]);

  const handleSaveConfig = useCallback(() => {
    console.log('Saving configuration:', { configType, options: configOptions, quantity });
    // Add actual save logic here
  }, [configType, configOptions, quantity]);

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
                    price={price} // This should be total price including quantity
                    turnaround={turnaround}
                    onAddToCart={handleAddToCart}
                    onSaveConfig={handleSaveConfig}
                    onReset={handleReset}
                    // Pass quantity and handler
                    quantity={quantity}
                    onQuantityChange={handleQuantityChange}
                    // Pass placeholder cost breakdown props
                    sheets={1} // Placeholder
                    materialCost={price / 1.1 / quantity * 0.6} // Placeholder calculation
                    manufactureCost={price / 1.1 / quantity * 0.4} // Placeholder calculation
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