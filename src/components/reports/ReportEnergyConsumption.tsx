import React from 'react';

interface EnergyConsumptionProps {
  data: {
    electricityUsage: number;
    gasUsage: number;
    usageHours: number;
    powerFactor: number;
    seasonalFactor: number;
    occupancyFactor: number;
  };
}

const ReportEnergyConsumption: React.FC<EnergyConsumptionProps> = ({ data }) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Energy Consumption</h2>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Annual Electricity</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.electricityUsage.toLocaleString()} kWh/year
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Annual Natural Gas</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.gasUsage.toLocaleString()} therms/year
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Daily Usage Hours</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.usageHours.toFixed(1)} hours/day
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Power Efficiency Factor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.powerFactor.toFixed(2)}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Seasonal Factor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.seasonalFactor.toFixed(2)}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Occupancy Factor</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.occupancyFactor.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};

export default ReportEnergyConsumption;
