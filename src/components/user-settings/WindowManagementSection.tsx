import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UpdateWindowMaintenanceDto, WindowMaintenance } from '@/types/propertySettings';
import { Card, CardContent } from '@/components/ui/card';

// Constants for window types
const WINDOW_TYPES = [
  { value: 'single', label: 'Single Pane' },
  { value: 'double', label: 'Double Pane' },
  { value: 'triple', label: 'Triple Pane' },
  { value: 'not-sure', label: 'Not Sure' }
];

interface Props {
  data?: WindowMaintenance;
  weatherizationData?: any;
  onSave: (data: UpdateWindowMaintenanceDto) => Promise<void>;
  onWeatherizationSave?: (data: any) => Promise<void>;
}

const WindowManagementSection: React.FC<Props> = ({ 
  data, 
  weatherizationData,
  onSave, 
  onWeatherizationSave 
}) => {
  const [activeTab, setActiveTab] = useState('details');
  
  // Window maintenance form data
  const [formData, setFormData] = React.useState<UpdateWindowMaintenanceDto>({
    windowCount: data?.windowCount || 0,
    windowType: data?.windowType || 'not-sure',
    lastReplacementDate: data?.lastReplacementDate || null,
    nextMaintenanceDate: data?.nextMaintenanceDate || null,
    maintenanceNotes: data?.maintenanceNotes || null
  });

  // Window assessment form data (weatherization)
  const [assessmentData, setAssessmentData] = React.useState({
    drafts: weatherizationData?.drafts || false,
    visibleGaps: weatherizationData?.visibleGaps || false,
    condensation: weatherizationData?.condensation || false,
    weatherStripping: weatherizationData?.weatherStripping || 'not-sure'
  });

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onWeatherizationSave) {
      await onWeatherizationSave(assessmentData);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Window Management</h3>
      
      <Tabs defaultValue="details" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Window Details</TabsTrigger>
          <TabsTrigger value="assessment">Window Assessment</TabsTrigger>
        </TabsList>
        
        {/* Window Details Tab */}
        <TabsContent value="details">
          <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="windowCount" className="block text-sm font-medium text-gray-700">
                  Number of Windows
                </label>
                <input
                  type="number"
                  id="windowCount"
                  name="windowCount"
                  min={0}
                  value={formData.windowCount || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, windowCount: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="windowType" className="block text-sm font-medium text-gray-700">
                  Window Type
                </label>
                <select
                  id="windowType"
                  name="windowType"
                  value={formData.windowType || 'not-sure'}
                  onChange={(e) => setFormData(prev => ({ ...prev, windowType: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  {WINDOW_TYPES.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lastReplacement" className="block text-sm font-medium text-gray-700">
                  Last Replacement Date
                </label>
                <input
                  type="date"
                  id="lastReplacement"
                  name="lastReplacementDate"
                  value={formData.lastReplacementDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastReplacementDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <label htmlFor="nextMaintenance" className="block text-sm font-medium text-gray-700">
                  Next Maintenance Due
                </label>
                <input
                  type="date"
                  id="nextMaintenance"
                  name="nextMaintenanceDate"
                  value={formData.nextMaintenanceDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Maintenance Notes
              </label>
              <textarea
                id="notes"
                name="maintenanceNotes"
                rows={3}
                value={formData.maintenanceNotes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maintenanceNotes: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Enter any notes about window maintenance or issues..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Window Details
              </button>
            </div>
          </form>
        </TabsContent>
        
        {/* Window Assessment Tab */}
        <TabsContent value="assessment">
          <form onSubmit={handleAssessmentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-4">Window Issues</h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="drafts" 
                        checked={assessmentData.drafts}
                        onChange={(e) => 
                          setAssessmentData(prev => ({ ...prev, drafts: e.target.checked }))
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="drafts" className="text-sm text-gray-700">Air drafts coming from windows</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="visibleGaps" 
                        checked={assessmentData.visibleGaps}
                        onChange={(e) => 
                          setAssessmentData(prev => ({ ...prev, visibleGaps: e.target.checked }))
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="visibleGaps" className="text-sm text-gray-700">Visible gaps around window frames</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="condensation" 
                        checked={assessmentData.condensation}
                        onChange={(e) => 
                          setAssessmentData(prev => ({ ...prev, condensation: e.target.checked }))
                        }
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label htmlFor="condensation" className="text-sm text-gray-700">Condensation forms between panes</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-medium mb-4">Weather Protection</h4>
                  <div className="space-y-4">
                    <label htmlFor="weatherStripping" className="block text-sm font-medium text-gray-700">
                      Weather Stripping Condition
                    </label>
                    <select
                      id="weatherStripping"
                      value={assessmentData.weatherStripping}
                      onChange={(e) => setAssessmentData(prev => ({ ...prev, weatherStripping: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="good">Good Condition</option>
                      <option value="worn">Worn/Aging</option>
                      <option value="damaged">Damaged/Missing</option>
                      <option value="not-sure">Not Sure</option>
                      <option value="none">No Weather Stripping</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Assessment
              </button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WindowManagementSection;
