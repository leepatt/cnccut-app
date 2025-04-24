"use client";

import React, { useState } from 'react';
// Import new components once created
// import Header from '@/components/cnc/Header'; // Assuming Header goes in layout
import DashboardView from '@/components/cnc/DashboardView';
import CustomizerView from '@/components/cnc/CustomizerView';

type ViewState = 'dashboard' | 'customizer';
type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder' | null;

export default function DashboardPage() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [selectedConfig, setSelectedConfig] = useState<ConfigType>(null);

  const navigateToCustomizer = (configType: ConfigType) => {
    setSelectedConfig(configType);
    setCurrentView('customizer');
  };

  const navigateToDashboard = () => {
    setSelectedConfig(null);
    setCurrentView('dashboard');
  };

  // NOTE: The Header component should ideally be placed in a layout file (e.g., src/app/layout.tsx or a specific dashboard layout)
  // to be persistent across navigation within the dashboard section.
  // For this example, we'll assume it's handled by the main layout.

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#FAF0E6]">
      {/* <Header /> */} {/* Wrapped comment: Assuming Header is in layout */}

      <main className="p-4 md:p-8">
        {currentView === 'dashboard' && (
          <DashboardView onSelectConfig={navigateToCustomizer} />
        )}
        {currentView === 'customizer' && selectedConfig && (
          <CustomizerView
            configType={selectedConfig}
            onBack={navigateToDashboard}
          />
        )}
      </main>
    </div>
  );
} 