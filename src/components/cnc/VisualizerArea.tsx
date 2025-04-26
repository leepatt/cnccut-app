'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Minus, Plus } from 'lucide-react';

// Interface for QuoteActions props
interface QuoteActionsProps {
  price: number;
  turnaround: number;
  onAddToCart: () => void;
  onSaveConfig: () => void;
  onReset: () => void;
}

// Component for the 3D Visualizer Preview Area
export const VisualizerPreview: React.FC = () => {
  return (
    // Removed outer div and space-y, adjusted flex-grow
    <Card className="flex h-full flex-grow items-center justify-center border border-border bg-card text-card-foreground min-h-[24rem] md:min-h-[30rem]">
      <CardContent className="p-6 text-center">
        <p className="text-lg font-medium">3D Preview Area</p>
        <p className="text-sm text-muted-foreground">(Interactive Visualizer Placeholder)</p>
      </CardContent>
    </Card>
  );
};

// Component for the Quote & Actions Section
export const QuoteActions: React.FC<QuoteActionsProps> = ({
  price,
  turnaround,
  onAddToCart,
  onSaveConfig,
  onReset,
}) => {
  // Add state for quantity
  const [quantity, setQuantity] = useState(1);

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1)); // Prevent quantity < 1
  };

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  return (
    // Removed CardHeader, adjust padding if needed (space-y-4 handles internal spacing)
    <Card className="flex-shrink-0 border border-border bg-card text-card-foreground">
      {/* Removed CardHeader */}
      <CardContent className="p-4 space-y-4"> {/* Explicit padding p-4 */}
        {/* Quantity Selector */}
        <div className="flex items-center justify-between">
           <span className="text-sm font-medium text-muted-foreground">Quantity</span>
           <div className="flex items-center border border-border rounded-md">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={decreaseQuantity} aria-label="Decrease quantity">
               <Minus className="h-4 w-4" />
             </Button>
             <span className="px-3 text-sm font-medium text-center w-10" aria-live="polite">{quantity}</span>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={increaseQuantity} aria-label="Increase quantity">
               <Plus className="h-4 w-4" />
             </Button>
           </div>
        </div>

        {/* Estimated Price */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Estimated Price:</span>
          <span className="text-xl font-semibold text-foreground">
            ${(price * quantity).toFixed(2)} {/* Multiply price by quantity */}
          </span>
        </div>
        {/* Estimated Turnaround */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Estimated Turnaround:</span>
          <span className="font-medium text-foreground">
            {turnaround} Day{turnaround !== 1 ? 's' : ''}
          </span>
        </div>

         {/* Action Buttons Section */}
        <div className="mt-4 flex flex-col space-y-2 pt-4 border-t border-border">
           {/* Reset Button - Moved up, full width, renamed, icon removed */}
           <Button
            variant="ghost"
            onClick={onReset}
            className="w-full text-muted-foreground hover:bg-muted hover:text-foreground"
            size="sm" // Keep size small for consistency?
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Reset Configuration
          </Button>
          {/* Add to Cart / Save Buttons */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => onAddToCart()} // Pass quantity if needed by parent
              className="flex-1"
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              onClick={onSaveConfig}
              className="flex-1"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Default export can be removed or point to one of the components if needed elsewhere directly
// export default VisualizerArea; // Original default export removed 