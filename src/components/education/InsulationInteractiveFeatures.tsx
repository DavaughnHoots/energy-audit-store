import React, { useEffect, useRef } from 'react';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

interface SavingsInfo {
  [key: string]: {
    title: string;
    content: string;
  };
}

const InsulationInteractiveFeatures: React.FC = () => {
  const trackComponentEvent = useComponentTracking('education', 'InsulationInteractiveFeatures');
  const hasInitialized = useRef(false);

  // Define the savings information for each section
  const savingsInfo: SavingsInfo = {
    aerogel: {
      title: 'Aerogel Savings Analysis',
      content: `
        <div class="p-4 bg-green-50 rounded-lg">
          <h4 class="font-bold text-lg mb-2">Cost vs. Benefit Breakdown:</h4>
          <ul class="list-disc pl-5 mb-3">
            <li><strong>Initial Cost:</strong> $20-35 per square foot</li>
            <li><strong>Annual Energy Savings:</strong> 20-30% reduction in heat loss for treated areas</li>
            <li><strong>ROI Timeline:</strong> 3-5 years for most applications</li>
            <li><strong>Space Saved:</strong> Up to 70% thinner than conventional insulation for same R-value</li>
          </ul>
          <p class="italic text-sm">Note: Most effective as a targeted solution for problem areas rather than whole-home application.</p>
        </div>
      `
    },
    vips: {
      title: 'Vacuum Insulation Panel Technical Details',
      content: `
        <div class="p-4 bg-blue-50 rounded-lg">
          <h4 class="font-bold text-lg mb-2">Technical Specifications:</h4>
          <ul class="list-disc pl-5 mb-3">
            <li><strong>R-value:</strong> R-25 to R-60 per inch (compared to R-3.8 for fiberglass)</li>
            <li><strong>Thermal Conductivity:</strong> 0.004 W/mK (10x better than conventional materials)</li>
            <li><strong>Core Materials:</strong> Fumed silica, aerogel, fiberglass, or polyurethane</li>
            <li><strong>Lifespan:</strong> 30-50 years if undamaged</li>
          </ul>
          <p class="font-semibold">Key Limitation:</p>
          <p>VIPs lose 50% of their insulating value if punctured, making them suitable only for installations where they won't be damaged.</p>
        </div>
      `
    },
    sips: {
      title: 'DIY SIPs Assessment',
      content: `
        <div class="p-4 bg-yellow-50 rounded-lg">
          <h4 class="font-bold text-lg mb-2">DIY Feasibility:</h4>
          <div class="grid grid-cols-2 gap-4 mb-3">
            <div>
              <h5 class="font-semibold">DIY Friendly Aspects:</h5>
              <ul class="list-disc pl-5">
                <li>Simple assembly process</li>
                <li>Reduces framing complexity</li>
                <li>All-in-one wall systems</li>
              </ul>
            </div>
            <div>
              <h5 class="font-semibold">Professional Assistance Needed:</h5>
              <ul class="list-disc pl-5">
                <li>Custom panel ordering</li>
                <li>Heavy equipment for placement</li>
                <li>Specialized sealing techniques</li>
              </ul>
            </div>
          </div>
          <p class="font-semibold">Verdict:</p>
          <p>Partial DIY with professional help recommended. Most suitable for owner-builders working alongside contractors.</p>
        </div>
      `
    },
    pcms: {
      title: 'How Phase Change Materials Work',
      content: `
        <div class="p-4 bg-purple-50 rounded-lg">
          <h4 class="font-bold text-lg mb-2">The Science Explained:</h4>
          <ol class="list-decimal pl-5 mb-3">
            <li class="mb-2"><strong>Absorption Phase:</strong> As daytime temperatures rise, PCMs absorb heat energy as they melt from solid to liquid (at specific temperature points)</li>
            <li class="mb-2"><strong>Storage Phase:</strong> The material holds this energy in its chemical bonds while remaining at a nearly constant temperature</li>
            <li class="mb-2"><strong>Release Phase:</strong> When ambient temperature drops below the PCM's freezing point at night, it solidifies and releases the stored heat</li>
          </ol>
          <p class="font-semibold">Common Applications:</p>
          <p>PCMs are incorporated into drywall, ceiling tiles, flooring, and even furniture to create "thermal mass" in lightweight construction.</p>
        </div>
      `
    },
    radiant: {
      title: 'Attic Radiant Barrier Benefits',
      content: `
        <div class="p-4 bg-orange-50 rounded-lg">
          <h4 class="font-bold text-lg mb-2">Installation & Benefits:</h4>
          <ul class="list-disc pl-5 mb-3">
            <li><strong>Installation Cost:</strong> $0.15-$0.30 per square foot (DIY); $0.50-$1.00 (professional)</li>
            <li><strong>Cooling Cost Reduction:</strong> 5-15% of cooling costs in hot climates</li>
            <li><strong>Attic Temperature Reduction:</strong> 20-30°F during peak summer heat</li>
            <li><strong>HVAC Benefits:</strong> Extended equipment life due to reduced load</li>
          </ul>
          <p class="font-semibold">Important Consideration:</p>
          <p>Effectiveness decreases if dust accumulates on the reflective surface. Most effective in hot, sunny climates.</p>
        </div>
      `
    }
  };

  // Initialize interactive features
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Handle poll submission
    const pollForm = document.querySelector('.insulation-poll');
    if (pollForm) {
      pollForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const selectedOption = formData.get('insulation-poll');
        
        // Display a thank you message
        const pollContainer = document.querySelector('.poll-container');
        if (pollContainer) {
          pollContainer.innerHTML = `
            <div class="text-center p-4">
              <h4 class="font-semibold mb-2">Thanks for your vote!</h4>
              <p class="mb-3">You selected: ${selectedOption} insulation</p>
              <p class="text-sm text-gray-600">This data helps us create more resources about your interests.</p>
            </div>
          `;
        }

        // Track the event
        trackComponentEvent('insulation_poll_submitted', { 
          selected_option: selectedOption as string 
        });
      });
    }

    // Handle savings buttons
    const savingsButtons = document.querySelectorAll('.savings-button');
    savingsButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const section = (button as HTMLElement).dataset.section;
        if (!section || !savingsInfo[section]) return;
        
        // Check if the info section already exists
        const parentElement = button.closest('div')?.parentElement;
        const existingInfo = parentElement?.querySelector('.savings-info');
        
        if (existingInfo) {
          // If it exists, remove it (toggle behavior)
          existingInfo.remove();
          (button as HTMLElement).querySelector('span')!.textContent = 
            getOriginalButtonText(section);
        } else if (parentElement) {
          // Create and insert the info section
          const infoDiv = document.createElement('div');
          infoDiv.className = 'savings-info mb-6 mt-2 border border-green-200 rounded-lg overflow-hidden';
          infoDiv.innerHTML = `
            <div class="bg-green-100 px-4 py-2 border-b border-green-200">
              <h4 class="font-semibold">${savingsInfo[section].title}</h4>
            </div>
            <div class="p-4">
              ${savingsInfo[section].content}
            </div>
          `;
          
          // Insert after the button's container
          button.closest('div')?.after(infoDiv);
          
          // Change button text
          (button as HTMLElement).querySelector('span')!.textContent = 'Hide Details';
        }
        
        // Track the event
        trackComponentEvent('view_savings_info', { section });
      });
    });

    // Ensure table of contents links work smoothly
    const tocLinks = document.querySelectorAll('#table-of-contents a');
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = (link as HTMLAnchorElement).getAttribute('href')?.substring(1);
        if (!targetId) return;
        
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          // Smooth scroll to the target element
          targetElement.scrollIntoView({ behavior: 'smooth' });
          
          // Track the event
          trackComponentEvent('toc_navigation', { section: targetId });
        }
      });
    });

    // Add progress indicator at the top of the page
    const container = document.querySelector('.max-w-4xl');
    if (container) {
      const progressBar = document.createElement('div');
      progressBar.className = 'fixed top-0 left-0 h-1 bg-green-500 z-50 transition-all duration-300';
      progressBar.style.width = '0%';
      document.body.prepend(progressBar);
      
      // Update progress bar as user scrolls
      window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrollPosition = window.scrollY;
        const progress = (scrollPosition / documentHeight) * 100;
        progressBar.style.width = `${progress}%`;
      });
    }

  }, [trackComponentEvent]);

  // Helper function to get original button text based on section
  const getOriginalButtonText = (section: string): string => {
    switch (section) {
      case 'aerogel': return 'Show Me the Savings 💸';
      case 'vips': return 'Let\'s Get Nerdy 🧠';
      case 'sips': return 'Can I DIY This? 🛠️';
      case 'pcms': return 'How Does That Even Work? 🤯';
      case 'radiant': return 'Protect My Attic 🌞';
      default: return 'Show Details';
    }
  };

  return null; // This component only adds event listeners, it doesn't render anything
};

export default InsulationInteractiveFeatures;