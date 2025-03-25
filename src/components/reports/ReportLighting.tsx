import React from 'react';

interface LightingProps {
  data: {
    bulbTypes: {
      led: number;
      cfl: number;
      incandescent: number;
    };
    naturalLight: string;
    controls: string;
  };
}

const ReportLighting: React.FC<LightingProps> = ({ data }) => {
  // Determine lighting efficiency description
  let efficiencyRating = 'Average';
  const ledPercentage = data.bulbTypes.led;
  if (ledPercentage >= 70) efficiencyRating = 'High Efficiency';
  else if (ledPercentage >= 50) efficiencyRating = 'Moderate Efficiency';
  else if (ledPercentage < 30) efficiencyRating = 'Low Efficiency';

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Lighting Assessment</h2>
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Lighting Efficiency</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {efficiencyRating}
              </dd>
            </div>
            <div className="bg-white px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Natural Light</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.naturalLight}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Lighting Controls</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {data.controls}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <h3 className="text-lg font-medium mt-6 mb-3 text-gray-900">Bulb Type Distribution</h3>
      <div className="flex items-center mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-500 h-4 rounded-l-full" 
            style={{ width: `${data.bulbTypes.led}%` }}
          />
          <div 
            className="bg-blue-400 h-4" 
            style={{ 
              width: `${data.bulbTypes.cfl}%`, 
              marginTop: '-16px',
              marginLeft: `${data.bulbTypes.led}%`
            }}
          />
          <div 
            className="bg-yellow-400 h-4 rounded-r-full" 
            style={{ 
              width: `${data.bulbTypes.incandescent}%`, 
              marginTop: '-16px',
              marginLeft: `${data.bulbTypes.led + data.bulbTypes.cfl}%`
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
          <span className="text-sm">LED: {data.bulbTypes.led}%</span>
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-1"></span>
          <span className="text-sm">CFL: {data.bulbTypes.cfl}%</span>
        </div>
        <div>
          <span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-1"></span>
          <span className="text-sm">Incandescent: {data.bulbTypes.incandescent}%</span>
        </div>
      </div>
    </section>
  );
};

export default ReportLighting;
