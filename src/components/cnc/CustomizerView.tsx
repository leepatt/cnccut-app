'use client';

import React, { useState } from 'react';
import ConfigSidebar from './ConfigSidebar';
import VisualizerArea from './VisualizerArea';
import { Button } from '@/components/ui/button'; // Assuming 21st.dev uses shadcn Button
import { ArrowLeft } from 'lucide-react';

type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder';

interface CustomizerViewProps {
  configType: ConfigType;
  onBack: () => void;
}

const CustomizerView: React.FC<CustomizerViewProps> = ({ configType, onBack }) => {
  // Placeholder state for demonstration - real state would be more complex
  const [configOptions, setConfigOptions] = useState<Record<string, any>>({});
  const [price, setPrice] = useState<number>(123.45);
  const [turnaround, setTurnaround] = useState<number>(3);

  const handleConfigChange = (newOptions: Record<string, any>) => {
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
    <div className="flex h-[calc(100vh-theme(space.28))] flex-col text-[#FAF0E6]">
      {/* Back Button / Header for this view */}
      <div className="mb-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="mr-2 h-8 w-8 text-[#FAF0E6] hover:bg-neutral-700 hover:text-[#FAF0E6]"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to Dashboard</span>
        </Button>
        <h1 className="text-xl font-semibold">Configure: {configType}</h1>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-grow gap-6 md:flex-row flex-col">
        {/* Left Column: Configuration Sidebar */}
        <aside className="w-full md:w-80 lg:w-96 flex-shrink-0">
          <ConfigSidebar
            configType={configType}
            options={configOptions}
            onChange={handleConfigChange}
          />
        </aside>

        {/* Right Column: Visualizer and Actions */}
        <section className="flex-grow">
          <VisualizerArea
             price={price}
             turnaround={turnaround}
             onAddToCart={handleAddToCart}
             onSaveConfig={handleSaveConfig}
             onReset={handleReset}
          />
        </section>
      </div>
    </div>
  );
};

export default CustomizerView; 