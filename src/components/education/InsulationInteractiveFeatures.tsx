import React, { useState } from 'react';
import EnergyAuditQuizModal from './EnergyAuditQuizModal';
import StickyCTAFooter from './StickyCTAFooter';
import TableOfContents from './TableOfContents';
import ResultsSummaryModal from './ResultsSummaryModal';
import aerogelSvg from '../../assets/insulation-images/aerogel.svg';
import pcmSvg from '../../assets/insulation-images/pcm.svg';
import radiantBarrierSvg from '../../assets/insulation-images/radiant-barrier.svg';
interface InsulationInteractiveFeaturesProps {
  onStartAudit: () => void;
}
// Table of contents items
const tocItems = [
  { id: 'aerogel', title: 'Aerogel Insulation' },
  { id: 'vips', title: 'Vacuum Insulation Panels' },
  { id: 'sips', title: 'Structural Insulated Panels' },
  { id: 'pcms', title: 'Phase Change Materials' },
  { id: 'radiant', title: 'Reflective & Radiant Barrier' },
  { id: 'conclusion', title: 'Conclusion' },
];
// Poll component for user voting
const InsulationPoll: React.FC<{
  votes: Record<string, number>;
  userVote: string | null;
  onVote: (option: string) => void;
}> = ({ votes, userVote, onVote }) => {
  const options = [
    { id: 'aerogel', label: 'Aerogel 🧊' },
    { id: 'vips', label: 'Vacuum Panels 🚀' },
    { id: 'sips', label: 'SIPs 🏗️' },
    { id: 'pcms', label: 'PCMs 🌡️' },
    { id: 'radiant', label: 'Radiant Barrier ☀️' },
  ];
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
  return (
    <div className="bg-gray-50 p-4 rounded-lg my-6">
      <h4 className="font-bold text-center mb-3">Which insulation technique do you find most interesting?</h4>
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
const InsulationDetailContent: React.FC<{
  selectedTechnique: string;
  onShowDetails: (technique: string) => void;
}> = ({ selectedTechnique, onShowDetails }) => {
  switch (selectedTechnique) {
    case 'aerogel':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Aerogel Insulation Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How Aerogel Works:</h4>
            <p>Aerogel is 95% air by volume, trapped in a matrix of silica. Its nano-porous structure blocks heat transfer pathways, resulting in exceptional thermal resistance (R-value).</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Best Applications:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Thin insulation for space-constrained renovations</li>
              <li>Cold spots and thermal bridges</li>
              <li>High-end renovations where space is at a premium</li>
              <li>Typical cost: $8-12 per square foot</li>
            </ul>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'vips':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Vacuum Insulation Panels (VIPs) Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How VIPs Work:</h4>
            <p>VIPs consist of a core material encased in an airtight envelope with all air removed. This vacuum severely limits heat transfer via convection and conduction, resulting in R-values of 30-60 per inch.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Best Applications:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Modern minimalist designs with thin walls</li>
              <li>Refrigeration and climate-controlled storage</li>
              <li>Luxury residential renovations</li>
              <li>Typical cost: $20-50 per square foot</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Installation Considerations:</h4>
            <p>VIPs cannot be cut or penetrated after manufacturing without losing their vacuum and insulative value. They require careful planning and professional installation.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'sips':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Structural Insulated Panels (SIPs) Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How SIPs Work:</h4>
            <p>SIPs sandwich rigid foam insulation between two layers of structural board (typically OSB). This creates a strong, airtight panel that serves as both structure and insulation, with R-values of 14-28 depending on thickness.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Best Applications:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>New construction for energy-efficient homes</li>
              <li>Prefabricated and modular building</li>
              <li>Best for new construction or major renovations</li>
              <li>Requires professional installation</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Structural Benefits:</h4>
            <p>Unlike traditional stick framing, SIPs provide continuous insulation without thermal bridging through studs. They also create an extremely strong structure resistant to wind and seismic forces.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">DIY Potential:</h4>
            <p>SIPs can be installed by experienced DIYers with proper planning, but professional help is recommended for first-time users.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Panels come pre-cut based on architectural drawings</li>
              <li>Specialized tools may be required for lifting and positioning</li>
              <li>Proper sealing of panel joints is critical for performance</li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-green-800">Environmental Impact:</h4>
            <p>SIPs buildings typically use 40-60% less energy for heating and cooling compared to stick-built construction.</p>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'pcms':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Phase Change Materials (PCMs) Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How PCMs Work:</h4>
            <p>PCMs absorb and release thermal energy during the process of melting and freezing. This allows them to capture excess heat during the day and release it at night, effectively regulating indoor temperatures passively.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Types of PCMs:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Organic (paraffin, fatty acids)</li>
              <li>Inorganic (salt hydrates)</li>
              <li>Bio-based (vegetable oils, coconut oil)</li>
              <li>Encapsulated in various materials for building integration</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Best Applications:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Climates with high day/night temperature swings</li>
              <li>Passive solar design enhancement</li>
              <li>Ceiling tiles and acoustic panels</li>
              <li>Window treatments and shades</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Installation Methods:</h4>
            <p>PCMs can be integrated into buildings in several ways:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Microencapsulated in wallboard</li>
              <li>Packaged in pouches for ceiling/wall cavities</li>
              <li>Integrated into concrete or plaster</li>
              <li>As a component in specialized window systems</li>
            </ul>
          </div>
          <button onClick={() => onShowDetails('')} className="mt-4 text-green-600 hover:text-green-800 font-medium">
            ← Back to overview
          </button>
        </div>
      );
    case 'radiant':
      return (
        <div className="bg-white p-5 rounded-lg shadow-sm">
          <h3 className="text-xl font-bold mb-4">Reflective & Radiant Barrier Details</h3>
          <div className="mb-3">
            <h4 className="font-bold">How Radiant Barriers Work:</h4>
            <p>Unlike mass insulation, radiant barriers reflect heat radiation rather than slowing conduction. The highly reflective material (usually aluminum) reflects up to 97% of radiant heat, preventing it from entering the living space.</p>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Best Applications:</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Hot climates where cooling is the primary concern</li>
              <li>Attic spaces under direct sun exposure</li>
              <li>Metal buildings and pole barns</li>
              <li>As a complement to traditional insulation (not a replacement)</li>
            </ul>
          </div>
          <div className="mb-3">
            <h4 className="font-bold">Installation Tips:</h4>
            <p>For maximum effectiveness:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Install with air gap (¾" minimum) on at least one side</li>
              <li>Shiny side should face open air space</li>
              <li>Ensure material remains dust-free (dust reduces effectiveness)</li>
              <li>Perforated types allow moisture vapor to pass through</li>
            </ul>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md mt-4">
            <h4 className="font-bold text-yellow-800">Cost-Benefit:</h4>
            <p>Radiant barriers typically cost $0.15-$0.50 per square foot - making them one of the most affordable insulation upgrades for hot climates. Can reduce cooling costs by 5-25% depending on climate and existing insulation.</p>
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
const InsulationInteractiveFeatures: React.FC<InsulationInteractiveFeaturesProps> = ({
  onStartAudit
}) => {
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({
    aerogel: 42,
    vips: 28,
    sips: 35,
    pcms: 19,
    radiant: 31
  });
  const [userVote, setUserVote] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<string>('');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Default summary content for the main CTA
  const [summaryContent, setSummaryContent] = useState({
    recommendation: "Complete Home Insulation Assessment",
    description: "Get a personalized insulation strategy for your home",
    details: "Our comprehensive energy audit will analyze your home's specific insulation needs, factoring in your climate zone, building structure, and energy usage patterns to recommend the most cost-effective insulation solutions."
  });
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
    <div className="insulation-interactive-content mt-6">
      {/* Table of Contents */}
      <TableOfContents
        items={tocItems}
        containerClassName="mb-8"
      />
      <div className="content space-y-12 mt-8">
        {/* Aerogel Section */}
        <section id="aerogel" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🧊 1. Aerogel Insulation – The Ninja of Thermal Defense</h2>
          <p className="italic text-gray-600 mb-4">"Mostly air. Totally powerful."</p>
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You live in a city apartment with thin walls and no room to expand? Aerogel's got your back—literally.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> Looks like frozen smoke, acts like a space suit.</li>
                <li><strong>Benefits:</strong> Ultra-low thermal conductivity, moisture resistant, crazy lightweight.</li>
                <li><strong>Best For:</strong> Tight retrofit spaces—think behind radiators, inside window frames.</li>
                <li><strong>Heads-up:</strong> Pricier upfront, but energy savings kick in fast.</li>
              </ul>
              <button
                onClick={() => setSelectedTechnique(selectedTechnique === 'aerogel' ? '' : 'aerogel')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {selectedTechnique === 'aerogel' ? 'Hide Savings Info ↑' : 'Show Me the Savings 💸'}
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              <img src={aerogelSvg} alt="Aerogel insulation structure" className="w-full" />
            </div>
          </div>
          {selectedTechnique === 'aerogel' &&
            <InsulationDetailContent
              selectedTechnique={selectedTechnique}
              onShowDetails={setSelectedTechnique}
            />
          }
        </section>
        {/* VIPs Section */}
        <section id="vips" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🚀 2. Vacuum Insulation Panels (VIPs) – The Sci-Fi Option</h2>
          <p className="italic text-gray-600 mb-4">"Insulation that sounds like it belongs on a spaceship."</p>
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You're designing a sleek modern build and need thin walls that still hold heat like a thermos.</p>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
            <li><strong>Why it's cool:</strong> A vacuum-sealed core = almost no heat gets through.</li>
            <li><strong>Benefits:</strong> Up to 10x better than traditional materials.</li>
            <li><strong>Best For:</strong> Refrigerators, high-end renovations, tight commercial spaces.</li>
            <li><strong>Watch Out:</strong> They're fragile—don't hammer them in place.</li>
          </ul>
          <button
            onClick={() => setSelectedTechnique(selectedTechnique === 'vips' ? '' : 'vips')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            {selectedTechnique === 'vips' ? 'Hide VIP Details ↑' : 'Let\'s Get Nerdy 🧠'}
          </button>
          <InsulationPoll
            onVote={handleVote}
            votes={pollVotes}
            userVote={userVote}
          />
          {selectedTechnique === 'vips' &&
            <InsulationDetailContent
              selectedTechnique={selectedTechnique}
              onShowDetails={setSelectedTechnique}
            />
          }
        </section>
        {/* SIPs Section */}
        <section id="sips" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🏗️ 3. Structural Insulated Panels (SIPs) – The LEGO Blocks of Efficiency</h2>
          <p className="italic text-gray-600 mb-4">"Snap together your dream home—and slash your energy bill doing it."</p>
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You're building a new home and want high performance with fewer drafts and less waste.</p>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
            <li><strong>Why it's cool:</strong> These foam-core sandwiches are load-bearing and airtight.</li>
            <li><strong>Benefits:</strong> Fast to build with, insanely strong, and thermally solid.</li>
            <li><strong>Best For:</strong> New construction walls, roofs, and floors.</li>
            <li><strong>Consider This:</strong> Works best when planned into a build from day one.</li>
          </ul>
          <button
            onClick={() => setSelectedTechnique(selectedTechnique === 'sips' ? '' : 'sips')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
          >
            {selectedTechnique === 'sips' ? 'Hide DIY Info ↑' : 'Can I DIY This? 🛠️'}
          </button>
          <div className="bg-blue-50 p-4 rounded-lg my-6">
            <h4 className="font-bold">⚡ Pro Tip</h4>
            <p>SIPs work best when paired with airtight sealing and radiant barriers—your home becomes a true fortress against heat loss.</p>
          </div>
          {selectedTechnique === 'sips' &&
            <InsulationDetailContent
              selectedTechnique={selectedTechnique}
              onShowDetails={setSelectedTechnique}
            />
          }
        </section>
        {/* PCMs Section */}
        <section id="pcms" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🌡️ 4. Phase Change Materials (PCMs) – Nature's Thermostat</h2>
          <p className="italic text-gray-600 mb-4">"These materials 'melt' and 'freeze' to manage heat for you."</p>
          <div className="bg-green-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You live somewhere with wild day-to-night temperature swings—hello desert dwellers!</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> Absorbs heat during the day, releases it when it cools.</li>
                <li><strong>Benefits:</strong> Passive regulation = fewer HVAC spikes.</li>
                <li><strong>Best For:</strong> Wallboards, tiles, and flooring that double as climate managers.</li>
                <li><strong>Keep in Mind:</strong> Needs big temp swings to really shine.</li>
              </ul>
              <button
                onClick={() => setSelectedTechnique(selectedTechnique === 'pcms' ? '' : 'pcms')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {selectedTechnique === 'pcms' ? 'Hide PCM Details ↑' : 'How Does That Even Work? 🤯'}
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              <img src={pcmSvg} alt="Phase change materials diagram" className="w-full" />
            </div>
          </div>
          {selectedTechnique === 'pcms' &&
            <InsulationDetailContent
              selectedTechnique={selectedTechnique}
              onShowDetails={setSelectedTechnique}
            />
          }
        </section>
        {/* Radiant Barrier Section */}
        <section id="radiant" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">☀️ 5. Reflective & Radiant Barrier Insulation – Your Roof's Sunglasses</h2>
          <p className="italic text-gray-600 mb-4">"Blocks heat like shades block sunlight."</p>
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <h4 className="font-bold">💡 Use Case</h4>
            <p>You live in a hot climate and your attic feels like the inside of a volcano.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/3">
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><strong>Why it's cool:</strong> Reflects radiant heat instead of absorbing it.</li>
                <li><strong>Benefits:</strong> Keeps attics cooler, lowers AC load.</li>
                <li><strong>Best For:</strong> Attics, under roofs, and sun-facing walls.</li>
                <li><strong>Heads-up:</strong> Not great for cold climates or tight spaces.</li>
              </ul>
              <button
                onClick={() => setSelectedTechnique(selectedTechnique === 'radiant' ? '' : 'radiant')}
                className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                {selectedTechnique === 'radiant' ? 'Hide Attic Protection ↑' : 'Protect My Attic 🌞'}
              </button>
            </div>
            <div className="md:w-1/3 bg-gray-100 p-3 rounded">
              <img src={radiantBarrierSvg} alt="Reflective and radiant barrier diagram" className="w-full" />
            </div>
          </div>
          {selectedTechnique === 'radiant' &&
            <InsulationDetailContent
              selectedTechnique={selectedTechnique}
              onShowDetails={setSelectedTechnique}
            />
          }
        </section>
        {/* Conclusion Section */}
        <section id="conclusion" className="scroll-mt-24 bg-green-50 p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-green-800 mb-3">The Silent Power of Smart Insulation</h2>
          <p className="mb-4">
            Most insulation isn't sexy—but it can be <strong>seriously profitable</strong>. Whether you're building new, retrofitting, or just curious, these techniques can turn your home into a thermal fortress. Higher upfront costs? Sure. But the <strong>ROI in comfort and cash</strong> makes them well worth it.
          </p>
          <blockquote className="border-l-4 border-green-600 pl-4 italic my-6">
            <p className="text-lg">Next Step: Want to find out which technique fits your home best? Take our 60-second audit quiz and get instant recommendations.</p>
          </blockquote>
          <button
            onClick={() => setShowSummaryModal(true)}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium text-lg"
          >
            Start My Energy Audit 🔍
          </button>
        </section>
      </div>
      {/* Results Summary Modal */}
      <ResultsSummaryModal
        open={showSummaryModal}
        onOpenChange={setShowSummaryModal}
        resultType="insulation-quiz"
        result={summaryContent}
        onStartAudit={onStartAudit}
      />
      
      {/* Legacy Energy Audit Quiz Modal */}
      <EnergyAuditQuizModal
        open={showQuizModal}
        onOpenChange={setShowQuizModal}
        onComplete={onStartAudit}
      />
      
      {/* Sticky CTA Footer */}
      <StickyCTAFooter
        onStartAudit={() => setShowSummaryModal(true)}
        delayBeforeShow={5000}
        scrollTriggerPoint={40}
      />
    </div>
  );
};
export default InsulationInteractiveFeatures;
