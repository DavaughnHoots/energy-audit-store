import React, { useState } from 'react';
import TableOfContents from '../TableOfContents';

interface EnergyEfficiencyInteractiveFeaturesProps {
  onStartAudit: () => void;
}

// Table of contents items
const tocItems = [
  { id: 'why-matters', title: 'Why Energy Efficiency Matters' },
  { id: 'energy-loss', title: 'Where Your Home Loses Energy' },
  { id: 'efficiency-pyramid', title: 'The Home Energy Efficiency Pyramid' },
  { id: 'quick-tips', title: 'Quick Energy-Saving Tips' },
  { id: 'energy-bills', title: 'Understanding Your Energy Bills' },
  { id: 'next-steps', title: 'Next Steps' },
  { id: 'conclusion', title: 'Conclusion' },
];

const EnergyEfficiencyPoll: React.FC<{
  votes: Record<string, number>;
  userVote: string | null;
  onVote: (option: string) => void;
}> = ({ votes, userVote, onVote }) => {
  const options = [
    { id: 'air-sealing', label: 'Air Sealing 🚪' },
    { id: 'insulation', label: 'Insulation 🧣' },
    { id: 'hvac', label: 'HVAC Optimization 🌡️' },
    { id: 'windows', label: 'Windows & Doors 🪟' },
    { id: 'appliances', label: 'Appliance Upgrades ⚡' },
  ];
  
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg my-6">
      <h4 className="font-bold text-center mb-3">Which energy efficiency upgrade seems most valuable for your home?</h4>
      <div className="space-y-2">
        {options.map((option) => {
          const voteCount = votes[option.id] || 0;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          return (
            <div key={option.id} className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onVote(option.id)}
                  disabled={userVote !== null}
                  className={`flex items-center ${
                    userVote === option.id
                      ? 'text-green-700 font-medium'
                      : userVote !== null
                      ? 'text-gray-500'
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  <span className="mr-2">{option.label}</span>
                  {userVote === option.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-gray-500">{voteCount} votes ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${userVote === option.id ? 'bg-green-600' : 'bg-blue-500'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      {userVote && (
        <p className="text-sm text-center mt-3 text-gray-600">
          Thanks for voting! {options.find(o => o.id === userVote)?.label} is a popular choice.
        </p>
      )}
    </div>
  );
};

const EnergyEfficiencyInteractiveFeatures: React.FC<EnergyEfficiencyInteractiveFeaturesProps> = ({ onStartAudit }) => {
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    'air-sealing': 45,
    'insulation': 38,
    'hvac': 27,
    'windows': 32,
    'appliances': 21
  });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  const handleVote = (option: string) => {
    if (userVote === null) {
      setPollVotes({
        ...pollVotes,
        [option]: (pollVotes[option] || 0) + 1
      });
      setUserVote(option);
    }
  };

  return (
    <div className="energy-efficiency-interactive-content mt-6">
      {/* Table of Contents */}
      <TableOfContents
        items={tocItems}
        containerClassName="mb-8"
      />
      
      <div className="content space-y-12 mt-8">
        {/* Why Energy Efficiency Matters Section */}
        <section id="why-matters" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">💡 Why Energy Efficiency Matters</h2>
          <p className="italic text-gray-600 mb-4">"Smart energy use saves money, improves comfort, and helps the planet."</p>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-bold">Financial Impact</h4>
            <p>The average American household spends more than <strong>$2,000/year on energy</strong>, with nearly half going to heating and cooling. Boosting your home's energy efficiency can save you 20–30% on your utility bills.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-700">Benefits Beyond Savings</h4>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Increased comfort:</strong> Fewer drafts and more consistent temperatures</li>
                <li><strong>Improved air quality:</strong> Better ventilation and less dust/allergens</li>
                <li><strong>Reduced carbon footprint:</strong> Lower greenhouse gas emissions</li>
                <li><strong>Enhanced property value:</strong> Energy-efficient homes often sell for more</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-bold text-green-700">The Numbers</h4>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Energy-efficient homes use 20-30% less energy than typical homes</li>
                <li>Simple upgrades can save $200-$400 annually</li>
                <li>Comprehensive improvements can save $500-$800+ annually</li>
                <li>Each $1 invested in energy efficiency yields about $4 in lifetime savings</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Where Your Home Loses Energy Section */}
        <section id="energy-loss" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🚪 Where Your Home Loses Energy</h2>
          <p className="italic text-gray-600 mb-4">"Think of your home as a bucket — if it's full of holes, no matter how much water (or energy) you pour in, it leaks."</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 mt-3">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% of Energy Loss</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Air Leaks</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">30–40%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Poor Insulation</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">20–30%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Inefficient HVAC</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10–20%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Windows & Doors</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10–15%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Outdated Appliances</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10–15%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        {/* The Home Energy Efficiency Pyramid Section */}
        <section id="efficiency-pyramid" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🔺 The Home Energy Efficiency Pyramid</h2>
          <p className="italic text-gray-600 mb-4">"Start with what's cheapest and most impactful, then build upward."</p>
          
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h4 className="font-bold">The Priority Ladder</h4>
            <p>The best upgrades follow a pyramid structure for maximum cost-effectiveness:</p>
          </div>
          
          <div className="relative mx-auto max-w-lg text-center mb-6">
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[180px] border-l-transparent border-r-transparent border-b-gray-100 relative">
                <div className="absolute -bottom-[180px] -left-[100px] w-[200px] h-[180px] flex flex-col">
                  <div className="h-[30px] flex items-center justify-center text-xs bg-green-100 hover:bg-green-200 cursor-pointer">
                    Renewable Energy
                  </div>
                  <div className="h-[30px] flex items-center justify-center text-xs bg-green-200 hover:bg-green-300 cursor-pointer">
                    Appliance Upgrades
                  </div>
                  <div className="h-[30px] flex items-center justify-center text-xs bg-green-300 hover:bg-green-400 cursor-pointer">
                    Windows & Doors
                  </div>
                  <div className="h-[30px] flex items-center justify-center text-xs bg-green-400 hover:bg-green-500 cursor-pointer">
                    HVAC Optimization
                  </div>
                  <div className="h-[30px] flex items-center justify-center text-xs bg-green-500 hover:bg-green-600 cursor-pointer">
                    Insulation
                  </div>
                  <div className="h-[30px] flex items-center justify-center text-xs bg-green-600 hover:bg-green-700 text-white cursor-pointer">
                    Air Sealing (START HERE)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <EnergyEfficiencyPoll
            onVote={handleVote}
            votes={pollVotes}
            userVote={userVote}
          />
        </section>
        
        {/* Quick Energy-Saving Tips Section */}
        <section id="quick-tips" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">⚡ Quick Energy-Saving Tips</h2>
          <p className="italic text-gray-600 mb-4">"You don't need a big budget to start saving. These simple actions can make an immediate difference."</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-bold text-yellow-800">No-Cost Actions</h4>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Lower your thermostat</strong> by 7–10°F for 8 hrs/day → save ~10%</li>
                <li><strong>Adjust ceiling fans</strong> seasonally (counterclockwise in summer, clockwise in winter)</li>
                <li><strong>Use natural lighting</strong> when possible and turn off lights when not in use</li>
                <li><strong>Clean refrigerator coils</strong> and maintain appliances regularly</li>
                <li><strong>Unplug chargers</strong> and electronics when not in use</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-bold text-blue-800">Low-Cost Investments</h4>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Switch to LED bulbs</strong> (use 75% less energy than incandescent)</li>
                <li><strong>Install a programmable thermostat</strong> to automate temperature changes</li>
                <li><strong>Weather-strip doors and windows</strong> to prevent air leaks</li>
                <li><strong>Add outlet gaskets</strong> to exterior wall electrical outlets</li>
                <li><strong>Add door sweeps</strong> to exterior doors with gaps at the bottom</li>
              </ul>
            </div>
          </div>
        </section>
        
        {/* Understanding Your Energy Bills Section */}
        <section id="energy-bills" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">📊 Understanding Your Energy Bills</h2>
          <p className="italic text-gray-600 mb-4">"Knowledge is power—especially when it comes to your power bill."</p>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <h4 className="font-bold mb-2">Common Terminology</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Kilowatt-hours (kWh):</strong> Standard unit for measuring electricity consumption</li>
              <li><strong>Therms or CCF:</strong> Units for measuring natural gas usage</li>
              <li><strong>Base charges:</strong> Fixed fees regardless of usage</li>
              <li><strong>Tiered rates:</strong> Increasing cost per unit as usage increases</li>
            </ul>
          </div>
        </section>
        
        {/* Next Steps Section */}
        <section id="next-steps" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🛣️ Next Steps</h2>
          <p className="italic text-gray-600 mb-4">"Turning knowledge into action creates real change."</p>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-bold text-xl mb-4">Your Energy Efficiency Action Plan</h3>
            <ol className="list-decimal pl-5 space-y-4">
              <li className="font-medium">
                <span className="text-green-700">Assess your home's current state</span>
                <p className="font-normal text-sm mt-1">Consider a professional energy audit or perform a DIY assessment to identify your biggest energy wasters.</p>
              </li>
              <li className="font-medium">
                <span className="text-green-700">Create a prioritized project list</span>
                <p className="font-normal text-sm mt-1">Use the Energy Efficiency Pyramid to determine which improvements offer the best ROI. Focus on air sealing and insulation first.</p>
              </li>
              <li className="font-medium">
                <span className="text-green-700">Research available incentives</span>
                <p className="font-normal text-sm mt-1">Check for federal tax credits, utility rebates, and local incentives that can help offset your costs.</p>
              </li>
            </ol>
            
            <div className="mt-6">
              <button 
                onClick={onStartAudit}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium"
              >
                Start Your Home Energy Assessment
              </button>
            </div>
          </div>
        </section>
        
        {/* Conclusion Section */}
        <section id="conclusion" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🏁 Conclusion</h2>
          <p className="text-gray-700 mb-4">
            Improving your home's energy efficiency is not just about saving money—it's about creating a more comfortable living space, reducing your environmental impact, and increasing your property value. By following the principles outlined in the Energy Efficiency Pyramid and starting with the highest-ROI improvements, you can make meaningful progress without overwhelming yourself or your budget.
          </p>
          <p className="text-gray-700 mb-4">
            Remember that every home is unique, and the best energy efficiency strategy will depend on your specific circumstances. Our energy assessment tool can help you create a customized plan for your home.
          </p>
        </section>
      </div>
    </div>
  );
};

export default EnergyEfficiencyInteractiveFeatures;
