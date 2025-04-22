'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface VisualizerAreaProps {
  price: number;
  turnaround: number;
  onAddToCart: () => void;
  onSaveConfig: () => void;
  onReset: () => void;
}

const VisualizerArea: React.FC<VisualizerAreaProps> = ({
  price,
  turnaround,
  onAddToCart,
  onSaveConfig,
  onReset,
}) => {
  return (
    <div className="flex h-full flex-col space-y-6">
      {/* 3D Visualizer Placeholder */}
      <Card className="flex flex-grow items-center justify-center border-neutral-700 bg-neutral-800/50 text-neutral-400 min-h-[24rem] md:min-h-[30rem]">
        <CardContent className="p-6 text-center">
          <p className="text-lg font-medium">3D Preview Area</p>
          <p className="text-sm">(Interactive Visualizer Placeholder)</p>
        </CardContent>
      </Card>

      {/* Quote & Actions Section */}
      <Card className="flex-shrink-0 border-neutral-700 bg-neutral-800/50 text-[#FAF0E6]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Quote & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Estimated Price:</span>
            <span className="text-xl font-semibold text-[#FAF0E6]">
              ${price.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Estimated Turnaround:</span>
            <span className="font-medium text-[#FAF0E6]">
              {turnaround} Day{turnaround !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 pt-2 border-t border-neutral-700">
            <Button
              onClick={onAddToCart}
              className="flex-1 bg-[#B80F0A] text-[#FAF0E6] hover:bg-[#a10d09] focus:ring-[#B80F0A]"
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              onClick={onSaveConfig}
              className="flex-1 border-neutral-600 bg-neutral-700/50 text-[#FAF0E6] hover:bg-neutral-600/80 focus:ring-[#B80F0A]"
            >
              Save Configuration
            </Button>
            <Button
              variant="ghost"
              onClick={onReset}
              className="text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              size="sm"
            >
             <RotateCcw className="mr-1 h-4 w-4" /> Reset Options
            </Button>
          </div>
        </CardContent>
      </Card>
       {/* Placeholder for potential Tabs/Accordion for additional options if needed later */}
    </div>
  );
};

export default VisualizerArea; 