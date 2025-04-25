import React, { useState, useEffect } from 'react';
// Mock implementation of useComponentTracking hook
const useComponentTracking = (section: string, component: string) => {
  return (event: string, data?: any) => {
    console.log(`Analytics: ${section}.${component} - ${event}`, data);
    // In a real implementation, this would send analytics data
  };
};
import { Wrench, HomeIcon, Thermometer, Wind, RefreshCcw } from 'lucide-react';
import rValueRecommendations, { ClimateZone, HomeType, getRecommendedRValues, calculateSavings } from '@/data/rValueRecommendations';
import HouseRegion from './HouseRegion';
import useLocalStorageChecklist from '@/hooks/useLocalStorageChecklist';
// Mock Button component
const Button = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'default',
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: string;
  type?: 'button' | 'submit' | 'reset';
}) => (
  <button
    type={type}
    className={`px-4 py-2 rounded-md font-medium ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

type ToolTab = 'insulation' | 'weatherization' | 'heatLoss';

// Weatherization checklist items
const weatherizationItems = [
  {
    id: 'seal-air-leaks',
    title: 'Seal Air Leaks',
    description: 'Use caulk and weatherstripping around doors, windows, and other openings'
  },
  {
    id: 'inspect-doors-windows',
    title: 'Inspect Doors & Windows',
    description: 'Repair or replace damaged weatherstripping and door sweeps'
  },
  {
    id: 'check-attic-insulation',
    title: 'Check Attic Insulation',
    description: 'Ensure proper depth and coverage before winter arrives'
  },
  {
    id: 'clean-gutters',
    title: 'Clean Gutters',
    description: 'Prevent ice dams by ensuring proper drainage'
  }
];

const FallEnergyPrepTools: React.FC = () => {
  const trackComponentEvent = useComponentTracking('education', 'FallEnergyPrepTools');
  const [activeTab, setActiveTab] = useState<ToolTab>('insulation');
  
  // State for insulation calculator
  const [climateZone, setClimateZone] = useState<ClimateZone | ''>('');
  const [homeType, setHomeType] = useState<HomeType | ''>('');
  const [inputYear, setInputYear] = useState<string>('');
  const [constructionYear, setConstructionYear] = useState<number | null>(null);
  const [rValues, setRValues] = useState<any | null>(null);
  const [savingsRange, setSavingsRange] = useState<{minSavings: number; maxSavings: number} | null>(null);
  
  // State for weatherization guide
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionTip, setRegionTip] = useState<string>('');
  
  // State for heat loss visualizer
  const [showAssessmentMessage, setShowAssessmentMessage] = useState<boolean>(false);
  
  // Use the local storage checklist hook
  const { 
    checkedItems, 
    toggleItem, 
    isChecked,
    resetItems 
  } = useLocalStorageChecklist('weatherization-checklist', []);

  const handleTabChange = (tab: ToolTab) => {
    setActiveTab(tab);
    trackComponentEvent('tab_change', { tab });
  };

  return (
    <div className="bg-orange-50 rounded-lg p-4 my-6 shadow-sm">
      <div className="flex items-center mb-4">
        <Wrench className="w-5 h-5 mr-2 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-800">Fall Energy Prep Tools</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-orange-200 mb-4">
        <button
          className={`py-2 px-3 text-sm font-medium flex items-center mr-2 ${activeTab === 'insulation' ? 'text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
          onClick={() => handleTabChange('insulation')}
        >
          <HomeIcon className="h-4 w-4 mr-1" />
          Insulation Calculator
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium flex items-center mr-2 ${activeTab === 'weatherization' ? 'text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
          onClick={() => handleTabChange('weatherization')}
        >
          <Wind className="h-4 w-4 mr-1" />
          Weatherization Guide
        </button>
        <button
          className={`py-2 px-3 text-sm font-medium flex items-center ${activeTab === 'heatLoss' ? 'text-orange-700 border-b-2 border-orange-500' : 'text-gray-500 hover:text-orange-600'}`}
          onClick={() => handleTabChange('heatLoss')}
        >
          <Thermometer className="h-4 w-4 mr-1" />
          Heat Loss Visualizer
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        {activeTab === 'insulation' && (
          <div className="insulation-calculator">
            <div className="mb-6">
              <div className="mb-4">
                <h4 className="text-lg font-medium mb-2">Insulation Calculator</h4>
                <p className="text-sm text-gray-600">Find the recommended insulation R-values for your region and home type.</p>
              </div>
            
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Your Climate Zone</label>
                    <select 
                      className="border p-2 rounded w-full"
                      value={climateZone}
                      onChange={(e) => {
                        const zone = e.target.value as ClimateZone | '';
                        setClimateZone(zone);
                        trackComponentEvent('select_climate_zone', { zone });
                      }}
                    >
                      <option value="">Choose a region...</option>
                      <option value="1">Zone 1 - Hot (Southern FL, HI)</option>
                      <option value="2">Zone 2 - Warm (AZ, Southern TX)</option>
                      <option value="3">Zone 3 - Mixed-Warm (CA, GA, AR)</option>
                      <option value="4">Zone 4 - Mixed-Humid (VA, KY, MO)</option>
                      <option value="5">Zone 5 - Cool (NY, IL, NE)</option>
                      <option value="6">Zone 6 - Cold (MN, WI, NH)</option>
                      <option value="7">Zone 7 - Very Cold (Northern MN, ND)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Home Type</label>
                    <select 
                      className="border p-2 rounded w-full"
                      value={homeType}
                      onChange={(e) => {
                        const type = e.target.value as HomeType | '';
                        setHomeType(type);
                        trackComponentEvent('select_home_type', { homeType: type });
                      }}
                    >
                      <option value="">Choose a home type...</option>
                      <option value="singleFamily">Single Family Home</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="multifamily">Apartment/Condo</option>
                      <option value="manufactured">Manufactured Home</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Construction Year</label>
                  <input 
                    type="number" 
                    className="border p-2 rounded w-full" 
                    placeholder="e.g. 1985" 
                    min="1900" 
                    max="2025"
                    value={inputYear}
                    onChange={(e) => {
                      // Allow any input during typing
                      setInputYear(e.target.value);
                      trackComponentEvent('input_construction_year_typing', { input: e.target.value });
                    }}
                    onBlur={() => {
                      // Validate on blur
                      const year = inputYear ? parseInt(inputYear) : null;
                      if (year && year >= 1900 && year <= 2025) {
                        setConstructionYear(year);
                        trackComponentEvent('input_construction_year_complete', { year });
                      } else {
                        if (inputYear && inputYear.trim() !== '') {
                          alert('Please enter a year between 1900 and 2025');
                        }
                        setConstructionYear(null);
                      }
                    }}
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      // Validate input year if entered but not yet validated
                      if (inputYear && !constructionYear) {
                        const year = parseInt(inputYear);
                        if (year && year >= 1900 && year <= 2025) {
                          setConstructionYear(year);
                        } else {
                          alert('Please enter a valid year between 1900 and 2025');
                          return;
                        }
                      }
                      
                      if (climateZone && homeType && (constructionYear || parseInt(inputYear))) {
                        const year = constructionYear || parseInt(inputYear);
                        // Get R-values based on climate zone and home type
                        const recommendedValues = getRecommendedRValues(
                          climateZone as ClimateZone, 
                          homeType as HomeType
                        );
                        setRValues(recommendedValues);
                        
                        // Calculate personalized savings range
                        const savings = calculateSavings(
                          climateZone as ClimateZone,
                          homeType as HomeType,
                          year
                        );
                        setSavingsRange(savings);
                        
                        trackComponentEvent('calculate_insulation', { 
                          zone: climateZone, 
                          homeType, 
                          year: constructionYear,
                          rValues: recommendedValues,
                          savingsRange: savings
                        });
                      } else {
                        alert('Please fill in all fields to calculate recommendations.');
                      }
                    }}
                  >
                    Calculate Recommended Insulation
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4 mt-4">
              <h5 className="font-medium mb-2">Recommended Insulation</h5>
              {rValues ? (
                <div className="bg-orange-50 p-3 rounded text-sm">
                  <p className="font-medium mb-2">Recommended Insulation Levels:</p>
                  <ul className="space-y-1">
                    <li><span className="font-medium">Attic:</span> {rValues.attic}</li>
                    <li><span className="font-medium">Walls:</span> {rValues.walls}</li>
                    <li><span className="font-medium">Floors:</span> {rValues.floors}</li>
                    <li><span className="font-medium">Crawlspace:</span> {rValues.crawlspace}</li>
                    <li><span className="font-medium">Basement:</span> {rValues.basement}</li>
                  </ul>
                  <p className="mt-2 italic text-xs">Results are based on Department of Energy recommendations for your climate zone</p>
                  {savingsRange && (
                    <div className="mt-3 text-xs">
                      <p className="text-green-700 font-medium">Potential Energy Savings:</p>
                      <p>Properly insulating your home according to these recommendations can save {savingsRange.minSavings}-{savingsRange.maxSavings}% on heating and cooling costs.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-500 italic">
                  Enter your home details and click Calculate to see recommendations.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'weatherization' && (
          <div className="weatherization-guide">
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Weatherization Guide</h4>
              <p className="text-sm text-gray-600">Interactive guide to weatherizing your home for the winter months.</p>
            </div>
            
            <div className="relative bg-gray-100 p-2 rounded-lg overflow-hidden my-4" style={{height: '280px'}}>
              {/* Interactive House Diagram */}
              <div className="w-full h-full relative">
                {/* House Structure */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-40">
                  {/* House base */}
                  <div className="w-full h-full border-2 border-gray-500 relative bg-white">
                    {/* Base house display elements (visual only) */}
                    <div className="absolute -top-20 left-0 w-0 h-0 border-l-[120px] border-r-[120px] border-b-[80px] border-l-transparent border-r-transparent border-b-gray-500"></div>
                    {/* Visual elements with semi-transparent overlays to indicate clickable areas */}
                    <div className="absolute bottom-0 left-24 w-12 h-20 border-2 border-gray-500 bg-gray-100">
                      <div className="absolute inset-0 bg-orange-200 bg-opacity-20 hover:bg-opacity-40 transition-all duration-200"></div>
                    </div>
                    <div className="absolute top-5 left-10 w-10 h-10 border-2 border-gray-500 bg-blue-100">
                      <div className="absolute inset-0 bg-orange-200 bg-opacity-20 hover:bg-opacity-40 transition-all duration-200"></div>
                    </div>
                    <div className="absolute top-5 right-10 w-10 h-10 border-2 border-gray-500 bg-blue-100">
                      <div className="absolute inset-0 bg-orange-200 bg-opacity-20 hover:bg-opacity-40 transition-all duration-200"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-3 bg-gray-600"></div>

                    {/* Accessible interactive regions */}
                    <HouseRegion
                      area="Roof"
                      description="Add weatherstripping to attic hatches and ensure proper attic ventilation"
                      position={{
                        top: '-80px',
                        left: '0',
                        width: '100%',
                        height: '80px'
                      }}
                      onClick={() => {
                        trackComponentEvent('click_weatherization_area', { area: 'roof' });
                        setSelectedRegion('roof');
                        setRegionTip('Add weatherstripping to attic hatches and ensure proper attic ventilation to prevent ice dams.');
                      }}
                      highlightColor={selectedRegion === 'roof' ? 'orange-300' : 'orange-200'}
                      className="z-30"
                    />
                    
                    <HouseRegion
                      area="Door"
                      description="Install door sweeps and check for air gaps around the frame"
                      position={{
                        bottom: '0',
                        left: '24px',
                        width: '12px',
                        height: '20px',
                        zIndex: '40' // Ensure this is on top
                      }}
                      onClick={() => {
                        trackComponentEvent('click_weatherization_area', { area: 'door' });
                        setSelectedRegion('door');
                        setRegionTip('Install door sweeps on exterior doors and check for air gaps around the frame.');
                      }}
                      highlightColor={selectedRegion === 'door' ? 'orange-400' : 'orange-200'}
                      className="z-40 cursor-pointer"
                    />
                    
                    <HouseRegion
                      area="Left Window"
                      description="Apply weatherstripping and consider window insulation film"
                      position={{
                        top: '5px',
                        left: '10px',
                        width: '10px',
                        height: '10px',
                        zIndex: '40' // Ensure this is on top
                      }}
                      onClick={() => {
                        trackComponentEvent('click_weatherization_area', { area: 'window-left' });
                        setSelectedRegion('window-left');
                        setRegionTip('Apply weatherstripping around windows and consider window insulation film for older windows.');
                      }}
                      highlightColor={selectedRegion === 'window-left' ? 'orange-400' : 'orange-200'}
                      className="z-40 cursor-pointer"
                    />
                    
                    <HouseRegion
                      area="Right Window"
                      description="Caulk around window frames where they meet siding"
                      position={{
                        top: '5px',
                        right: '10px',
                        width: '10px',
                        height: '10px',
                        zIndex: '40' // Ensure this is on top
                      }}
                      onClick={() => {
                        trackComponentEvent('click_weatherization_area', { area: 'window-right' });
                        setSelectedRegion('window-right');
                        setRegionTip('Caulk around window frames where they meet siding, brick, or stone.');
                      }}
                      highlightColor={selectedRegion === 'window-right' ? 'orange-400' : 'orange-200'}
                      className="z-40 cursor-pointer"
                    />
                    
                    <HouseRegion
                      area="Foundation"
                      description="Seal rim joists in the basement or crawlspace with foam insulation"
                      position={{
                        bottom: '0',
                        left: '0',
                        width: '100%',
                        height: '3px'
                      }}
                      onClick={() => {
                        trackComponentEvent('click_weatherization_area', { area: 'foundation' });
                        setSelectedRegion('foundation');
                        setRegionTip('Seal rim joists in the basement or crawlspace with foam insulation.');
                      }}
                      highlightColor={selectedRegion === 'foundation' ? 'orange-300' : 'orange-200'}
                      className="z-30"
                    />
                  </div>
                </div>
                
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  Click on different parts of the house (roof, windows, door, foundation) to see weatherization tips
                </div>
              </div>
            </div>
            
            {/* Weatherization Info Panel - Now placed outside the diagram */}
            {selectedRegion && (
              <div className="bg-white p-3 rounded-md text-sm border border-orange-300 mb-4 shadow-sm">
                <p className="font-medium text-orange-800">{selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1).replace('-', ' ')} Weatherization:</p>
                <p className="mt-1">{regionTip}</p>
              </div>
            )}
            
            <div className="space-y-2 mt-6">
              <div className="flex justify-between items-center">
                <h5 className="font-medium">Weatherization Checklist:</h5>
                <button 
                  className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    resetItems();
                    trackComponentEvent('reset_checklist');
                  }}
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Reset
                </button>
              </div>
              
              <div className="space-y-2">
                {weatherizationItems.map((item) => (
                  <div key={item.id} className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mt-1 mr-2" 
                      id={item.id}
                      checked={isChecked(item.id)}
                      onChange={() => {
                        toggleItem(item.id);
                        trackComponentEvent('toggle_checklist_item', { 
                          item: item.id, 
                          checked: !isChecked(item.id)
                        });
                      }}
                    />
                    <div>
                      <label htmlFor={item.id} className="font-medium cursor-pointer">{item.title}</label>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'heatLoss' && (
          <div className="heat-loss-visualizer">
            <div className="mb-4">
              <h4 className="text-lg font-medium mb-2">Heat Loss Visualizer</h4>
              <p className="text-sm text-gray-600">See where your home typically loses the most heat energy.</p>
            </div>
            
            <div className="relative bg-gray-100 p-2 rounded-lg overflow-hidden my-4" style={{height: '280px'}}>
            {/* Enhanced thermal visualization */}
            <div className="w-full h-full relative">
            {/* House base structure */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-40">
            
              {/* House base - low heat loss */}
                <div className="w-full h-full border-2 border-gray-800 relative bg-blue-100">
                  
                  {/* Roof - high heat loss */}
                  <div className="absolute -top-20 left-0 w-0 h-0 border-l-[120px] border-r-[120px] border-b-[80px] border-l-transparent border-r-transparent border-b-red-500"
                  onMouseEnter={() => {
                  trackComponentEvent('hover_heat_loss_area', { area: 'roof' });
                  const infoElement = document.getElementById('heat-loss-info');
                  if (infoElement) {
                    infoElement.innerText = 'Roof/Attic: 25-30% of total heat loss. Warm air rises and escapes through poorly insulated attics.';
                  }
                }}
              ></div>
              
              {/* Door - medium heat loss */}
              <div className="absolute bottom-0 left-24 w-12 h-20 border-2 border-yellow-500 bg-yellow-200"
                onMouseEnter={() => {
                  trackComponentEvent('hover_heat_loss_area', { area: 'door' });
                  const infoElement = document.getElementById('heat-loss-info');
                  if (infoElement) {
                    infoElement.innerText = 'Doors: 10-15% of heat loss occurs through gaps around exterior doors and the door itself if poorly insulated.';
                  }
                }}
                    ></div>
                      
                      {/* Windows - highest heat loss */}
                      <div className="absolute top-5 left-10 w-10 h-10 border-2 border-red-700 bg-red-300"
                        onMouseEnter={() => {
                          trackComponentEvent('hover_heat_loss_area', { area: 'window' });
                          const infoElement = document.getElementById('heat-loss-info');
                          if (infoElement) {
                            infoElement.innerText = 'Windows: 25-30% of heat loss. Single-pane windows lose heat rapidly; even double-pane windows can be a weak point.';
                          }
                        }}
                      ></div>
                      <div className="absolute top-5 right-10 w-10 h-10 border-2 border-red-700 bg-red-300"></div>
                      
                      {/* Walls - medium-high heat loss */}
                      <div className="absolute top-5 left-24 right-24 h-10 border-none bg-orange-300"
                        onMouseEnter={() => {
                          trackComponentEvent('hover_heat_loss_area', { area: 'walls' });
                          const infoElement = document.getElementById('heat-loss-info');
                          if (infoElement) {
                            infoElement.innerText = 'Walls: 15-20% of heat loss occurs through exterior walls, especially those without proper insulation.';
                          }
                        }}
                      ></div>
                      
                      {/* Foundation/floor - medium-low heat loss */}
                      <div className="absolute bottom-0 left-0 right-0 h-5 bg-yellow-100 border-t-2 border-yellow-400"
                        onMouseEnter={() => {
                          trackComponentEvent('hover_heat_loss_area', { area: 'foundation' });
                          const infoElement = document.getElementById('heat-loss-info');
                          if (infoElement) {
                            infoElement.innerText = 'Foundation/Floors: 10-15% of heat loss. Uninsulated basements and floors over crawlspaces leak considerable heat.';
                          }
                        }}
                      ></div>
                      
                      {/* Air leaks visualization */}
                      <div className="absolute -top-5 left-20 w-3 h-8 bg-red-400 rotate-45 opacity-70"
                        onMouseEnter={() => {
                          trackComponentEvent('hover_heat_loss_area', { area: 'air-leaks' });
                          const infoElement = document.getElementById('heat-loss-info');
                          if (infoElement) {
                            infoElement.innerText = 'Air Leaks: 10-15% of heat loss comes from small cracks and penetrations throughout the building envelope.';
                          }
                        }}
                      ></div>
                      <div className="absolute top-10 right-5 w-3 h-8 bg-red-400 rotate-12 opacity-70"></div>
                    </div>
                  </div>
                  
                  <div id="heat-loss-info" className="absolute bottom-2 left-2 right-2 text-xs text-gray-700 bg-white bg-opacity-80 p-1 rounded">
                    Hover over different areas to see heat loss information
                  </div>
                </div>
              </div>
            
            <div className="mt-4">
              <h5 className="font-medium mb-2">Common Heat Loss Points:</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 mr-2"></div>
                  <span>Windows (25-30%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 mr-2"></div>
                  <span>Roof/Attic (20-30%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 mr-2"></div>
                  <span>Doors (10-15%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 mr-2"></div>
                  <span>Walls (15-20%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 mr-2"></div>
                  <span>Floors (10-15%)</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-600 mr-2"></div>
                  <span>Air Leaks (10-15%)</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white relative"
                  onClick={() => {
                    trackComponentEvent('click_get_heat_loss_assessment');
                    setShowAssessmentMessage(true);
                    setTimeout(() => setShowAssessmentMessage(false), 5000); // Hide after 5 seconds
                  }}
                >
                  Get a Custom Heat Loss Assessment
                  {showAssessmentMessage && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white shadow-lg rounded p-3 border border-green-500 z-50 text-sm text-gray-800">
                      <p className="font-medium text-green-700">Assessment Request Received!</p>
                      <p>In the production version, this would connect you with an energy professional for a detailed heat loss assessment of your home.</p>
                    </div>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Professional assessments can identify heat loss points invisible to the naked eye
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FallEnergyPrepTools;
