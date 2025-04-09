import React, { useState } from 'react';
import EnergyAuditQuizModal from '../EnergyAuditQuizModal';
import StickyCTAFooter from '../StickyCTAFooter';
import TableOfContents from '../TableOfContents';
import SolarCalculator from './SolarCalculator';
import SolarQuiz from './SolarQuiz';

// TODO: Create and import SVG assets
// import rooftopSvg from '../../../assets/solar-images/rooftop-panel.svg';
// import solarShinglesSvg from '../../../assets/solar-images/solar-shingles.svg';
// import groundMountedSvg from '../../../assets/solar-images/ground-mounted.svg';
// import solarCarportSvg from '../../../assets/solar-images/solar-carport.svg';
// import batteryStorageSvg from '../../../assets/solar-images/battery-storage.svg';

interface SolarInteractiveFeaturesProps {
  onStartAudit: () => void;
}

// Table of contents items
const tocItems = [
  { id: 'rooftop-pv', title: 'Rooftop Solar PV Systems' },
  { id: 'solar-shingles', title: 'Solar Shingles & Tiles' },
  { id: 'ground-mounted', title: 'Ground-Mounted Solar Arrays' },
  { id: 'solar-structures', title: 'Solar Carports & Patio Covers' },
  { id: 'battery-storage', title: 'Battery Storage Systems' },
  { id: 'conclusion', title: 'Conclusion' },
];

// Poll component for user voting
const SolarPoll: React.FC<{
  votes: Record<string, number>;
  userVote: string | null;
  onVote: (option: string) => void;
}> = ({ votes, userVote, onVote }) => {
  const options = [
    { id: 'rooftop', label: 'Rooftop Panels 🏠' },
    { id: 'shingles', label: 'Solar Shingles 🏛️' },
    { id: 'ground', label: 'Ground-Mounted 🌱' },
    { id: 'carport', label: 'Solar Carport/Patio 🚗' },
    { id: 'battery', label: 'Battery Storage 🔋' },
  ];
  
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg my-6">
      <h4 className="font-bold text-center mb-3">Which solar solution interests you most?</h4>
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

// Detail content switcher
const SolarDetailContent: React.FC<{
  selectedOption: string;
  onShowDetails: (option: string) => void;
}> = ({ selectedOption, onShowDetails }) => {
  switch (selectedOption) {
    case 'rooftop-pv':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Rooftop Solar PV Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How Rooftop Solar Works:</h4>
            <p>Photovoltaic (PV) cells in solar panels convert sunlight directly into electricity. When sunlight hits the semiconductor material in solar cells, it knocks electrons loose, creating an electric current that can be captured and used.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Installation Process:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Professional assessment of roof condition, orientation, and shading</li>
              <li>Engineering design and permit acquisition (2-4 weeks)</li>
              <li>Physical installation (1-3 days for residential systems)</li>
              <li>Electrical wiring and connection to home electrical panel</li>
              <li>Inspection and utility approval (1-4 weeks)</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Financial Considerations:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Average cost: $15,000-$25,000 before incentives for 5-10kW system</li>
              <li>Federal tax credit: 30% of system cost through 2032</li>
              <li>Additional state and utility incentives vary by location</li>
              <li>Typical payback period: 7-10 years</li>
              <li>Expected lifespan: 25-30+ years with minimal maintenance</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-blue-800">Production Estimates:</h4>
            <p>A well-designed 5kW system produces approximately 5,000-8,000 kWh annually, depending on location and roof orientation. This typically offsets 50-100% of an average home's electricity usage.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'solar-shingles':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Solar Shingles & Tiles Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How Solar Shingles Work:</h4>
            <p>Solar shingles integrate photovoltaic cells into roofing materials, creating a dual-function product that both protects your roof and generates electricity. They connect to an inverter system like traditional panels but offer a more streamlined appearance.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Product Options:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Tesla Solar Roof:</strong> Full roof replacement with inactive and active solar tiles</li>
              <li><strong>GAF Energy Timberline Solar:</strong> Nailable solar shingles that integrate with asphalt roofing</li>
              <li><strong>CertainTeed Apollo:</strong> Low-profile shingles that integrate with existing roofing</li>
              <li><strong>SunTegra:</strong> Solar shingles and tiles for various roof types</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Comparative Performance:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Efficiency: 10-20% (vs. 18-22% for traditional panels)</li>
              <li>Cost: 2-3x higher than traditional solar panels</li>
              <li>Installation: Requires specialized installers, often combined with roof replacement</li>
              <li>Aesthetics: Superior curb appeal with streamlined appearance</li>
            </ul>
          </div>
          <div className="bg-purple-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-purple-800">Best Candidates:</h4>
            <p>Solar shingles make the most financial sense when you need a roof replacement anyway, have strict HOA requirements, or place a premium on aesthetics and are willing to pay for it.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'ground-mounted':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Ground-Mounted Solar Arrays Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">Installation Types:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Fixed Ground Mounts:</strong> Panels set at a fixed optimal angle</li>
              <li><strong>Pole Mounts:</strong> Panels elevated on poles, sometimes with tracking systems</li>
              <li><strong>Single-Axis Tracking:</strong> Panels that follow the sun east to west</li>
              <li><strong>Dual-Axis Tracking:</strong> Panels that follow the sun both horizontally and vertically</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Space Requirements:</h4>
            <p>A 5kW ground-mounted system typically requires about 400-500 square feet of usable land. For tracking systems, you'll need additional space to prevent panels from shading each other.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Performance Advantages:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>10-25% more energy production than rooftop systems (due to optimal angle and cooling)</li>
              <li>Easier cleaning and maintenance access</li>
              <li>No roof penetrations or structure concerns</li>
              <li>Tracking systems can increase production by 25-40%</li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-green-800">Cost Considerations:</h4>
            <p>Ground mounts typically cost 10-30% more than rooftop installations due to additional materials and foundation work. However, the increased production can offset this premium over time, especially with tracking systems.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'solar-structures':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Solar Carports & Patio Covers Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">Structure Types:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Solar Carports:</strong> Covered parking with integrated solar panels</li>
              <li><strong>Solar Patio Covers:</strong> Shade structures with integrated panels</li>
              <li><strong>Solar Pergolas:</strong> Decorative structures with semi-transparent panels</li>
              <li><strong>Solar Awnings:</strong> Window or door covers with integrated panels</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Dual-Purpose Benefits:</h4>
            <p>These structures provide both usable covered outdoor space and clean energy generation. They're particularly valuable in hot climates where shade itself provides significant comfort and energy saving benefits.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Technical Specifications:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Typical carport: 3-6kW system (2-car carport)</li>
              <li>Patio cover: 2-4kW system (200-400 square feet)</li>
              <li>Mounting height: Typically 7-12 feet</li>
              <li>Snow load and wind ratings important for local conditions</li>
            </ul>
          </div>
          <div className="bg-amber-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-amber-800">Installation Considerations:</h4>
            <p>Most solar structures require proper foundation work and permits as new structures. They often fall under both building codes and electrical codes, requiring coordinated inspections.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'battery-storage':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Battery Storage Systems Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">Popular Battery Options:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Tesla Powerwall:</strong> 13.5kWh capacity, whole-home backup capability</li>
              <li><strong>LG Chem RESU:</strong> 9.8-16kWh options, compact design</li>
              <li><strong>Enphase IQ Battery:</strong> Modular system (3.4kWh per unit)</li>
              <li><strong>Generac PWRcell:</strong> Modular system (3-18kWh) with higher power output</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">System Configurations:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>DC-coupled:</strong> Battery connects directly to solar system before inverter</li>
              <li><strong>AC-coupled:</strong> Battery has own inverter, connects to home electrical panel</li>
              <li><strong>Whole-home backup:</strong> Powers entire electrical panel during outages</li>
              <li><strong>Partial backup:</strong> Powers critical loads only during outages</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Economic Benefits:</h4>
            <p>Batteries provide value in several scenarios:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Areas with time-of-use rates (store energy when cheap, use when expensive)</li>
              <li>Regions with reduced net metering compensation</li>
              <li>Areas with frequent power outages</li>
              <li>Utility programs that pay for grid services (demand response)</li>
            </ul>
          </div>
          <div className="bg-sky-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-sky-800">Sizing Guidelines:</h4>
            <p>Most homes start with 10-15kWh of battery capacity, which can run essential appliances for 8-12 hours during an outage. Energy-intensive items like air conditioners and electric heating require larger systems or load management.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    default:
      return null;
  }
};

const SolarInteractiveFeatures: React.FC<SolarInteractiveFeaturesProps> = ({
  onStartAudit
}) => {
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    rooftop: 78,
    shingles: 45,
    ground: 32,
    carport: 29,
    battery: 64
  });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  
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
    <div className="solar-interactive-content mt-6">
      {/* Table of Contents */}
      <TableOfContents
        items={tocItems}
        containerClassName="mb-8"
      />
      <div className="content space-y-12 mt-8">
        {/* Rooftop Solar Section */}
        <section id="rooftop-pv" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🔋 1. Rooftop Solar PV Systems – The Classic Powerhouse</h2>
          <p className="italic text-gray-600 mb-4">"The OG of home solar that still dominates the market."</p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You're a homeowner with an unshaded south-facing roof who wants to generate your own electricity.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> Silent energy production happening right above your head while you go about your day.</li>
                <li><strong>Benefits:</strong> Generates electricity directly from sunlight (no moving parts!), reduces or eliminates your electricity bills, 25+ year lifespan with minimal maintenance.</li>
                <li><strong>Best For:</strong> Single-family homes with suitable roof orientation and exposure.</li>
                <li><strong>Heads-up:</strong> Initial investment ranges from $15,000–$25,000 before incentives (but ROI is typically 7–10 years).</li>
              </ul>
              <button
                onClick={() => setSelectedOption('rooftop-pv')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Calculate My Solar Potential ☀️
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              {/* Replace with actual SVG when available */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Rooftop Solar Panel Image</span>
              </div>
            </div>
          </div>
          {selectedOption === 'rooftop-pv' &&
            <SolarCalculator
              onComplete={(result) => {
                console.log('Solar calculation complete:', result);
                // Could track the result with analytics here
              }}
            />
          }
        </section>
        
        {/* Solar Shingles Section */}
        <section id="solar-shingles" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🏡 2. Solar Shingles & Tiles – The Sleek Integrator</h2>
          <p className="italic text-gray-600 mb-4">"Where curb appeal meets clean energy."</p>
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You want solar but hate the look of traditional panels, or you have an HOA with strict aesthetic requirements.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> They look like regular roof materials while secretly generating power.</li>
                <li><strong>Benefits:</strong> Seamlessly blends with your existing roof, dual function (roof protection + energy production), often more wind-resistant than rack-mounted panels.</li>
                <li><strong>Best For:</strong> New construction, roof replacements, or design-conscious homeowners.</li>
                <li><strong>Watch Out:</strong> Costs 2–3x more than panels with slightly lower efficiency.</li>
              </ul>
              <button
                onClick={() => setSelectedOption('solar-shingles')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                See Design Options 🎨
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              {/* Replace with actual SVG when available */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Solar Shingles Comparison Image</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg my-6">
            <h4 className="font-bold">⚡ Pro Tip</h4>
            <p>If you're already planning a roof replacement, solar shingles might be more cost-effective long term than installing a new roof + traditional solar.</p>
          </div>
          {selectedOption === 'solar-shingles' &&
            <SolarDetailContent
              selectedOption={selectedOption}
              onShowDetails={setSelectedOption}
            />
          }
        </section>
        
        {/* Ground-Mounted Section */}
        <section id="ground-mounted" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🌳 3. Ground-Mounted Solar Arrays – The Space Utilizer</h2>
          <p className="italic text-gray-600 mb-4">"Bringing solar down to earth when your roof isn't ideal."</p>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You've got open land but a shaded or unsuitable roof.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> You can aim these at the sun perfectly for max power.</li>
                <li><strong>Benefits:</strong> Easy to access and maintain, optimized tilt and orientation, expandable if your needs grow.</li>
                <li><strong>Best For:</strong> Properties with unshaded yard space.</li>
                <li><strong>Consider This:</strong> Requires permitting and more land clearance.</li>
              </ul>
              <button
                onClick={() => setSelectedOption('ground-mounted')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Explore Land Requirements 📐
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              {/* Replace with actual SVG when available */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Ground-Mounted Array Image</span>
              </div>
            </div>
          </div>
          {selectedOption === 'ground-mounted' &&
            <SolarDetailContent
              selectedOption={selectedOption}
              onShowDetails={setSelectedOption}
            />
          }
        </section>
        
        {/* Solar Structures Section */}
        <section id="solar-structures" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🚗 4. Solar Carports & Patio Covers – The Multi-Tasker</h2>
          <p className="italic text-gray-600 mb-4">"Making everyday structures work double-duty."</p>
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You want covered parking or outdoor space <i>and</i> generate power.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> You're turning sun exposure into something useful <i>and</i> protective.</li>
                <li><strong>Benefits:</strong> Provides shade and electricity, protects vehicles or patio space, doesn't touch your roof.</li>
                <li><strong>Best For:</strong> Homes with large driveways, patios, or decks.</li>
                <li><strong>Keep in Mind:</strong> Custom structures cost more than rack-mounted panels.</li>
              </ul>
              <button
                onClick={() => setSelectedOption('solar-structures')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Design My Solar Structure 🛠️
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              {/* Replace with actual SVG when available */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Solar Carport Image</span>
              </div>
            </div>
          </div>
          {selectedOption === 'solar-structures' &&
            <SolarDetailContent
              selectedOption={selectedOption}
              onShowDetails={setSelectedOption}
            />
          }
        </section>
        
        {/* Battery Storage Section */}
        <section id="battery-storage" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🔋 5. Battery Storage Systems – The Independence Maker</h2>
          <p className="italic text-gray-600 mb-4">"Taking your solar setup to the next level: true energy freedom."</p>
          <div className="bg-sky-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You want backup power or to boost solar savings.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> Your house becomes its own mini grid.</li>
                <li><strong>Benefits:</strong> Store excess solar energy for night use, backup essential appliances during outages, lower grid dependence.</li>
                <li><strong>Best For:</strong> Homes with time-of-use billing, outage-prone areas, or limited net metering.</li>
                <li><strong>Heads-up:</strong> Adds $10,000–$20,000 to your system cost, but qualifies for a 30% tax credit.</li>
              </ul>
              <button
                onClick={() => setSelectedOption('battery-storage')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Estimate My Backup Power Needs 🔌
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              {/* Replace with actual SVG when available */}
              <div className="aspect-video bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">Battery Storage System Image</span>
              </div>
            </div>
          </div>
          {selectedOption === 'battery-storage' &&
            <SolarDetailContent
              selectedOption={selectedOption}
              onShowDetails={setSelectedOption}
            />
          }
        </section>
        
        {/* Conclusion Section */}
        <section id="conclusion" className="scroll-mt-24 bg-green-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800 mb-3">Making the Right Choice for Your Home</h2>
          <p className="mb-4">
            Residential solar isn't one-size-fits-all. The best system for you depends on your energy needs, property, budget, and aesthetic preferences. Whether you're looking to maximize savings, increase home value, reduce your carbon footprint, or gain energy independence, there's a solar solution that fits.
          </p>
          
          {/* Adding the Solar Quiz Component */}
          <div className="my-8">
            <h3 className="text-xl font-bold text-green-700 mb-3">Find Your Ideal Solar Solution</h3>
            <p className="mb-4">Answer a few quick questions to get personalized solar recommendations that match your home and goals.</p>
            <SolarQuiz 
              onComplete={(result) => {
                console.log('Quiz completed with result:', result);
                // Could track the result with analytics here
              }}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-green-700">🏆 Best for Maximizing Energy:</h4>
              <p>Ground-mounted systems with tracking technology.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-green-700">💰 Best Return on Investment:</h4>
              <p>Traditional rooftop solar on south-facing roof.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-green-700">🏡 Best for Aesthetics:</h4>
              <p>Solar shingles or high-end all-black panels.</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-bold text-green-700">⚡ Best for Energy Independence:</h4>
              <p>Any solar system paired with battery storage.</p>
            </div>
          </div>
          <blockquote className="border-l-4 border-green-600 pl-4 italic my-6">
            <p className="text-lg">Ready to find the perfect solar solution for your home? Take our personalized energy audit to get a customized recommendation.</p>
          </blockquote>
          <button
            onClick={() => setShowQuizModal(true)}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium text-lg"
          >
            Start My Free Solar Assessment ☀️
          </button>
        </section>
      </div>
      
      {/* Energy Audit Quiz Modal */}
      <EnergyAuditQuizModal
        open={showQuizModal}
        onOpenChange={setShowQuizModal}
        onComplete={onStartAudit}
      />
      
      {/* Sticky CTA Footer */}
      <StickyCTAFooter
        onStartAudit={onStartAudit}
        delayBeforeShow={5000}
        scrollTriggerPoint={40}
      />
      
      {/* Poll Component */}
      <SolarPoll
        votes={pollVotes}
        userVote={userVote}
        onVote={handleVote}
      />
    </div>
  );
};

export default SolarInteractiveFeatures;
