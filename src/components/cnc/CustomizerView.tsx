'use client';

import React, { useState, useEffect } from 'react';
import ConfigSidebar from './ConfigSidebar';
import { VisualizerPreview, QuoteActions } from './VisualizerArea';
import { Button } from '@/components/ui/button'; // Assuming 21st.dev uses shadcn Button
import { ArrowLeft, Waves, LayoutGrid, Shapes, Box } from 'lucide-react'; // Import necessary icons
import { BoxBuilderForm } from '@/components/products/box-builder/BoxBuilderForm';
import { ProductDefinition, Material } from '@/types';

type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder';

// Use a more specific, yet still general type for options
type ConfigOptionValue = string | number | boolean;
type ConfigOptions = Record<string, ConfigOptionValue>;

interface CustomizerViewProps {
  configType: ConfigType;
  onBack: () => void;
}

// Map configType to its icon component
const iconMap: Record<ConfigType, React.ElementType> = {
  'Curves': Waves,
  'Perforated Panels': LayoutGrid,
  'Shape Builder': Shapes,
  'Box Builder': Box,
};

const CustomizerView: React.FC<CustomizerViewProps> = ({ configType, onBack }) => {
  // Placeholder state for demonstration - real state would be more complex
  const [configOptions, setConfigOptions] = useState<ConfigOptions>({});
  const [price, setPrice] = useState<number>(123.45);
  const [turnaround, setTurnaround] = useState<number>(3);

  // State for Box Builder data
  const [boxBuilderProduct, setBoxBuilderProduct] = useState<ProductDefinition | null>(null);
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data using API routes
  useEffect(() => {
    if (configType === 'Box Builder') {
      const loadData = async () => {
        setIsLoading(true);
        setError(null);
        setBoxBuilderProduct(null);
        setMaterials(null);
        try {
          // Fetch product data
          const productRes = await fetch(`/api/products/box-builder`);
          if (!productRes.ok) {
              throw new Error(`Failed to fetch product: ${productRes.statusText}`);
          }
          const productData: ProductDefinition = await productRes.json();

          // Fetch materials data
          const materialsRes = await fetch(`/api/materials`);
           if (!materialsRes.ok) {
              throw new Error(`Failed to fetch materials: ${materialsRes.statusText}`);
          }
          const materialsData: Material[] = await materialsRes.json();

          setBoxBuilderProduct(productData);
          setMaterials(materialsData);

        } catch (err: unknown) {
          console.error("Failed to load Box Builder data via API:", err);
          const errorMessage = (err instanceof Error) ? err.message : 'Failed to load configuration data. Please try again.';
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
        // Reset Box Builder state if switching away
        setBoxBuilderProduct(null);
        setMaterials(null);
        setError(null);
        setIsLoading(false);
    }
  }, [configType]);

  const handleConfigChange = (newOptions: ConfigOptions) => {
    setConfigOptions(newOptions);
    // In a real app, recalculate price/turnaround based on newOptions
    setPrice(Math.random() * 500); // Simulate price change
    setTurnaround(Math.floor(Math.random() * 5) + 2); // Simulate turnaround change
  };

  const handleReset = () => {
    setConfigOptions({});
    // Reset price/turnaround to defaults for this configType
    setPrice(123.45);
    setTurnaround(3);
  }

  const handleAddToCart = () => {
    console.log('Adding to cart:', { configType, options: configOptions, price, turnaround });
    // Add actual add to cart logic here
  }

  const handleSaveConfig = () => {
    console.log('Saving configuration:', { configType, options: configOptions });
    // Add actual save logic here
  }

  return (
    <div className="flex h-[calc(100vh-theme(space.28))] flex-col text-foreground">
      {/* Back Button / Header for this view */}
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
          {React.createElement(iconMap[configType], { className: "h-5 w-5 text-primary" })}
          <h1 className="text-xl font-semibold">{configType}</h1>
        </div>
      </div>

      {/* Main Two-Column Layout - Adjusted structure */}
      <div className="flex flex-grow gap-6 md:flex-row flex-col">

        {/* Left Column: Configuration + Actions */}
        {/* Added flex flex-col and space-y-6 for spacing between form and actions */}
        <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col space-y-6">
          {/* Configuration Form Area */}
          <div className="flex-shrink-0">
            {configType === 'Box Builder' ? (
              isLoading ? (
                <div className="p-4 text-center">Loading Box Builder...</div>
              ) : error ? (
                <div className="p-4 text-red-500">{error}</div>
              ) : boxBuilderProduct && materials ? (
                <BoxBuilderForm product={boxBuilderProduct} materials={materials} />
              ) : (
                <div className="p-4 text-center">Could not load Box Builder data.</div>
              )
            ) : (
              <ConfigSidebar
                configType={configType}
                options={configOptions}
                onChange={handleConfigChange}
              />
            )}
          </div>

          {/* Quote & Actions Area - Moved below the form */}
          <div className="flex-shrink-0">
             <QuoteActions
                price={price}
                turnaround={turnaround}
                onAddToCart={handleAddToCart}
                onSaveConfig={handleSaveConfig}
                onReset={handleReset}
             />
          </div>
        </aside>

        {/* Right Column: Visualizer Preview Only */}
        {/* Ensure this section grows to fill available space and allows VisualizerPreview to fill height */}
        <section className="flex-grow flex">
          <VisualizerPreview />
        </section>

      </div>
    </div>
  );
};

export default CustomizerView; 