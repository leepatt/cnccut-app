"use client";

import React, { useState } from 'react';
// Import the specific customizers
import BoxCustomizer from '@/components/cnc/box/BoxCustomizer';
import RadiusCustomizer from '@/components/cnc/radius/RadiusCustomizer';
import DashboardView from '@/components/cnc/DashboardView';
import CustomizerView from '@/components/cnc/CustomizerView'; // Keep for other types

// Make ConfigType reusable, maybe move to types/ later
type ConfigType = 'Radius' | 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder' | null;
export type { ConfigType }; // Export for use in DashboardView

type ViewState = 'dashboard' | 'customizer';

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedConfig, setSelectedConfig] = useState<ConfigType>(null);

  const navigateToCustomizer = (configType: ConfigType) => {
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
      case 'Radius':
        return <RadiusCustomizer onBack={navigateToDashboard} />;
      // Add cases for other specific customizers here
      // case 'Curves':
      //   return <CurvesCustomizer onBack={navigateToDashboard} />;
      default:
        // Fallback to the generic CustomizerView for unhandled types
        return (
          <CustomizerView
            configType={selectedConfig} // Pass the specific type
            onBack={navigateToDashboard}
          />
        );
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