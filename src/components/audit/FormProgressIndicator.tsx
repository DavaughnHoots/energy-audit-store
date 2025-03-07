import React from 'react';
import { 
  User, 
  Home, 
  Thermometer, 
  Fan, 
  Zap,
  Lightbulb,
  ShoppingBag,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface FormProgressIndicatorProps {
  currentSection: number;
}

const sections = [
  { id: 1, name: 'Basic Info', icon: User },
  { id: 2, name: 'Home Details', icon: Home },
  { id: 3, name: 'Current Conditions', icon: Thermometer },
  { id: 4, name: 'HVAC Systems', icon: Fan },
  { id: 5, name: 'Energy Usage', icon: Zap },
  { id: 6, name: 'Lighting', icon: Lightbulb },
  { id: 7, name: 'Product Preferences', icon: ShoppingBag }
] as const;

const FormProgressIndicator: React.FC<FormProgressIndicatorProps> = ({
  currentSection
}) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol role="list" className="flex items-center justify-between">
        {sections.map((section, index) => {
          const Icon = section.icon;
          const isComplete = currentSection > section.id;
          const isCurrent = currentSection === section.id;

          return (
            <li key={section.id} className="relative flex flex-col items-center">
              {/* Line connecting sections */}
              {index !== sections.length - 1 && (
                <div
                  className={`absolute top-4 left-[50%] w-full border-t ${
                    isComplete ? 'border-green-600' : 'border-gray-300'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Section indicator */}
              <div className="relative flex items-center justify-center">
                <span
                  className="relative flex h-8 w-8 items-center justify-center rounded-full"
                  aria-hidden="true"
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  ) : isCurrent ? (
                    <div className="relative">
                      <Circle className="h-8 w-8 text-green-600" />
                      <Icon className="absolute inset-0 h-8 w-8 p-1.5 text-green-600" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Circle className="h-8 w-8 text-gray-300" />
                      <Icon className="absolute inset-0 h-8 w-8 p-1.5 text-gray-500" />
                    </div>
                  )}
                </span>
              </div>

              {/* Section name */}
              <span
                className={`mt-2 text-xs font-medium ${
                  isComplete ? 'text-green-600' :
                  isCurrent ? 'text-green-600' :
                  'text-gray-500'
                }`}
              >
                {section.name}
              </span>

              {/* Screen reader text */}
              <span className="sr-only">
                {isComplete ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'} step: {section.name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default FormProgressIndicator;
