'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming 21st.dev uses shadcn Card
import { Waves, LayoutGrid, Shapes, Box } from 'lucide-react'; // Icons

type ConfigType = 'Curves' | 'Perforated Panels' | 'Shape Builder' | 'Box Builder';

interface DashboardViewProps {
  onSelectConfig: (configType: ConfigType) => void;
}

interface ConfigOption {
  id: ConfigType;
  title: string;
  description: string;
  icon: React.ElementType;
}

const configOptions: ConfigOption[] = [
  {
    id: 'Curves',
    title: 'Curves',
    description: 'Configure custom curved timber elements.',
    icon: Waves,
  },
  {
    id: 'Perforated Panels',
    title: 'Perforated Panels',
    description: 'Design panels with custom hole patterns.',
    icon: LayoutGrid,
  },
  {
    id: 'Shape Builder',
    title: 'Shape Builder',
    description: 'Create parts from standard geometric shapes.',
    icon: Shapes,
  },
  {
    id: 'Box Builder',
    title: 'Box Builder',
    description: 'Configure custom box or enclosure components.',
    icon: Box,
  },
];

const DashboardView: React.FC<DashboardViewProps> = ({ onSelectConfig }) => {
  return (
    <div className="text-[#FAF0E6]">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Start a New Configuration</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {configOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card
              key={option.id}
              className="cursor-pointer border-neutral-700 bg-neutral-800/50 text-[#FAF0E6] transition-colors hover:bg-neutral-700/60 hover:border-[#351210] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B80F0A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1A1A1A]"
              onClick={() => onSelectConfig(option.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectConfig(option.id)}
              tabIndex={0} // Make it focusable
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-medium">
                  <IconComponent className="h-5 w-5 text-[#B80F0A]" />
                  {option.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-neutral-300">
                  {option.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardView; 