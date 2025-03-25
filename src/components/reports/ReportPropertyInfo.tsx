import React from 'react';

interface PropertyInfoProps {
  data: {
    address: string;
    propertyType: string;
    yearBuilt: string | number;
    squareFootage: number;
  };
}

const ReportPropertyInfo: React.FC<PropertyInfoProps> = ({ data }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Property Information</h2>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.address}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Property Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.propertyType}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Year Built</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.yearBuilt}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Square Footage</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.squareFootage.toLocaleString()} sq ft
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default ReportPropertyInfo;
