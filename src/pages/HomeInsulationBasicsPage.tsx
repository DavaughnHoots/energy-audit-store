import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';
import { 
  ArrowRightIcon, 
  FlameIcon, 
  HomeIcon, 
  LineChartIcon, 
  CalculatorIcon, 
  ClipboardCheckIcon 
} from 'lucide-react';

// Import UI components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Import interactive features
import InsulationInteractiveFeatures from '@/components/education/insulation/InsulationInteractiveFeatures';



// Main Component
const HomeInsulationBasicsPage: React.FC = () => {
  // Track page view with educational resource ID
  usePageTracking('education', {
    subSection: 'resources/home-insulation-basics',
    resourceId: '3' // Resource ID for insulation basics
  });
  const trackComponentEvent = useComponentTracking('education', 'HomeInsulationBasicsPage');
  const navigate = useNavigate();
  
  // Handler for starting an energy audit
  const handleStartAudit = () => {
    navigate('/energy-audit');
    trackComponentEvent('start_audit_from_insulation', { source: 'insulation_page' });
  };
  
  // Reference for section elements
  const sections = [
    { id: 'what-is-insulation', title: 'What Is Insulation?' },
    { id: 'insulation-types', title: 'Types of Insulation' },
    { id: 'r-value', title: 'R-Value Explained' },
    { id: 'where-to-insulate', title: 'Where to Insulate' },
    { id: 'benefits', title: 'Benefits of Insulation' },
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'quiz', title: 'Readiness Quiz' }
  ];
  
  // Active section state for TOC highlighting
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Set up intersection observer to detect active section
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -50% 0px',
      threshold: 0
    };
    
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home Insulation Basics</h1>
          <p className="text-gray-600 mb-6">
            Learn how proper insulation can keep your home comfortable year-round while saving energy and reducing costs
          </p>
          
          {/* Main introduction paragraph */}
          <div className="mb-6">
            <p className="text-lg text-gray-800">
              Want to stay warm in the winter and cool in the summer — without running your HVAC nonstop? 
              The key is insulation. In this guide, you'll learn how insulation works, the different types available, 
              and how to choose the right strategy for your home.
            </p>
          </div>
          
          {/* Interactive insulation content */}
          <InsulationInteractiveFeatures onStartAudit={handleStartAudit} />
        </div>
      </div>
    </div>
  );
};

export default HomeInsulationBasicsPage;
