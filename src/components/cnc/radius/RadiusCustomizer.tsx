'use client';

import React, { useState, useCallback } from 'react';
import RadiusBuilder, { RadiusBuilderState } from './RadiusBuilder';
import RadiusVisualizer from './RadiusVisualizer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radius as RadiusIcon } from 'lucide-react'; // Renamed Radius to RadiusIcon to avoid conflict
import { GST_RATE } from '@/lib/cncConstants'; // Import constants for QuoteActions

interface RadiusCustomizerProps {
    onBack: () => void;
}

const RadiusCustomizer: React.FC<RadiusCustomizerProps> = ({ onBack }) => {
    // State specifically for Radius Builder
    const [radiusBuilderState, setRadiusBuilderState] = useState<RadiusBuilderState | null>(null);

    // Callback for RadiusBuilder to update state here
    const handleRadiusStateChange = useCallback((newState: RadiusBuilderState) => {
        setRadiusBuilderState(newState);
    }, []);

    // Derived Quote/Action props
    const quoteProps = {
        price: parseFloat(radiusBuilderState?.summary?.totalIncGST || '0'),
        turnaround: 3, // Placeholder - Should this be dynamic?
        onAddToCart: radiusBuilderState?.handleAddToCart || (() => { console.warn("Radius AddToCart handler not ready"); }),
        onSaveConfig: () => console.log("Save not implemented for Radius yet"),
        onReset: () => console.log("Reset not implemented for Radius yet"),
        isAddToCartDisabled: radiusBuilderState?.isAddingToCart || !radiusBuilderState?.summary || parseFloat(radiusBuilderState.summary.totalIncGST) <= 0,
        addToCartText: radiusBuilderState?.isAddingToCart ? 'Adding...' : 'Add to Cart'
    };

    // Extract props for Visualizer from the selected row, provide defaults if null
    const selectedRow = radiusBuilderState?.selectedRowData;
    const visualizerProps = {
        radius: selectedRow?.radius || '',
        width: selectedRow?.width || '',
        angle: selectedRow?.angle || '',
        isTooLarge: selectedRow?.isTooLarge || false,
        numSplits: selectedRow?.numSplits || 1
    };

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
                    <RadiusIcon className="h-5 w-5 text-primary" />
                    <h1 className="text-xl font-semibold">Radius / Curved Parts</h1>
                </div>
            </div>

            {/* Main Two-Column Layout */}
            <div className="flex flex-grow gap-6 md:flex-row flex-col">

                {/* Left Column: Configuration + Actions */}
                <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col space-y-6">
                    {/* Configuration Form Area */}
                    <div className="flex-shrink-0">
                        {/* RadiusBuilder itself contains the form elements */}
                        <RadiusBuilder onStateChange={handleRadiusStateChange} />
                    </div>

                    {/* Quote & Actions Area */}
                    <div className="flex-shrink-0">
                        {radiusBuilderState?.summary ? (
                            <div className="bg-card p-4 rounded-lg shadow border border-border">
                                <h3 className="text-lg font-semibold mb-4 text-card-foreground">Quote Summary</h3>
                                <dl className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex justify-between"><dt>Total Area:</dt><dd className="font-medium text-foreground">{radiusBuilderState.summary.area} m²</dd></div>
                                    <div className="flex justify-between"><dt>Sheets Required:</dt><dd className="font-medium text-foreground">{radiusBuilderState.summary.sheets}</dd></div>
                                    <hr className="my-2 border-border" />
                                    <div className="flex justify-between"><dt>Material Cost:</dt><dd className="font-medium text-foreground">${radiusBuilderState.summary.materialCost}</dd></div>
                                    <div className="flex justify-between"><dt>Manufacturing Cost:</dt><dd className="font-medium text-foreground">${radiusBuilderState.summary.manufactureCost}</dd></div>
                                    <hr className="my-2 border-border" />
                                    <div className="flex justify-between font-semibold"><dt>Subtotal (Ex. GST):</dt><dd className="text-foreground">${radiusBuilderState.summary.subTotal}</dd></div>
                                    <div className="flex justify-between"><dt>GST ({(GST_RATE * 100).toFixed(0)}%):</dt><dd className="font-medium text-foreground">${radiusBuilderState.summary.gstAmount}</dd></div>
                                    <hr className="my-3 border-border" />
                                    <div className="flex justify-between text-lg font-bold"><dt>Total (Inc. GST):</dt><dd className="text-primary">${radiusBuilderState.summary.totalIncGST}</dd></div>
                                </dl>
                                <div className="mt-6 space-y-2">
                                    <Button
                                        onClick={quoteProps.onAddToCart}
                                        disabled={quoteProps.isAddToCartDisabled}
                                        className="w-full"
                                    >
                                        {quoteProps.addToCartText}
                                    </Button>
                                     <Button
                                        onClick={quoteProps.onSaveConfig}
                                        disabled={!radiusBuilderState?.summary} // Disable if no summary
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Save Configuration
                                    </Button>
                                    {/* Consider adding a Reset button */}
                                    {/* <Button onClick={quoteProps.onReset} variant="ghost" className="w-full">Reset</Button> */}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card p-4 rounded-lg shadow border border-border text-center text-muted-foreground">
                                Configure parameters to get a quote...
                            </div>
                        )}
                    </div>
                </aside>

                {/* Right Column: Visualization */}
                <main className="flex-grow min-h-[300px] md:min-h-0 rounded-lg border border-border bg-muted/40 flex items-center justify-center relative">
                   {/* Pass individual props extracted from selectedRowData */}
                   <RadiusVisualizer {...visualizerProps} />
                </main>
            </div>
        </div>
    );
};

export default RadiusCustomizer; 