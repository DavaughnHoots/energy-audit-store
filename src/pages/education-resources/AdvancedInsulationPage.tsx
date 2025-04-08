import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import TableOfContents from '@/components/education/TableOfContents';
import TechnicalDetailsAccordion from '@/components/education/TechnicalDetailsAccordion';
import InsulationTechniquePoll from '@/components/education/InsulationTechniquePoll';
import ReadingProgressBar from '@/components/education/ReadingProgressBar';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';
import aerogelDiagram from '@/assets/insulation-images/aerogel.svg';
import vipDiagram from '@/assets/insulation-images/vip.svg';
import sipsDiagram from '@/assets/insulation-images/sips.svg';
import pcmDiagram from '@/assets/insulation-images/pcm.svg';
import radiantDiagram from '@/assets/insulation-images/radiant-barrier.svg';

const AdvancedInsulationPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Track page view
  usePageTracking('education');
  const trackComponentEvent = useComponentTracking('education', 'AdvancedInsulationPage');
  
  // State for tracking clicked sections
  const [clickedSections, setClickedSections] = useState<Record<string, boolean>>({
    aerogel: false,
    vips: false,
    sips: false,
    pcms: false,
    radiant: false
  });
  
  // Handle section link clicks
  const handleSectionClick = (sectionId: string) => {
    trackComponentEvent('section_detail_click', { section: sectionId });
    
    // Update clicked sections
    setClickedSections(prev => ({
      ...prev,
      [sectionId]: true
    }));
  };
  
  // List of sections for Table of Contents
  const tocItems = [
    { id: 'aerogel', title: '1. Aerogel Insulation' },
    { id: 'vips', title: '2. Vacuum Insulation Panels (VIPs)' },
    { id: 'sips', title: '3. Structural Insulated Panels (SIPs)' },
    { id: 'pcms', title: '4. Phase Change Materials (PCMs)' },
    { id: 'radiant', title: '5. Reflective & Radiant Barrier' },
    { id: 'conclusion', title: 'Conclusion' }
  ];
  
  // Track scroll position for analytics
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.body.scrollHeight;
      
      // Track when user reaches the bottom of the page
      if (scrollPosition >= pageHeight - 300 && scrollPosition <= pageHeight) {
        trackComponentEvent('reached_page_bottom', { 
          page: 'advanced_insulation' 
        });
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle CTA button click
  const handleStartAuditClick = () => {
    trackComponentEvent('cta_click', { 
      cta: 'start_energy_audit',
      source: 'advanced_insulation_page'
    });
    navigate('/energy-audit');
  };
  
  return (
    <>
      {/* Reading Progress Bar */}
      <ReadingProgressBar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="flex items-center text-gray-600 hover:text-gray-900"
            onClick={() => navigate('/education')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Resources
          </Button>
        </div>
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 sm:p-8 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Advanced Insulation Techniques</h1>
          
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3">
              Are Your Walls Robbing You Blind? 🏠💸
            </h2>
            <p className="text-gray-700">
              If your heating or cooling bill feels like a second rent check, your insulation might be the culprit. 
              Most homes leak energy like a sieve—but not because people don't care. It's because insulation is 
              invisible… until you see the savings. In this guide, we're unmasking the five most advanced insulation 
              techniques that can quietly save you thousands—and make your home more comfortable all year long.
            </p>
            <p className="text-gray-700 mt-3">
              Let's break it down in plain English (with a few juicy stats, too).
            </p>
          </div>
          
          {/* Table of Contents */}
          <TableOfContents items={tocItems} />
        </div>
        
        <hr className="border-gray-200 mb-8" />
        
        {/* Section 1: Aerogel */}
        <section id="aerogel" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🧊 1. Aerogel Insulation – The Ninja of Thermal Defense
          </h2>
          <p className="text-gray-700 italic mb-4">"Mostly air. Totally powerful."</p>
          
          <div className="mb-4">
            <strong className="text-gray-800">💡 Use Case</strong>: You live in a city apartment with thin walls and no room to expand? Aerogel's got your back—literally.
          </div>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Why it's cool</strong>: Looks like frozen smoke, acts like a space suit.</li>
            <li><strong>Benefits</strong>: Ultra-low thermal conductivity, moisture resistant, crazy lightweight.</li>
            <li><strong>Best For</strong>: Tight retrofit spaces—think behind radiators, inside window frames.</li>
            <li><strong>Heads-up</strong>: Pricier upfront, but energy savings kick in fast.</li>
          </ul>
          
          <Button 
            onClick={() => handleSectionClick('aerogel')}
            className="bg-green-600 hover:bg-green-700 text-white mb-6"
          >
            Show Me the Savings 💸
          </Button>
          
          <div className="mb-6 flex justify-center">
            <img 
              src={aerogelDiagram} 
              alt="Aerogel Insulation Diagram" 
              className="max-w-full h-auto rounded-lg shadow-sm" 
            />
          </div>
          
          {clickedSections.aerogel && (
            <TechnicalDetailsAccordion title="Technical Details: Aerogel" technique="aerogel">
              <div className="space-y-4">
                <p>
                  Aerogel is one of the most remarkable insulation materials on the market, with 
                  a thermal conductivity as low as 0.013 W/mK - about 3-4 times better than conventional 
                  fiberglass insulation.
                </p>
                <p>
                  It's composed of 95-99% air trapped in a silica nanostructure, creating 
                  a material that feels almost weightless yet provides extraordinary insulation performance.
                </p>
                <h4 className="font-semibold">Cost Considerations:</h4>
                <ul className="list-disc pl-5">
                  <li>Higher upfront cost: $30-60 per square foot</li>
                  <li>Energy savings: Can reduce heat loss by up to 40% in targeted applications</li>
                  <li>Payback period: 3-5 years depending on climate and energy costs</li>
                </ul>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold">Pro Tip:</p>
                  <p>
                    Consider using aerogel for thermal bridges (like studs and joists) 
                    rather than whole-wall applications to maximize cost-effectiveness.
                  </p>
                </div>
              </div>
            </TechnicalDetailsAccordion>
          )}
        </section>
        
        {/* Section 2: VIPs */}
        <section id="vips" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 2. Vacuum Insulation Panels (VIPs) – The Sci-Fi Option
          </h2>
          <p className="text-gray-700 italic mb-4">"Insulation that sounds like it belongs on a spaceship."</p>
          
          <div className="mb-4">
            <strong className="text-gray-800">💡 Use Case</strong>: You're designing a sleek modern build and need thin walls that still hold heat like a thermos.
          </div>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Why it's cool</strong>: A vacuum-sealed core = almost no heat gets through.</li>
            <li><strong>Benefits</strong>: Up to 10x better than traditional materials.</li>
            <li><strong>Best For</strong>: Refrigerators, high-end renovations, tight commercial spaces.</li>
            <li><strong>Watch Out</strong>: They're fragile—don't hammer them in place.</li>
          </ul>
          
          <Button 
            onClick={() => handleSectionClick('vips')}
            className="bg-green-600 hover:bg-green-700 text-white mb-6"
          >
            Let's Get Nerdy 🧠
          </Button>
          
          {/* Interactive Poll */}
          <div className="mb-8">
            <InsulationTechniquePoll />
          </div>
          
          {clickedSections.vips && (
            <TechnicalDetailsAccordion title="Technical Details: Vacuum Insulation Panels" technique="vips">
              <div className="space-y-4">
                <p>
                  VIPs achieve remarkable R-values of R-25 to R-60 per inch, compared to 
                  R-3 to R-4 per inch for conventional insulation materials.
                </p>
                <p>
                  They consist of a core material (typically fumed silica, aerogel, or fiberglass) 
                  encased in a gas-tight envelope from which the air has been evacuated. This 
                  eliminates convective and conductive heat transfer.
                </p>
                <h4 className="font-semibold">Key Considerations:</h4>
                <ul className="list-disc pl-5">
                  <li>Cannot be cut or modified on-site without destroying the vacuum</li>
                  <li>Lifespan: 25-40 years before vacuum degradation begins</li>
                  <li>Puncture-resistant barriers are essential for long-term performance</li>
                </ul>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="font-semibold">Important Note:</p>
                  <p>
                    VIPs should be incorporated early in the design process since they require 
                    precise measurements and cannot be modified once manufactured.
                  </p>
                </div>
                <div className="mb-6 flex justify-center">
                  <img 
                    src={vipDiagram} 
                    alt="Vacuum Insulation Panels Diagram" 
                    className="max-w-full h-auto rounded-lg shadow-sm" 
                  />
                </div>
              </div>
            </TechnicalDetailsAccordion>
          )}
        </section>
        
        {/* Section 3: SIPs */}
        <section id="sips" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🏗️ 3. Structural Insulated Panels (SIPs) – The LEGO Blocks of Efficiency
          </h2>
          <p className="text-gray-700 italic mb-4">"Snap together your dream home—and slash your energy bill doing it."</p>
          
          <div className="mb-4">
            <strong className="text-gray-800">💡 Use Case</strong>: You're building a new home and want high performance with fewer drafts and less waste.
          </div>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Why it's cool</strong>: These foam-core sandwiches are load-bearing and airtight.</li>
            <li><strong>Benefits</strong>: Fast to build with, insanely strong, and thermally solid.</li>
            <li><strong>Best For</strong>: New construction walls, roofs, and floors.</li>
            <li><strong>Consider This</strong>: Works best when planned into a build from day one.</li>
          </ul>
          
          <Button 
            onClick={() => handleSectionClick('sips')}
            className="bg-green-600 hover:bg-green-700 text-white mb-6"
          >
            Can I DIY This? 🛠️
          </Button>
          <div className="mb-6 flex justify-center">
            <img 
              src={sipsDiagram} 
              alt="Structural Insulated Panels Diagram" 
              className="max-w-full h-auto rounded-lg shadow-sm" 
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
            <p className="font-semibold">⚡ Pro Tip</p>
            <p>
              SIPs work best when paired with airtight sealing and radiant barriers—
              your home becomes a true fortress against heat loss.
            </p>
          </div>
          
          {clickedSections.sips && (
            <TechnicalDetailsAccordion title="Technical Details: Structural Insulated Panels" technique="sips">
              <div className="space-y-4">
                <p>
                  SIPs typically consist of an insulating foam core sandwiched between two structural 
                  facings, usually oriented strand board (OSB). This creates a strong, energy-efficient 
                  building panel that can reduce framing lumber by up to 25%.
                </p>
                <h4 className="font-semibold">Performance Metrics:</h4>
                <ul className="list-disc pl-5">
                  <li>R-values typically range from R-14 to R-24 for standard 4-6" panels</li>
                  <li>Air infiltration reduction of up to 90% compared to stick-frame construction</li>
                  <li>Construction time reduction of 40-60% for the building envelope</li>
                </ul>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold">DIY Considerations:</p>
                  <p>
                    While professionals typically install SIPs, experienced DIYers can work with 
                    smaller panels (under 8' x 4'). However, specialized equipment is needed for 
                    larger panels, and proper sealing between panels is critical for performance.
                  </p>
                </div>
              </div>
            </TechnicalDetailsAccordion>
          )}
        </section>
        
        {/* Section 4: PCMs */}
        <section id="pcms" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🌡️ 4. Phase Change Materials (PCMs) – Nature's Thermostat
          </h2>
          <p className="text-gray-700 italic mb-4">"These materials 'melt' and 'freeze' to manage heat for you."</p>
          
          <div className="mb-4">
            <strong className="text-gray-800">💡 Use Case</strong>: You live somewhere with wild day-to-night temperature swings—hello desert dwellers!
          </div>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Why it's cool</strong>: Absorbs heat during the day, releases it when it cools.</li>
            <li><strong>Benefits</strong>: Passive regulation = fewer HVAC spikes.</li>
            <li><strong>Best For</strong>: Wallboards, tiles, and flooring that double as climate managers.</li>
            <li><strong>Keep in Mind</strong>: Needs big temp swings to really shine.</li>
          </ul>
          
          <Button 
            onClick={() => handleSectionClick('pcms')}
            className="bg-green-600 hover:bg-green-700 text-white mb-6"
          >
            How Does That Even Work? 🤯
          </Button>
          
          <div className="mb-6 flex justify-center">
            <img 
              src={pcmDiagram} 
              alt="Phase Change Materials Diagram" 
              className="max-w-full h-auto rounded-lg shadow-sm" 
            />
          </div>
          
          {clickedSections.pcms && (
            <TechnicalDetailsAccordion title="Technical Details: Phase Change Materials" technique="pcms">
              <div className="space-y-4">
                <p>
                  PCMs store and release large amounts of energy during the phase transition 
                  process (changing between solid and liquid states). This ability to absorb 
                  and release heat at a nearly constant temperature makes them ideal for 
                  temperature stabilization.
                </p>
                <h4 className="font-semibold">Types of PCMs:</h4>
                <ul className="list-disc pl-5">
                  <li><strong>Organic</strong>: Paraffin waxes, fatty acids (stable, non-corrosive)</li>
                  <li><strong>Inorganic</strong>: Salt hydrates (higher energy density, less expensive)</li>
                  <li><strong>Eutectic</strong>: Blends that offer customized melting points</li>
                </ul>
                <h4 className="font-semibold mt-3">Energy Storage Capacity:</h4>
                <p>
                  PCMs can store 5-14 times more heat per unit volume than conventional 
                  materials like concrete or drywall.
                </p>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold">Application Tip:</p>
                  <p>
                    PCMs work best in climates with temperature swings that cross the 
                    material's phase change temperature daily. Choose PCMs with transition 
                    temperatures 2-3°C above or below your desired room temperature.
                  </p>
                </div>
              </div>
            </TechnicalDetailsAccordion>
          )}
        </section>
        
        {/* Section 5: Radiant Barrier */}
        <section id="radiant" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ☀️ 5. Reflective & Radiant Barrier Insulation – Your Roof's Sunglasses
          </h2>
          <p className="text-gray-700 italic mb-4">"Blocks heat like shades block sunlight."</p>
          
          <div className="mb-4">
            <strong className="text-gray-800">💡 Use Case</strong>: You live in a hot climate and your attic feels like the inside of a volcano.
          </div>
          
          <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
            <li><strong>Why it's cool</strong>: Reflects radiant heat instead of absorbing it.</li>
            <li><strong>Benefits</strong>: Keeps attics cooler, lowers AC load.</li>
            <li><strong>Best For</strong>: Attics, under roofs, and sun-facing walls.</li>
            <li><strong>Heads-up</strong>: Not great for cold climates or tight spaces.</li>
          </ul>
          
          <Button 
            onClick={() => handleSectionClick('radiant')}
            className="bg-green-600 hover:bg-green-700 text-white mb-6"
          >
            Protect My Attic 🌞
          </Button>
          
          <div className="mb-6 flex justify-center">
            <img 
              src={radiantDiagram} 
              alt="Radiant Barrier Diagram" 
              className="max-w-full h-auto rounded-lg shadow-sm" 
            />
          </div>
          
          {clickedSections.radiant && (
            <TechnicalDetailsAccordion title="Technical Details: Radiant Barriers" technique="radiant">
              <div className="space-y-4">
                <p>
                  Radiant barriers are highly reflective materials, typically aluminum foil 
                  laminated to backing materials, that reflect rather than absorb radiant heat. 
                  They work differently than traditional insulation by reflecting heat rather 
                  than slowing its transfer.
                </p>
                <h4 className="font-semibold">Performance Metrics:</h4>
                <ul className="list-disc pl-5">
                  <li>Can reflect up to 97% of radiant heat</li>
                  <li>Attic temperature reduction of 20-30°F in hot weather</li>
                  <li>Cooling cost reduction of 5-15% in hot climates</li>
                </ul>
                <h4 className="font-semibold mt-3">Installation Requirements:</h4>
                <ul className="list-disc pl-5">
                  <li>Requires proper air gap (at least ¾") to be effective</li>
                  <li>Must be installed with shiny side facing the heat source</li>
                  <li>Keep surfaces clean and dust-free for maximum reflectivity</li>
                </ul>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="font-semibold">Climate Consideration:</p>
                  <p>
                    In cold climates, radiant barriers should only be used on downward-facing 
                    surfaces to prevent condensation issues. They provide limited benefit in 
                    regions where cooling is not the primary energy concern.
                  </p>
                </div>
              </div>
            </TechnicalDetailsAccordion>
          )}
        </section>
        
        {/* Conclusion */}
        <section id="conclusion" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Conclusion: The Silent Power of Smart Insulation
          </h2>
          
          <p className="text-gray-700 mb-4">
            Most insulation isn't sexy—but it can be <strong>seriously profitable</strong>. 
            Whether you're building new, retrofitting, or just curious, these techniques can 
            turn your home into a thermal fortress. Higher upfront costs? Sure. But the 
            <strong> ROI in comfort and cash</strong> makes them well worth it.
          </p>
          
          <blockquote className="border-l-4 border-green-500 pl-4 italic text-gray-700 mb-6">
            <strong>Next Step</strong>: Want to find out which technique fits your home best? 
            Take our 60-second audit quiz and get instant recommendations.
          </blockquote>
          
          <Button 
            onClick={handleStartAuditClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            Start My Energy Audit 🔍
          </Button>
        </section>
        
        {/* Footer Tags */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-500 mb-10">
          <span>#InsulationThatPays</span>
          <span>#EnergyAuditMadeEasy</span>
          <span>#GoodbyeDrafts</span>
        </div>
        
        {/* Sticky CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 border-t border-gray-200">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-700 hidden sm:block">
              Ready to find the right insulation solution for your home?
            </p>
            <Button 
              onClick={handleStartAuditClick}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="sm:hidden">Start Energy Audit</span>
              <span className="hidden sm:inline">Start My Free Energy Audit</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvancedInsulationPage;