import React from 'react';
import PDFDownloadButton from '../pdf/PDFDownloadButton';
// Mock implementation of useComponentTracking hook
const useComponentTracking = (section: string, component: string) => {
  return (event: string, data?: any) => {
    console.log(`Analytics: ${section}.${component} - ${event}`, data);
    // In a real implementation, this would send analytics data
  };
};
// Using a simple implementation instead of importing TableOfContents
const TableOfContents = ({ items, containerClassName }: { items: {id: string, title: string}[], containerClassName?: string }) => (
  <div className={`toc ${containerClassName || ''}`}>
    <h3 className="text-lg font-semibold mb-3">Contents</h3>
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item.id}>
          <a href={`#${item.id}`} className="text-green-600 hover:text-green-800 hover:underline">
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  </div>
);
import SeasonalVideoPlayer from './interactive/SeasonalVideoPlayer';
import SummerCoolingEstimator from './interactive/SummerCoolingEstimator';
import FallEnergyPrepTools from './interactive/FallEnergyPrepTools';
import WinterEnergyQuiz from './interactive/WinterEnergyQuiz';

interface SeasonalEnergyTipsInteractiveFeaturesProps {
  onStartAudit: () => void;
}

// Table of contents items
const tocItems = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'spring', title: 'Spring Energy Tips' },
  { id: 'summer', title: 'Summer Energy Tips' },
  { id: 'fall', title: 'Fall Energy Tips' },
  { id: 'winter', title: 'Winter Energy Tips' },
  { id: 'year-round', title: 'Year-Round Calendar' },
];

const SeasonalEnergyTipsInteractiveFeatures: React.FC<SeasonalEnergyTipsInteractiveFeaturesProps> = ({ 
  onStartAudit 
}) => {
  const trackComponentEvent = useComponentTracking('education', 'SeasonalEnergyTipsInteractiveFeatures');

  return (
    <div className="seasonal-energy-tips-interactive-content mt-6">
      {/* Video player at the top */}
      <SeasonalVideoPlayer 
        title="Seasonal Energy Strategies Video"
        description="A comprehensive guide to optimizing your home's energy efficiency for every season of the year."
      />
      
      {/* Table of Contents */}
      <TableOfContents
        items={tocItems}
        containerClassName="mb-8"
      />
      
      <div className="content space-y-10 mt-8">
        {/* Introduction */}
        <section id="introduction" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Save More All Year Long: Smart Energy Moves for Every Season</h2>
          <p className="text-gray-600 mb-4">
            Want to stay comfortable and energy-efficient 365 days a year? This guide breaks down smart energy-saving strategies tailored for each season. Whether it's heating in winter or cooling in summer, a few simple tweaks can lead to big savings — and a more comfortable home.
          </p>
        </section>
        
        {/* Spring Tips Section */}
        <section id="spring" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-700 mb-3">🌱 Spring Energy Tips – Get Ready to Cool Down</h2>
          <p className="text-gray-600 mb-4">
            Spring is the ideal time to prepare your home for the coming heat. Focus on maintenance tasks that will
            ensure efficient cooling and natural ventilation to save energy during warm months.
          </p>
          
          <div className="mb-6">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">✅</span>
                <span>Schedule HVAC maintenance before the cooling season</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">❄️</span>
                <span>Clean refrigerator coils and check door seals</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">🪟</span>
                <span>Use natural ventilation instead of mechanical cooling</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">🧼</span>
                <span>Clean window screens to maximize airflow</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">🚪</span>
                <span>Reseal weatherstripping around doors and windows</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">🔄</span>
                <span>Set ceiling fans to <strong>counterclockwise</strong> rotation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 font-bold mr-2">🌳</span>
                <span>Plant shade trees on south/west-facing walls for long-term benefit</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg my-4">
            <PDFDownloadButton
              resourceId="spring-prep-checklist"
              title="Spring Prep Checklist"
              templateType="checklist"
              className="text-green-700 hover:text-green-800 font-medium flex items-center"
              onClick={() => trackComponentEvent('click_download_checklist', { season: 'spring' })}
            >
              👉 Download the Spring Prep Checklist 🌸
            </PDFDownloadButton>
          </div>
        </section>
        
        {/* Summer Tips Section */}
        <section id="summer" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-yellow-600 mb-3">☀️ Summer Energy Tips – Chill Without the Overload</h2>
          <p className="text-gray-600 mb-4">
            Summer cooling costs can skyrocket without proper energy management. These strategies help maintain comfort
            while minimizing energy waste during the hottest months.
          </p>
          
          <div className="mb-6">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🌡️</span>
                <span>Set thermostat to 78°F when home, higher when away</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🌀</span>
                <span>Use ceiling fans (turn off when leaving the room)</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🌇</span>
                <span>Close blinds/curtains during hottest parts of the day</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🍳</span>
                <span>Grill outside to reduce indoor heat load</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🌫️</span>
                <span>Run kitchen & bathroom exhaust fans to remove humidity</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🌙</span>
                <span>Run big appliances in the evening</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🧠</span>
                <span>Use a programmable or smart thermostat</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 font-bold mr-2">🧼</span>
                <span>Check/replace AC filters monthly</span>
              </li>
            </ul>
          </div>

          {/* Summer Cooling Estimator */}
          <SummerCoolingEstimator />
        </section>
        
        {/* Fall Tips Section */}
        <section id="fall" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-orange-600 mb-3">🍂 Fall Energy Tips – Prep for Cold While It's Mild</h2>
          <p className="text-gray-600 mb-4">
            Fall is your opportunity to prepare for winter heating demands. Taking care of these tasks now saves 
            both energy and money when temperatures drop.
          </p>
          
          <div className="mb-6">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">🔧</span>
                <span>Schedule furnace maintenance and tune-up</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">🔍</span>
                <span>Seal air leaks in walls, doors, and attics</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">🧱</span>
                <span>Inspect attic insulation depth</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">🧹</span>
                <span>Clean gutters to prevent winter ice dams</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">🚪</span>
                <span>Add or repair door sweeps</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">🔄</span>
                <span>Reverse fans to <strong>clockwise</strong> for winter mode</span>
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 font-bold mr-2">💧</span>
                <span>Consider a humidifier to stay comfortable at lower temps</span>
              </li>
            </ul>
          </div>

          {/* Fall Energy Prep Tools */}
          <FallEnergyPrepTools />
        </section>
        
        {/* Winter Tips Section */}
        <section id="winter" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-blue-600 mb-3">❄️ Winter Energy Tips – Stay Warm, Spend Less</h2>
          <p className="text-gray-600 mb-4">
            Winter heating typically accounts for the largest portion of home energy bills. These strategies help 
            maintain a warm, comfortable home while reducing energy waste.
          </p>
          
          <div className="mb-6">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">🌡️</span>
                <span>Set thermostat to 68°F when home, lower at night or away</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">🌞</span>
                <span>Open curtains on south-facing windows during the day</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">🌚</span>
                <span>Close them at night to retain warmth</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">🚪</span>
                <span>Use draft stoppers under doors</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">💧</span>
                <span>Maintain indoor humidity around 40–50%</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">⚡</span>
                <span>Seal leaks around electrical outlets</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">🔥</span>
                <span>Use space heaters safely in small zones only</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 font-bold mr-2">🔧</span>
                <span>Insulate hot water pipes</span>
              </li>
            </ul>
          </div>

          {/* Winter Energy Efficiency Quiz */}
          <WinterEnergyQuiz />
        </section>
        
        {/* Year-Round Calendar Section */}
        <section id="year-round" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">📅 Year-Round Seasonal Calendar</h2>
          <p className="text-gray-600 mb-4">
            Map your energy savings strategy with this simple schedule. Timing your energy-saving activities 
            appropriately ensures you're always prepared for upcoming seasonal changes.
          </p>
          
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Spring & Summer</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>March/April:</strong> HVAC checkup, fridge coil cleaning</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>May:</strong> Window screens, fan direction switch</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>June:</strong> Thermostat settings, AC filter check</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>August:</strong> Monitor AC performance</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Fall & Winter</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>Sept/Oct:</strong> Seal gaps, inspect furnace</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>Nov:</strong> Prep for drafts and insulation upgrades</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-500 font-bold mr-2">🗓️</span>
                    <span><strong>Jan:</strong> Analyze bills, tweak thermostat routines</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 text-center">
              <PDFDownloadButton
                resourceId="full-seasonal-checklist"
                title="Full Seasonal Checklist"
                templateType="checklist"
                className="text-green-600 hover:text-green-700 font-medium inline-flex items-center"
                onClick={() => trackComponentEvent('click_download_calendar', { type: 'full_calendar' })}
              >
                👉 Download the Full Seasonal Checklist PDF 📄
              </PDFDownloadButton>
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h3 className="font-bold text-xl mb-4">Ready to Maximize Your Home's Energy Efficiency?</h3>
            <p className="mb-4">Creating a personalized energy efficiency plan starts with understanding your home's 
              specific needs. Our energy audit tool helps identify your biggest opportunities for savings.</p>
            
            <div className="mt-6">
              <button 
                onClick={() => {
                  trackComponentEvent('click_start_audit');
                  onStartAudit();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium"
              >
                Start Your Home Energy Assessment
              </button>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-500">#SeasonalSavings #SmartEnergyMoves #ComfortAndEfficiency</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SeasonalEnergyTipsInteractiveFeatures;