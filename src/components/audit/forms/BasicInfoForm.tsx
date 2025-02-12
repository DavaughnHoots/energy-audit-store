import React from 'react';
import { BasicInfo } from '../../../../backend/src/types/energyAudit';

interface BasicInfoFormProps {
  data: BasicInfo;
  onInputChange: (field: keyof BasicInfo, value: string) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ data, onInputChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          id="fullName"
          value={data.fullName}
          onChange={(e) => onInputChange('fullName', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          id="email"
          value={data.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={data.phone || ''}
          onChange={(e) => onInputChange('phone', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          placeholder="Optional"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
          Address *
        </label>
        <input
          type="text"
          id="address"
          value={data.address}
          onChange={(e) => onInputChange('address', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label htmlFor="auditDate" className="block text-sm font-medium text-gray-700 mb-2">
          Audit Date *
        </label>
        <input
          type="date"
          id="auditDate"
          value={data.auditDate}
          onChange={(e) => onInputChange('auditDate', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
          Property Type *
        </label>
        <select
          id="propertyType"
          value={data.propertyType}
          onChange={(e) => onInputChange('propertyType', e.target.value as BasicInfo['propertyType'])}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        >
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="multi-family">Multi-Family</option>
        </select>
      </div>

      <div>
        <label htmlFor="yearBuilt" className="block text-sm font-medium text-gray-700 mb-2">
          Year Built *
        </label>
        <input
          type="number"
          id="yearBuilt"
          value={data.yearBuilt}
          onChange={(e) => onInputChange('yearBuilt', e.target.value)}
          min="1800"
          max={new Date().getFullYear()}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          required
        />
      </div>
    </div>
  );
};

export default BasicInfoForm;
