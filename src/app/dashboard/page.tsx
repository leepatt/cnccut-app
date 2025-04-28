"use client";

import React, { useState } from 'react';
// Import the specific customizers
import BoxCustomizer from '@/components/cnc/box/BoxCustomizer';
import CurvesCustomizer from '@/components/cnc/curves/CurvesCustomizer';
import PerfCustomizer from '@/components/cnc/perforated/PerfCustomizer';
import ShapeCustomizer from '@/components/cnc/shapes/ShapeCustomizer';
import DashboardView from '@/components/cnc/DashboardView';

// Import the ConfigType from DashboardView to ensure consistency
import type { ConfigType } from '@/components/cnc/DashboardView';

type ViewState = 'dashboard' | 'customizer';

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedConfig, setSelectedConfig] = useState<ConfigType | null>(null);

  const navigateToCustomizer = (configType: ConfigType | null) => {
    if (!configType) return; // Don't navigate if null
    setSelectedConfig(configType);
    setCurrentView('customizer');
  };

  const navigateToDashboard = () => {
    setSelectedConfig(null);
    setCurrentView('dashboard');
  };

  const renderCustomizer = () => {
    if (!selectedConfig) return null;

    switch (selectedConfig) {
      case 'Box Builder':
        return <BoxCustomizer onBack={navigateToDashboard} />;
      case 'Curves':
        return <CurvesCustomizer onBack={navigateToDashboard} />;
      case 'Perforated Panels':
        return <PerfCustomizer onBack={navigateToDashboard} />;
      case 'Shape Builder':
        return <ShapeCustomizer onBack={navigateToDashboard} />;
      default:
        // This should never happen as we've now covered all cases
        console.error(`Unknown customizer type: ${selectedConfig}`);
        return null;
    }
  };

  // NOTE: The Header component should ideally be placed in a layout file (e.g., src/app/layout.tsx or a specific dashboard layout)
  // to be persistent across navigation within the dashboard section.
  // For this example, we'll assume it's handled by the main layout.

  return (
    <div className="min-h-screen">
      {/* <Header /> */} {/* Header is now in layout */}

      <main className="p-4 md:p-8">
        {currentView === 'dashboard' && (
          <DashboardView onSelectConfig={navigateToCustomizer} />
        )}
        {currentView === 'customizer' && renderCustomizer()} {/* Render based on selection */}
      </main>
    </div>
  );
} 