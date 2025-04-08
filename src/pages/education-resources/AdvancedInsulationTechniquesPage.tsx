import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReadingProgressBar from '../../components/education/ReadingProgressBar';
import EnergyAuditQuizModal from '../../components/education/EnergyAuditQuizModal';
import TableOfContents from '../../components/education/TableOfContents';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';
import { AnalyticsArea } from '../../context/AnalyticsContext';

/**
 * Page showing advanced insulation techniques
 */
const AdvancedInsulationTechniquesPage: React.FC = () => {
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const trackComponentEvent = useComponentTracking('education', 'AdvancedInsulationPage');

  const tableOfContentsItems = [
    { id: 'aerogel', title: 'Aerogel Insulation' },
    { id: 'vips', title: 'Vacuum Insulation Panels' },
    { id: 'sips', title: 'Structural Insulated Panels' },
    { id: 'pcms', title: 'Phase Change Materials' },
    { id: 'radiant', title: 'Reflective & Radiant Barrier Insulation' },
    { id: 'conclusion', title: 'Conclusion' }
  ];

  const handleTechniqueVote = (technique: string) => {
    setSelectedTechnique(technique);
    trackComponentEvent('poll_vote', { selected_technique: technique });
  };

  const handleStartEnergyAudit = () => {
    trackComponentEvent('start_energy_audit_clicked', { location: 'main_cta' });
    setShowQuizModal(true);
  };

  const handleShowSavings = (technique: string) => {
    trackComponentEvent('show_savings_clicked', { technique });
    // In a real implementation, this might show a modal with savings calculations
    alert(`Showing savings for ${technique}. In production, this would display a savings calculator.`);
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Reading progress bar */}
      <ReadingProgressBar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Insulation Techniques</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Are Your Walls Robbing You Blind? 🏠💸</h2>
          <p className="text-lg text-gray-700">
            If your heating or cooling bill feels like a second rent check, your insulation might be the culprit. 
            Most homes leak energy like a sieve—but not because people don't care. It's because insulation is invisible… 
            until you see the savings. In this guide, we're unmasking the five most advanced insulation techniques that can 
            quietly save you thousands—and make your home more comfortable all year long.
          </p>
          <p className="text-lg text-gray-700 mt-3">
            Let's break it down in plain English (with a few juicy stats, too).
          </p>
        </header>

        {/* Table of Contents */}
        <div className="my-8">
          <TableOfContents items={tableOfContentsItems} />
        </div>

        <hr className="my-8 border-gray-300" />

        {/* Main Content */}
        <main className="education-content">
          {/* Section 1: Aerogel */}
          <section id="aerogel" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🧊 1. Aerogel Insulation – The Ninja of Thermal Defense</h2>
            <p className="text-lg italic text-gray-700 mb-4">"Mostly air. Totally powerful."</p>
            
            <p className="font-semibold mb-2">💡 Use Case: You live in a city apartment with thin walls and no room to expand? Aerogel's got your back—literally.</p>
            
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li><span className="font-medium">Why it's cool:</span> Looks like frozen smoke, acts like a space suit.</li>
              <li><span className="font-medium">Benefits:</span> Ultra-low thermal conductivity, moisture resistant, crazy lightweight.</li>
              <li><span className="font-medium">Best For:</span> Tight retrofit spaces—think behind radiators, inside window frames.</li>
              <li><span className="font-medium">Heads-up:</span> Pricier upfront, but energy savings kick in fast.</li>
            </ul>
            
            <button 
              onClick={() => handleShowSavings('aerogel')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              👉 Show Me the Savings 💸
            </button>
            
            <div className="mt-6 bg-gray-100 p-4 rounded-md font-mono text-sm">
              <pre>{`        ┌─────────────────────────────┐
        │  AEROGEL PANEL (95% AIR)   │
        │ ┌───────┐     ┌───────┐    │
        │ │  Air  │ ... │  Air  │    │
        │ └───────┘     └───────┘    │
        │ Microscopic structure traps│
        │ heat despite being lightweight │
        └─────────────────────────────┘`}</pre>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AdvancedInsulationTechniquesPage;