import React from 'react';
import { HomeDetails } from '../../../../backend/src/types/energyAudit';

interface HomeDetailsFormProps {
  data: HomeDetails;
  onInputChange: (field: keyof HomeDetails, value: string | number) => void;
}

const HomeDetailsForm: React.FC<HomeDetailsFormProps> = ({ data, onInputChange }) => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-2">
          Year Built *
        </label>
        <input
          type="number"
          id="yearBuilt"
          value={data.yearBuilt}
          onChange={(e) => onInputChange('yearBuilt', parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          min="1800"
          max={currentYear}
          required
        />
      </div>

      <div>
        <label htmlFor="homeSize" className="block text-sm font-medium text-gray-700 mb-2">
          Home Size (sq ft) *
        </label>
        <input
          type="number"
          id="homeSize"
          value={data.homeSize}
          onChange={(e) => onInputChange('homeSize', parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          min="100"
          max="50000"
          required
        />
      </div>

      <div>
        <label htmlFor="numRooms" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Rooms *
        </label>
        <input
          type="number"
          id="numRooms"
          value={data.numRooms}
          onChange={(e) => onInputChange('numRooms', parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          min="1"
          max="100"
          required
        />
      </div>

      <div>
        <label htmlFor="homeType" className="block text-sm font-medium text-gray-700 mb-2">
          Home Type *
        </label>
        <select
          id="homeType"
          value={data.homeType}
          onChange={(e) => onInputChange('homeType', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        >
          <option value="">Select home type</option>
          <option value="apartment">Apartment</option>
          <option value="single-family">Single Family</option>
          <option value="townhouse">Townhouse</option>
          <option value="duplex">Duplex</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="numFloors" className="block text-sm font-medium text-gray-700 mb-2">
          Number of Floors *
        </label>
        <input
          type="number"
          id="numFloors"
          value={data.numFloors}
          onChange={(e) => onInputChange('numFloors', parseInt(e.target.value))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          min="1"
          max="100"
          required
        />
      </div>

      <div>
        <label htmlFor="basementType" className="block text-sm font-medium text-gray-700 mb-2">
          Basement Type *
        </label>
        <select
          id="basementType"
          value={data.basementType}
          onChange={(e) => onInputChange('basementType', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        >
          <option value="">Select basement type</option>
          <option value="full">Full</option>
          <option value="partial">Partial</option>
          <option value="crawlspace">Crawlspace</option>
          <option value="slab">Slab</option>
          <option value="none">None</option>
          <option value="other">Other</option>
        </select>
      </div>

      {data.basementType !== 'none' && data.basementType !== 'slab' && (
        <div>
          <label htmlFor="basementHeating" className="block text-sm font-medium text-gray-700 mb-2">
            Basement Heating
          </label>
          <select
            id="basementHeating"
            value={data.basementHeating || ''}
            onChange={(e) => onInputChange('basementHeating', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          >
            <option value="">Select heating type</option>
            <option value="heated">Heated</option>
            <option value="unheated">Unheated</option>
            <option value="partial">Partially Heated</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default HomeDetailsForm;
