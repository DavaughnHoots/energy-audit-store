import { useState } from 'react';
import PDFGenerator from './components/PDFGenerator';
import PDFPreview from './components/PDFPreview';
import './App.css';

// Import data
import springTips from './data/springTips';
import summerTips from './data/summerTips';
import fallTips from './data/fallTips';
import winterTips from './data/winterTips';
import calendar from './data/calendar';
import insulation from './data/educational/insulation';
import solar from './data/educational/solar';

function App() {
  // State for selected template and data
  const [selectedTemplate, setSelectedTemplate] = useState('spring');
  const [showPreview, setShowPreview] = useState(false);
  
  // Map template names to their data
  const templateData = {
    spring: springTips,
    summer: summerTips,
    fall: fallTips,
    winter: winterTips,
    calendar: calendar,
    insulation: insulation,
    solar: solar
  };
  
  // Map template names to their display names
  const templateNames = {
    spring: 'Spring Energy Prep Checklist',
    summer: 'Summer Cooling Tips Guide',
    fall: 'Fall Weatherization Checklist',
    winter: 'Winter Energy Saving Guide',
    calendar: 'Comprehensive Energy Calendar',
    insulation: 'Advanced Insulation Techniques Guide',
    solar: 'Residential Solar Energy Systems Guide'
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Energy Audit PDF Generator</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Select Template:
          <select 
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="spring">Spring Energy Prep Checklist</option>
            <option value="summer">Summer Cooling Tips Guide</option>
            <option value="fall">Fall Weatherization Checklist</option>
            <option value="winter">Winter Energy Saving Guide</option>
            <option value="calendar">Comprehensive Energy Calendar</option>
            <option value="insulation">Advanced Insulation Techniques Guide</option>
            <option value="solar">Residential Solar Energy Systems Guide</option>
          </select>
        </label>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setShowPreview(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Preview PDF
        </button>
        
        <PDFGenerator 
          templateType={selectedTemplate}
          data={templateData[selectedTemplate]}
          title={templateNames[selectedTemplate]}
        />
      </div>
      
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-auto">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">{templateNames[selectedTemplate]} Preview</h2>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <PDFPreview 
              templateType={selectedTemplate}
              data={templateData[selectedTemplate]}
              title={templateNames[selectedTemplate]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;