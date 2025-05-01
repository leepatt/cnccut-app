'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, Minus, Plus, Sheet, Wrench } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

// Interface for QuoteActions props
interface QuoteActionsProps {
  price: number; // This is total price including GST
  turnaround: number;
  onAddToCart: () => void;
  onSaveConfig: () => void;
  onReset: () => void;
  isAddToCartDisabled?: boolean; 
  isSaveDisabled?: boolean;
  // Add props for quantity and cost breakdown
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  sheets: number;
  materialCost: number; // Before GST
  manufactureCost: number; // Before GST
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
  price, // Received total price (inc GST)
  turnaround,
  onAddToCart,
  onSaveConfig,
  onReset,
  isAddToCartDisabled,
  isSaveDisabled,
  quantity, // Receive quantity from parent
  onQuantityChange, // Receive handler from parent
  sheets,
  materialCost,
  manufactureCost
}) => {
  // Remove internal quantity state - use prop from parent
  // const [quantity, setQuantity] = useState(1);

  // Call parent handler when quantity changes
  const decreaseQuantity = () => {
    const newQuantity = Math.max(1, quantity - 1);
    onQuantityChange(newQuantity);
  };

  const increaseQuantity = () => {
    const newQuantity = quantity + 1;
    onQuantityChange(newQuantity);
  };
  
  // Calculate GST based on received total price
  const subTotal = price / 1.1;
  const gstAmount = price - subTotal;

  return (
    <Card className="flex-shrink-0 border border-border bg-card text-card-foreground">
      <CardContent className="p-4 space-y-4"> 
        {/* Quantity Selector */}
        <div className="flex items-center justify-between">
           <span className="text-sm font-medium text-foreground">Quantity</span> {/* Make label standard foreground */}
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

        {/* Separator */}
        <Separator className="my-2" /> 

        {/* Cost Breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <div className="flex items-center text-muted-foreground">
              <Sheet className="h-4 w-4 mr-2" /> Material ({sheets} sheet{sheets !== 1 ? 's' : ''})
            </div>
            <span className="font-medium text-foreground">${materialCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-muted-foreground">
              <Wrench className="h-4 w-4 mr-2" /> Manufacturing
            </div>
            <span className="font-medium text-foreground">${manufactureCost.toFixed(2)}</span>
          </div>
           <div className="flex justify-between items-center">
             <span className="text-muted-foreground">Subtotal</span>
             <span className="font-medium text-foreground">${subTotal.toFixed(2)}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-muted-foreground">GST</span>
             <span className="font-medium text-foreground">${gstAmount.toFixed(2)}</span>
           </div>
        </div>

        {/* Separator */}
        <Separator className="my-2" />

        {/* Estimated Price (Total) */}
        <div className="flex justify-between items-center pt-1">
          <span className="text-base font-semibold text-foreground">Total Price:</span>
          <span className="text-xl font-bold text-foreground">
            ${price.toFixed(2)} {/* Use price directly as it includes quantity */}
          </span>
        </div>

        {/* Estimated Turnaround */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Estimated Turnaround:</span>
          <span className="font-medium text-foreground">
            {turnaround} Day{turnaround !== 1 ? 's' : ''}
          </span>
        </div>

         {/* Action Buttons Section */}
         <div className="mt-4 flex flex-col space-y-2 pt-4 border-t border-border">
           {/* Reset Button */}
           <Button
            variant="ghost"
            onClick={onReset}
            className="w-full text-muted-foreground hover:bg-muted hover:text-foreground"
            size="sm" 
          >
            <RotateCcw className="mr-1 h-4 w-4" /> Reset Configuration
          </Button>
          {/* Add to Cart / Save Buttons */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => onAddToCart()} 
              className="flex-1"
              disabled={isAddToCartDisabled || price <= 0} 
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              onClick={onSaveConfig}
              className="flex-1"
              disabled={isSaveDisabled || price <= 0} 
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