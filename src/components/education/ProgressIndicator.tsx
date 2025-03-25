// src/components/education/ProgressIndicator.tsx
import React from 'react';
import { CircleSlash, CircleDashed, CheckCircle2 } from 'lucide-react';
import { ResourceProgress } from '@/types/education';
import { cn } from '@/lib/utils';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

interface ProgressIndicatorProps {
  status?: ProgressStatus;
  progress?: ResourceProgress;
  showPercentage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  status = 'not_started',
  progress,
  showPercentage = false,
  className = '',
  size = 'md',
}) => {
  // Use status from progress object if provided
  const progressStatus = progress?.status || status;
  
  // Determine the icon and colors based on progress status
  const getStatusDisplay = () => {
    switch (progressStatus) {
      case 'not_started':
        return {
          icon: CircleSlash,
          color: 'text-gray-400',
          label: 'Not Started',
          bgColor: 'bg-gray-100',
        };
      case 'in_progress':
        return {
          icon: CircleDashed,
          color: 'text-blue-500',
          label: 'In Progress',
          bgColor: 'bg-blue-100',
        };
      case 'completed':
        return {
          icon: CheckCircle2,
          color: 'text-green-600',
          label: 'Completed',
          bgColor: 'bg-green-100',
        };
    }
  };

  const { icon: Icon, color, label, bgColor } = getStatusDisplay();

  // Determine icon size based on the size prop
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = iconSizes[size];

  // If we only need to show the icon
  if (!showPercentage) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <Icon className={cn(iconSize, color)} />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
    );
  }

  // Calculate percentage for progress bar
  const percentage = progress?.percentComplete || 0;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn(iconSize, color)} />
          <span className="text-xs text-gray-600">{label}</span>
        </div>
        {showPercentage && (
          <span className="text-xs font-medium text-gray-700">{percentage}%</span>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full", bgColor.replace('bg-', 'bg-').replace('-100', '-500'))}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;
