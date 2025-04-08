import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import TableOfContents from "../../components/education/TableOfContents";
import ReadingProgressBar from "../../components/education/ReadingProgressBar";
import InsulationTechniquePoll from "../../components/education/InsulationTechniquePoll";
import TechnicalDetailsAccordion from "../../components/education/TechnicalDetailsAccordion";
import Button from "../../components/common/Button";
import { useComponentTracking } from "../../hooks/analytics/useComponentTracking";

// Import SVG images directly with relative paths to ensure proper resolution
import aerogelDiagram from "../../assets/insulation-images/aerogel.svg";
import vipDiagram from "../../assets/insulation-images/vacuum-panels.svg";
import sipsDiagram from "../../assets/insulation-images/sips.svg";
import pcmDiagram from "../../assets/insulation-images/pcm.svg";
import radiantDiagram from "../../assets/insulation-images/radiant-barrier.svg";

const AdvancedInsulationPage: React.FC = () => {
  const trackComponentEvent = useComponentTracking(
    "education",
    "AdvancedInsulationPage",
  );

  // Table of contents items
  const tocItems = [
    { id: "aerogel", title: "Aerogel Insulation" },
    { id: "vips", title: "Vacuum Insulation Panels (VIPs)" },
    { id: "sips", title: "Structural Insulated Panels (SIPs)" },
    { id: "pcms", title: "Phase Change Materials (PCMs)" },
    { id: "radiant", title: "Reflective & Radiant Barrier Insulation" },
    { id: "conclusion", title: "Conclusion" },
  ];

  // Track page view
  useEffect(() => {
    trackComponentEvent("page_viewed", {
      page_name: "Advanced Insulation Techniques",
    });
  }, [trackComponentEvent]);

  const handleCTAClick = (ctaType: string, sectionId?: string) => {
    trackComponentEvent("cta_clicked", {
      cta_type: ctaType,
      section_id: sectionId || 'none',
      page_section: "insulation_page",
    });
  };

  return (
    <div className="relative">
      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Advanced Insulation Techniques
          </h1>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-100 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Are Your Walls Robbing You Blind? 🏠💸
            </h2>
            <p className="text-gray-700">
              If your heating or cooling bill feels like a second rent check,
              your insulation might be the culprit. Most homes leak energy like
              a sieve—but not because people don't care. It's because insulation
              is invisible… until you see the savings. In this guide, we're
              unmasking the five most advanced insulation techniques that can
              quietly save you thousands—and make your home more comfortable all
              year long.
            </p>
            <p className="text-gray-700 mt-4">
              Let's break it down in plain English (with a few juicy stats,
              too).
            </p>
          </div>
        </header>

        {/* Table of Contents */}
        <div className="mb-8">
          <TableOfContents items={tocItems} />
        </div>

        <div className="divide-y divide-gray-200">
          {/* Aerogel Section */}
          <section id="aerogel" className="py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🧊 1. Aerogel Insulation – The Ninja of Thermal Defense
            </h2>
            <p className="text-gray-600 italic mb-4">
              "Mostly air. Totally powerful."
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800">💡 Use Case</h3>
              <p>
                You live in a city apartment with thin walls and no room to
                expand? Aerogel's got your back—literally.
              </p>
            </div>

            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>
                <span className="font-medium">Why it's cool:</span> Looks like
                frozen smoke, acts like a space suit.
              </li>
              <li>
                <span className="font-medium">Benefits:</span> Ultra-low thermal
                conductivity, moisture resistant, crazy lightweight.
              </li>
              <li>
                <span className="font-medium">Best For:</span> Tight retrofit
                spaces—think behind radiators, inside window frames.
              </li>
              <li>
                <span className="font-medium">Heads-up:</span> Pricier upfront,
                but energy savings kick in fast.
              </li>
            </ul>

            <div className="flex justify-center mb-6">
              <Button
                onClick={() => handleCTAClick("aerogel_savings", "aerogel")}
                className="text-white bg-green-600 hover:bg-green-700"
              >
                👉 Show Me the Savings 💸
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <img
                src={aerogelDiagram}
                alt="Aerogel panel structure diagram"
                className="max-w-full h-auto mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                Aerogel panel structure (95% air)
              </p>
            </div>

            <TechnicalDetailsAccordion
              title="Technical Details for Aerogel"
              technique="aerogel"
            >
              <div className="space-y-4">
                <p>
                  Aerogel is one of the most remarkable insulation materials
                  ever created. It's composed of 95-99.8% air, with the
                  remaining portion being a silica solid. This structure gives
                  aerogel its extraordinary properties:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Thermal conductivity as low as 0.013 W/mK (compared to
                    fiberglass at 0.04 W/mK)
                  </li>
                  <li>Can withstand temperatures from -200°C to +200°C</li>
                  <li>Density of only 3-350 kg/m³</li>
                  <li>Sound absorption coefficient of 0.95-0.99</li>
                </ul>
                <p>
                  The material was first developed by NASA for space
                  applications but is now becoming increasingly available for
                  residential use in the form of blankets, panels, and even
                  insulative paint additives.
                </p>
              </div>
            </TechnicalDetailsAccordion>
          </section>

          {/* VIPs Section */}
          <section id="vips" className="py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🚀 2. Vacuum Insulation Panels (VIPs) – The Sci-Fi Option
            </h2>
            <p className="text-gray-600 italic mb-4">
              "Insulation that sounds like it belongs on a spaceship."
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800">💡 Use Case</h3>
              <p>
                You're designing a sleek modern build and need thin walls that
                still hold heat like a thermos.
              </p>
            </div>

            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>
                <span className="font-medium">Why it's cool:</span> A
                vacuum-sealed core = almost no heat gets through.
              </li>
              <li>
                <span className="font-medium">Benefits:</span> Up to 10x better
                than traditional materials.
              </li>
              <li>
                <span className="font-medium">Best For:</span> Refrigerators,
                high-end renovations, tight commercial spaces.
              </li>
              <li>
                <span className="font-medium">Watch Out:</span> They're
                fragile—don't hammer them in place.
              </li>
            </ul>

            <div className="flex justify-center mb-6">
              <Button
                onClick={() => handleCTAClick("vips_technical", "vips")}
                className="text-white bg-blue-600 hover:bg-blue-700"
              >
                👉 Let's Get Nerdy 🧠
              </Button>
            </div>

            {/* Poll Component */}
            <div className="mb-8">
              <InsulationTechniquePoll />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <img
                src={vipDiagram}
                alt="Vacuum Insulation Panel diagram"
                className="max-w-full h-auto mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                Vacuum Insulation Panel cross-section
              </p>
            </div>

            <TechnicalDetailsAccordion
              title="Technical Details for VIPs"
              technique="vips"
            >
              <div className="space-y-4">
                <p>
                  Vacuum Insulation Panels represent one of the
                  highest-performing thermal insulation solutions available
                  today:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Thermal conductivity of 0.004 W/mK (10x better than
                    conventional insulation)
                  </li>
                  <li>R-value of approximately R-25 to R-30 per inch</li>
                  <li>Service life of 30-50 years when properly installed</li>
                  <li>
                    Core materials typically include fumed silica, aerogel,
                    glass fiber, or polyurethane
                  </li>
                </ul>
                <p>
                  The main challenge with VIPs is their vulnerability to
                  puncture, which would compromise the vacuum. Once installed,
                  they cannot be cut or drilled, making planning crucial during
                  installation.
                </p>
              </div>
            </TechnicalDetailsAccordion>
          </section>

          {/* SIPs Section */}
          <section id="sips" className="py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🏗️ 3. Structural Insulated Panels (SIPs) – The LEGO Blocks of
              Efficiency
            </h2>
            <p className="text-gray-600 italic mb-4">
              "Snap together your dream home—and slash your energy bill doing
              it."
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800">💡 Use Case</h3>
              <p>
                You're building a new home and want high performance with fewer
                drafts and less waste.
              </p>
            </div>

            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>
                <span className="font-medium">Why it's cool:</span> These
                foam-core sandwiches are load-bearing and airtight.
              </li>
              <li>
                <span className="font-medium">Benefits:</span> Fast to build
                with, insanely strong, and thermally solid.
              </li>
              <li>
                <span className="font-medium">Best For:</span> New construction
                walls, roofs, and floors.
              </li>
              <li>
                <span className="font-medium">Consider This:</span> Works best
                when planned into a build from day one.
              </li>
            </ul>

            <div className="flex justify-center mb-6">
              <Button
                onClick={() => handleCTAClick("sips_diy", "sips")}
                className="text-white bg-yellow-600 hover:bg-yellow-700"
              >
                👉 Can I DIY This? 🛠️
              </Button>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <div className="text-2xl mr-2">⚡</div>
                <div>
                  <p className="font-semibold">Pro Tip</p>
                  <p>
                    SIPs work best when paired with airtight sealing and radiant
                    barriers—your home becomes a true fortress against heat
                    loss.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <img
                src={sipsDiagram}
                alt="Structural Insulated Panel diagram"
                className="max-w-full h-auto mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                SIP construction diagram
              </p>
            </div>

            <TechnicalDetailsAccordion
              title="Technical Details for SIPs"
              technique="sips"
            >
              <div className="space-y-4">
                <p>
                  Structural Insulated Panels consist of an insulating foam core
                  sandwiched between two structural facings:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    R-values typically range from R-14 to R-28 depending on
                    thickness (4"-12")
                  </li>
                  <li>
                    Air leakage rates 50-90% lower than stick-frame construction
                  </li>
                  <li>
                    Structural strength exceeds building code requirements by
                    2-3x
                  </li>
                  <li>
                    Construction time reduced by 50-60% compared to traditional
                    framing
                  </li>
                </ul>
                <p>
                  Panels come in standard sizes but can be customized for
                  specific architectural designs. The foam core is typically
                  expanded polystyrene (EPS), extruded polystyrene (XPS), or
                  polyurethane, while facings are usually oriented strand board
                  (OSB).
                </p>
              </div>
            </TechnicalDetailsAccordion>
          </section>

          {/* PCMs Section */}
          <section id="pcms" className="py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🌡️ 4. Phase Change Materials (PCMs) – Nature's Thermostat
            </h2>
            <p className="text-gray-600 italic mb-4">
              "These materials 'melt' and 'freeze' to manage heat for you."
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800">💡 Use Case</h3>
              <p>
                You live somewhere with wild day-to-night temperature
                swings—hello desert dwellers!
              </p>
            </div>

            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>
                <span className="font-medium">Why it's cool:</span> Absorbs heat
                during the day, releases it when it cools.
              </li>
              <li>
                <span className="font-medium">Benefits:</span> Passive
                regulation = fewer HVAC spikes.
              </li>
              <li>
                <span className="font-medium">Best For:</span> Wallboards,
                tiles, and flooring that double as climate managers.
              </li>
              <li>
                <span className="font-medium">Keep in Mind:</span> Needs big
                temp swings to really shine.
              </li>
            </ul>

            <div className="flex justify-center mb-6">
              <Button
                onClick={() => handleCTAClick("pcms_explanation", "pcms")}
                className="text-white bg-purple-600 hover:bg-purple-700"
              >
                👉 How Does That Even Work? 🤯
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <img
                src={pcmDiagram}
                alt="Phase Change Materials diagram"
                className="max-w-full h-auto mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                PCM thermal regulation cycle
              </p>
            </div>

            <TechnicalDetailsAccordion
              title="Technical Details for PCMs"
              technique="pcms"
            >
              <div className="space-y-4">
                <p>
                  Phase Change Materials utilize latent heat storage through
                  phase transitions:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    Latent heat capacity of 120-250 kJ/kg (5-14x higher than
                    sensible heat storage)
                  </li>
                  <li>
                    Phase change temperatures can be engineered between 18°C and
                    28°C for building applications
                  </li>
                  <li>
                    Common PCM materials: paraffins, fatty acids, salt hydrates,
                    and bio-based compounds
                  </li>
                  <li>
                    Energy storage density approximately 5-14 times higher than
                    conventional materials
                  </li>
                </ul>
                <p>
                  PCMs can be incorporated into building materials through
                  microencapsulation (tiny PCM capsules), macroencapsulation
                  (PCM pouches), or direct incorporation into materials like
                  gypsum board. They perform best in climates with significant
                  diurnal temperature variations.
                </p>
              </div>
            </TechnicalDetailsAccordion>
          </section>

          {/* Radiant Barrier Section */}
          <section id="radiant" className="py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ☀️ 5. Reflective & Radiant Barrier Insulation – Your Roof's
              Sunglasses
            </h2>
            <p className="text-gray-600 italic mb-4">
              "Blocks heat like shades block sunlight."
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-blue-800">💡 Use Case</h3>
              <p>
                You live in a hot climate and your attic feels like the inside
                of a volcano.
              </p>
            </div>

            <ul className="list-disc list-inside mb-6 space-y-2">
              <li>
                <span className="font-medium">Why it's cool:</span> Reflects
                radiant heat instead of absorbing it.
              </li>
              <li>
                <span className="font-medium">Benefits:</span> Keeps attics
                cooler, lowers AC load.
              </li>
              <li>
                <span className="font-medium">Best For:</span> Attics, under
                roofs, and sun-facing walls.
              </li>
              <li>
                <span className="font-medium">Heads-up:</span> Not great for
                cold climates or tight spaces.
              </li>
            </ul>

            <div className="flex justify-center mb-6">
              <Button
                onClick={() => handleCTAClick("radiant_barrier_protection", "radiant")}
                className="text-white bg-orange-600 hover:bg-orange-700"
              >
                👉 Protect My Attic 🌞
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 text-center">
              <img
                src={radiantDiagram}
                alt="Radiant Barrier diagram"
                className="max-w-full h-auto mx-auto"
              />
              <p className="text-sm text-gray-500 mt-2">
                Reflective roof barrier system
              </p>
            </div>

            <TechnicalDetailsAccordion
              title="Technical Details for Radiant Barriers"
              technique="radiant"
            >
              <div className="space-y-4">
                <p>
                  Radiant barriers operate on different principles than
                  conventional insulation:
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>Reflectivity of 95-97% for aluminum-based barriers</li>
                  <li>
                    Emissivity of 0.03-0.05 (compared to 0.9 for most building
                    materials)
                  </li>
                  <li>Can reduce cooling costs by 5-25% in hot climates</li>
                  <li>
                    Most effective when installed with reflective surface facing
                    an air gap
                  </li>
                </ul>
                <p>
                  Unlike traditional insulation that slows conductive heat
                  transfer, radiant barriers block radiant heat transfer, which
                  can account for up to 93% of heat flow through the roof in
                  summer conditions. Their effectiveness diminishes with dust
                  accumulation, so proper installation orientation is crucial.
                </p>
              </div>
            </TechnicalDetailsAccordion>
          </section>

          {/* Conclusion Section */}
          <section id="conclusion" className="py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Conclusion: The Silent Power of Smart Insulation
            </h2>
            <p className="mb-4">
              Most insulation isn't sexy—but it can be{" "}
              <span className="font-bold">seriously profitable</span>. Whether
              you're building new, retrofitting, or just curious, these
              techniques can turn your home into a thermal fortress. Higher
              upfront costs? Sure. But the{" "}
              <span className="font-bold">ROI in comfort and cash</span> makes
              them well worth it.
            </p>

            <blockquote className="border-l-4 border-green-500 pl-4 py-2 mb-6 italic">
              <p className="font-semibold">Next Step:</p>
              <p>
                Want to find out which technique fits your home best? Take our
                60-second audit quiz and get instant recommendations.
              </p>
            </blockquote>
            
            <div className="flex justify-center mb-8">
              <Button
                onClick={() => handleCTAClick("start_energy_audit", "conclusion")}
                className="text-white bg-green-600 hover:bg-green-700 text-lg px-6 py-3"
              >
                👉 Start My Energy Audit 🔍
              </Button>
            </div>

            <div className="text-center text-gray-500 text-sm">
              <p>#InsulationThatPays #EnergyAuditMadeEasy #GoodbyeDrafts</p>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky CTA Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 border-t border-gray-200 py-3 px-4 shadow-md z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm md:text-base font-medium text-gray-800">
            Ready to stop wasting energy?
          </div>
          <Link
            to="/energy-audit"
            onClick={() => handleCTAClick("sticky_footer_audit", "footer")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-sm transition-colors text-sm md:text-base"
          >
            Take the Free Energy Audit
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdvancedInsulationPage;
