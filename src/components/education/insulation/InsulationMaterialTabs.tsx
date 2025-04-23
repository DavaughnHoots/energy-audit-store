import React, { useState } from 'react';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

// Insulation materials data
const insulationMaterials = [
  {
    id: 'fiberglass',
    name: 'Fiberglass',
    image: '🧶',
    rValue: 'R-2.9 to R-3.8 per inch',
    forms: 'Batts, rolls, loose-fill',
    pros: ['Inexpensive', 'Widely available', 'Non-flammable', 'Easy DIY installation (batts/rolls)'],
    cons: ['Can irritate skin and lungs', 'Settles over time reducing effectiveness', 'Poor air barrier'],
    applications: ['Attics', 'Walls', 'Floors']
  },
  {
    id: 'cellulose',
    name: 'Cellulose',
    image: '📰',
    rValue: 'R-3.2 to R-3.8 per inch',
    forms: 'Loose-fill, dense-packed',
    pros: ['Eco-friendly (recycled material)', 'Good sound dampening', 'Fire resistant', 'Fills irregular spaces well'],
    cons: ['Can settle over time', 'Absorbs moisture', 'Professional installation recommended'],
    applications: ['Attics', 'Enclosed existing walls', 'Sound insulation']
  },
  {
    id: 'mineral-wool',
    name: 'Mineral Wool',
    image: '🧱',
    rValue: 'R-3.0 to R-4.0 per inch',
    forms: 'Batts, loose-fill, rigid boards',
    pros: ['Fire resistant', 'Water resistant', 'Excellent sound proofing', 'Pest resistant'],
    cons: ['More expensive than fiberglass', 'Heavier than fiberglass', 'Can irritate skin and lungs'],
    applications: ['Walls', 'Ceilings', 'Fire-prone areas']
  },
  {
    id: 'spray-foam',
    name: 'Spray Foam',
    image: '☁️',
    rValue: 'R-3.7 to R-6.5 per inch',
    forms: 'Spray-applied (open-cell or closed-cell)',
    pros: ['Highest R-value per inch', 'Excellent air barrier', 'Moisture resistant (closed cell)', 'Fills gaps completely'],
    cons: ['Most expensive option', 'Professional installation required', 'Can off-gas during installation'],
    applications: ['Walls', 'Attic rafters', 'Rim joists', 'Hard-to-reach areas']
  },
  {
    id: 'rigid-foam',
    name: 'Rigid Foam Board',
    image: '📋',
    rValue: 'R-3.8 to R-6.8 per inch',
    forms: 'Rigid panels (EPS, XPS, Polyiso)',
    pros: ['High R-value per inch', 'Good moisture resistance', 'Reduces thermal bridging', 'Adds structural rigidity'],
    cons: ['Higher cost than fiber options', 'Requires precise cutting', 'Needs a sealed application'],
    applications: ['Exterior sheathing', 'Basement walls', 'Attic hatches', 'Under slab']  
  }
];

// Component for the insulation materials tabs
const InsulationMaterialTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fiberglass');
  const trackComponentEvent = useComponentTracking('education', 'InsulationMaterialTabs');
  
  const handleTabChange = (materialId: string) => {
    setActiveTab(materialId);
    trackComponentEvent('view_insulation_material', { material: materialId });
  };
  
  const activeMaterial = insulationMaterials.find(m => m.id === activeTab) || insulationMaterials[0];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 my-6">
      <div className="flex flex-wrap gap-2 border-b pb-3 mb-4">
        {insulationMaterials.map((material) => (
          <button
            key={material.id}
            onClick={() => handleTabChange(material.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === material.id
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="mr-1">{material.image}</span> {material.name}
          </button>
        ))}
      </div>
      
      <div className="px-1">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-2/3">
            <h3 className="text-xl font-bold mb-2">{activeMaterial.name}</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">R-Value</h4>
                <p>{activeMaterial.rValue}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Available Forms</h4>
                <p>{activeMaterial.forms}</p>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500">Best Applications</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {activeMaterial.applications.map(app => (
                  <span 
                    key={app} 
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="md:w-1/3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-green-700">Pros</h4>
                <ul className="list-disc pl-5 text-sm">
                  {activeMaterial.pros.map(pro => (
                    <li key={pro}>{pro}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-red-700">Cons</h4>
                <ul className="list-disc pl-5 text-sm">
                  {activeMaterial.cons.map(con => (
                    <li key={con}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsulationMaterialTabs;