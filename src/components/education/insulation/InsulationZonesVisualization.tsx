import React, { useState } from 'react';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

// Component for the home insulation zones visualization
const InsulationZonesVisualization: React.FC = () => {
  const [activeZone, setActiveZone] = useState('attic');
  const trackComponentEvent = useComponentTracking('education', 'InsulationZonesVisualization');
  
  const zones = [
    {
      id: 'attic',
      name: 'Attic',
      priority: 1,
      description: 'The attic is typically the #1 priority for insulation because heat rises. Proper attic insulation can reduce heating costs by 10-15% and prevent ice dams in cold climates.',
      rValueRecommended: 'R-38 to R-60'
    },
    {
      id: 'walls',
      name: 'Exterior Walls',
      priority: 2,
      description: 'Exterior walls can account for 20-25% of heat loss. Insulating them creates a thermal envelope that significantly improves comfort and energy efficiency.',
      rValueRecommended: 'R-13 to R-23'
    },
    {
      id: 'floors',
      name: 'Floors & Crawlspaces',
      priority: 3,
      description: 'Insulating floors over unconditioned spaces like garages or crawlspaces helps maintain comfortable temperatures and prevents cold floors in winter.',
      rValueRecommended: 'R-13 to R-30'
    },
    {
      id: 'basement',
      name: 'Basement Walls',
      priority: 4,
      description: 'Insulating basement walls reduces moisture problems, prevents heat loss, and can make the space more comfortable and usable year-round.',
      rValueRecommended: 'R-10 to R-19'
    },
    {
      id: 'ducts',
      name: 'Ducts & Pipes',
      priority: 5,
      description: 'Insulating ducts in unconditioned spaces can improve HVAC efficiency by 10-30%. Pipe insulation prevents heat loss from hot water and can prevent freezing in cold climate.',
      rValueRecommended: 'R-6 to R-11'
    }
  ];
  
  const handleZoneClick = (zoneId: string) => {
    setActiveZone(zoneId);
    trackComponentEvent('view_insulation_zone', { zone: zoneId });
  };
  
  const activeZoneData = zones.find(z => z.id === activeZone) || zones[0];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 my-6">
      <h3 className="text-lg font-bold mb-3">Home Insulation Priority Zones</h3>
      
      <div className="grid grid-cols-5 gap-2 mb-4">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => handleZoneClick(zone.id)}
            className={`p-2 rounded text-center text-sm transition-colors ${
              activeZone === zone.id
                ? 'bg-green-100 text-green-800 font-medium'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <div className="font-bold">{zone.priority}</div>
            <div className="text-xs">{zone.name}</div>
          </button>
        ))}
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        {/* House illustration would go here - using placeholder for now */}
        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-center md:col-span-1">
          <div className="text-center">
            <div className="text-6xl mb-2">🏠</div>
            <div className="text-sm text-blue-700">Illustration showing {activeZoneData.name} location</div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="font-bold text-lg mb-2">{activeZoneData.name}</h4>
          <div className="text-sm mb-3">
            <span className="font-medium">Priority: </span> 
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
              #{activeZoneData.priority}
            </span>
          </div>
          
          <p className="mb-3">{activeZoneData.description}</p>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h5 className="font-medium text-sm text-yellow-800">Recommended R-Value</h5>
            <p className="text-sm">{activeZoneData.rValueRecommended}</p>
            <p className="text-xs text-gray-500 mt-1">Values may vary based on your climate zone. Colder climates require higher R-values.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsulationZonesVisualization;