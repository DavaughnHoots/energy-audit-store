import React from 'react';
import { UpdateWindowMaintenanceDto, WindowMaintenance } from '@/types/propertySettings';

interface Props {
  data?: WindowMaintenance;
  onSave: (data: UpdateWindowMaintenanceDto) => Promise<void>;
}

const WindowMaintenanceSection: React.FC<Props> = ({ data, onSave }) => {
  const [formData, setFormData] = React.useState<UpdateWindowMaintenanceDto>({
    windowCount: data?.windowCount || 0,
    lastReplacementDate: data?.lastReplacementDate || null,
    nextMaintenanceDate: data?.nextMaintenanceDate || null,
    maintenanceNotes: data?.maintenanceNotes || null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Window Maintenance</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="windowCount" className="block text-sm font-medium text-gray-700">
            Number of Windows
          </label>
          <input
            type="number"
            id="windowCount"
            min={0}
            value={formData.windowCount}
            onChange={(e) => setFormData(prev => ({ ...prev, windowCount: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="lastReplacement" className="block text-sm font-medium text-gray-700">
            Last Replacement Date
          </label>
          <input
            type="date"
            id="lastReplacement"
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
            value={formData.nextMaintenanceDate || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, nextMaintenanceDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Maintenance Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.maintenanceNotes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, maintenanceNotes: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default WindowMaintenanceSection;
