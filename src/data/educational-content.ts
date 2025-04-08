// src/data/educational-content.ts
import { ResourceType } from '../types/education';

export interface ResourceContent {
  id: string;
  preview: string;
  content: string | React.ReactNode;
  videoUrl?: string;
  infographicUrl?: string;
  quizQuestions?: QuizQuestion[];
  calculatorConfig?: any;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export const resourceContents: Record<string, ResourceContent> = {
  '1': {
    id: '1',
    preview: `Home energy efficiency is about making strategic improvements to reduce energy consumption while maintaining comfort. This guide covers the fundamentals everyone should know.`,
    content: `
      <h2>Understanding Home Energy Efficiency</h2>
      
      <p>Energy efficiency in your home means using less energy to get the same job done - and in the process, cutting energy bills and reducing your environmental footprint.</p>
      
      <h3>Why Energy Efficiency Matters</h3>
      
      <p>The average American household spends more than $2,000 a year on energy bills, with nearly half going to heating and cooling. Improving your home's energy efficiency can:</p>
      
      <ul>
        <li>Save you 20-30% on energy bills</li>
        <li>Increase your home's comfort</li>
        <li>Reduce your carbon footprint</li>
        <li>Potentially increase your property value</li>
      </ul>
      
      <h3>Where Your Home Loses Energy</h3>
      
      <p>Understanding where and how your home wastes energy is the first step toward creating a more efficient living space:</p>
      
      <ol>
        <li><strong>Air Leaks (30-40% of energy loss)</strong>: Gaps around doors, windows, and other openings</li>
        <li><strong>Poor Insulation (20-30%)</strong>: Insufficient insulation in walls, attics, and floors</li>
        <li><strong>Inefficient HVAC Systems (10-20%)</strong>: Outdated heating and cooling equipment</li>
        <li><strong>Windows and Doors (10-15%)</strong>: Single-pane windows and poorly sealed doors</li>
        <li><strong>Outdated Appliances (10-15%)</strong>: Older models use significantly more energy</li>
      </ol>
      
      <h3>The Home Energy Efficiency Pyramid</h3>
      
      <p>When improving your home's efficiency, follow this pyramid from bottom to top for the best results:</p>
      
      <ol>
        <li><strong>Air Sealing</strong>: Seal leaks and drafts (lowest cost, highest return)</li>
        <li><strong>Insulation</strong>: Ensure proper insulation levels</li>
        <li><strong>HVAC Optimization</strong>: Maintain and upgrade heating/cooling systems</li>
        <li><strong>Windows & Doors</strong>: Upgrade to energy-efficient models</li>
        <li><strong>Appliance Upgrades</strong>: Replace with ENERGY STAR certified models</li>
        <li><strong>Renewable Energy</strong>: Consider solar panels or other renewables (highest cost)</li>
      </ol>
      
      <h3>Quick Energy-Saving Tips</h3>
      
      <p>Start with these simple actions that cost little to nothing:</p>
      
      <ul>
        <li>Lower your thermostat by 7-10°F for 8 hours a day (save up to 10%)</li>
        <li>Seal obvious air leaks with weatherstripping and caulk</li>
        <li>Replace air filters regularly (every 1-3 months)</li>
        <li>Use smart power strips to eliminate phantom energy use</li>
        <li>Switch to LED lightbulbs (use 75% less energy than incandescent)</li>
        <li>Use ceiling fans to circulate air (run counterclockwise in summer, clockwise in winter)</li>
      </ul>
      
      <h3>Understanding Your Energy Bills</h3>
      
      <p>Your utility bills contain valuable information that can help you track your energy use:</p>
      
      <ul>
        <li><strong>Kilowatt-hours (kWh)</strong>: The standard unit for measuring electricity consumption</li>
        <li><strong>Therms or CCF</strong>: Common units for natural gas usage</li>
        <li><strong>Seasonal patterns</strong>: Compare month-to-month and year-to-year to identify trends</li>
      </ul>
      
      <p>Most utilities offer online tools to track your usage patterns, which can help identify opportunities for savings.</p>
      
      <h3>Next Steps in Your Energy Efficiency Journey</h3>
      
      <p>Ready to take your energy efficiency efforts further? Consider these next steps:</p>
      
      <ol>
        <li>Conduct a DIY home energy audit (see our guide)</li>
        <li>Explore available rebates and incentives for energy upgrades</li>
        <li>Consider professional energy assessment services</li>
        <li>Create a prioritized plan for improvements based on your budget</li>
      </ol>
      
      <p>Remember, energy efficiency is a journey, not a destination. Even small improvements add up to significant savings over time.</p>
    `
  },
  '2': {
    id: '2',
    preview: `Beyond the basics, this guide explores cutting-edge insulation techniques that can dramatically reduce energy loss and improve comfort in your home.`,
    content: `
      <div id="table-of-contents" class="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 class="font-semibold mb-2">Quick Navigation:</h4>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <li><a href="#aerogel" class="text-green-600 hover:text-green-800">🧊 Aerogel Insulation</a></li>
          <li><a href="#vips" class="text-green-600 hover:text-green-800">🚀 Vacuum Insulation Panels</a></li>
          <li><a href="#sips" class="text-green-600 hover:text-green-800">🏗️ Structural Insulated Panels</a></li>
          <li><a href="#pcms" class="text-green-600 hover:text-green-800">🌡️ Phase Change Materials</a></li>
          <li><a href="#radiant" class="text-green-600 hover:text-green-800">☀️ Reflective & Radiant Barriers</a></li>
          <li><a href="#conclusion" class="text-green-600 hover:text-green-800">💰 Conclusion & Next Steps</a></li>
        </ul>
      </div>

      <h2>Advanced Insulation Techniques</h2>
      
      <h3 class="font-bold text-2xl mb-4">Are Your Walls Robbing You Blind? 🏠💸</h3>
      <p class="mb-6">If your heating or cooling bill feels like a second rent check, your insulation might be the culprit. Most homes leak energy like a sieve—but not because people don't care. It's because insulation is invisible… until you see the savings. In this guide, we're unmasking the five most advanced insulation techniques that can quietly save you thousands—and make your home more comfortable all year long.</p>
      
      <p class="mb-8">Let's break it down in plain English (with a few juicy stats, too).</p>
      
      <hr class="my-8" />
      
      <div id="aerogel" class="mb-12">
        <h3 class="text-2xl font-bold mb-3">🧊 1. Aerogel Insulation – The Ninja of Thermal Defense</h3>
        <p class="italic mb-4">"Mostly air. Totally powerful."</p>
        
        <h4 class="font-bold mb-2">💡 Use Case</h4>
        <p class="mb-4">You live in a city apartment with thin walls and no room to expand? Aerogel's got your back—literally.</p>
        
        <ul class="list-disc pl-6 mb-6">
          <li><strong>Why it's cool</strong>: Looks like frozen smoke, acts like a space suit.</li>
          <li><strong>Benefits</strong>: Ultra-low thermal conductivity, moisture resistant, crazy lightweight.</li>
          <li><strong>Best For</strong>: Tight retrofit spaces—think behind radiators, inside window frames.</li>
          <li><strong>Heads-up</strong>: Pricier upfront, but energy savings kick in fast.</li>
        </ul>
        
        <div class="mb-6">
          <button class="savings-button bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full inline-flex items-center" data-section="aerogel">
            <span>Show Me the Savings 💸</span>
          </button>
        </div>
        
        <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm mb-6">
          <pre>        ┌─────────────────────────────┐
        │  AEROGEL PANEL (95% AIR)   │
        │ ┌───────┐     ┌───────┐    │
        │ │  Air  │ ... │  Air  │    │
        │ └───────┘     └───────┘    │
        │ Microscopic structure traps│
        │ heat despite being lightweight │
        └─────────────────────────────┘</pre>
        </div>
      </div>
      
      <hr class="my-8" />
      
      <div id="vips" class="mb-12">
        <h3 class="text-2xl font-bold mb-3">🚀 2. Vacuum Insulation Panels (VIPs) – The Sci-Fi Option</h3>
        <p class="italic mb-4">"Insulation that sounds like it belongs on a spaceship."</p>
        
        <h4 class="font-bold mb-2">💡 Use Case</h4>
        <p class="mb-4">You're designing a sleek modern build and need thin walls that still hold heat like a thermos.</p>
        
        <ul class="list-disc pl-6 mb-6">
          <li><strong>Why it's cool</strong>: A vacuum-sealed core = almost no heat gets through.</li>
          <li><strong>Benefits</strong>: Up to 10x better than traditional materials.</li>
          <li><strong>Best For</strong>: Refrigerators, high-end renovations, tight commercial spaces.</li>
          <li><strong>Watch Out</strong>: They're fragile—don't hammer them in place.</li>
        </ul>
        
        <div class="mb-6">
          <button class="savings-button bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full inline-flex items-center" data-section="vips">
            <span>Let's Get Nerdy 🧠</span>
          </button>
        </div>
        
        <div class="poll-container bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h4 class="font-semibold mb-3">Quick Poll: Which insulation technique do you find most interesting?</h4>
          <form class="insulation-poll">
            <div class="flex items-center mb-2">
              <input type="radio" id="poll-aerogel" name="insulation-poll" value="aerogel" class="mr-2">
              <label for="poll-aerogel" class="cursor-pointer">Aerogel 🧊</label>
            </div>
            <div class="flex items-center mb-2">
              <input type="radio" id="poll-vips" name="insulation-poll" value="vips" class="mr-2">
              <label for="poll-vips" class="cursor-pointer">Vacuum Panels 🚀</label>
            </div>
            <div class="flex items-center mb-2">
              <input type="radio" id="poll-sips" name="insulation-poll" value="sips" class="mr-2">
              <label for="poll-sips" class="cursor-pointer">SIPs 🏗️</label>
            </div>
            <div class="flex items-center mb-2">
              <input type="radio" id="poll-pcms" name="insulation-poll" value="pcms" class="mr-2">
              <label for="poll-pcms" class="cursor-pointer">PCMs 🌡️</label>
            </div>
            <div class="flex items-center mb-4">
              <input type="radio" id="poll-radiant" name="insulation-poll" value="radiant" class="mr-2">
              <label for="poll-radiant" class="cursor-pointer">Radiant Barrier ☀️</label>
            </div>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm">Submit</button>
          </form>
        </div>
      </div>
      
      <hr class="my-8" />
      
      <div id="sips" class="mb-12">
        <h3 class="text-2xl font-bold mb-3">🏗️ 3. Structural Insulated Panels (SIPs) – The LEGO Blocks of Efficiency</h3>
        <p class="italic mb-4">"Snap together your dream home—and slash your energy bill doing it."</p>
        
        <h4 class="font-bold mb-2">💡 Use Case</h4>
        <p class="mb-4">You're building a new home and want high performance with fewer drafts and less waste.</p>
        
        <ul class="list-disc pl-6 mb-6">
          <li><strong>Why it's cool</strong>: These foam-core sandwiches are load-bearing and airtight.</li>
          <li><strong>Benefits</strong>: Fast to build with, insanely strong, and thermally solid.</li>
          <li><strong>Best For</strong>: New construction walls, roofs, and floors.</li>
          <li><strong>Consider This</strong>: Works best when planned into a build from day one.</li>
        </ul>
        
        <div class="mb-6">
          <button class="savings-button bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full inline-flex items-center" data-section="sips">
            <span>Can I DIY This? 🛠️</span>
          </button>
        </div>
        
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p class="font-semibold">⚡ Pro Tip</p>
          <p>SIPs work best when paired with airtight sealing and radiant barriers—your home becomes a true fortress against heat loss.</p>
        </div>
      </div>
      
      <hr class="my-8" />
      
      <div id="pcms" class="mb-12">
        <h3 class="text-2xl font-bold mb-3">🌡️ 4. Phase Change Materials (PCMs) – Nature's Thermostat</h3>
        <p class="italic mb-4">"These materials 'melt' and 'freeze' to manage heat for you."</p>
        
        <h4 class="font-bold mb-2">💡 Use Case</h4>
        <p class="mb-4">You live somewhere with wild day-to-night temperature swings—hello desert dwellers!</p>
        
        <ul class="list-disc pl-6 mb-6">
          <li><strong>Why it's cool</strong>: Absorbs heat during the day, releases it when it cools.</li>
          <li><strong>Benefits</strong>: Passive regulation = fewer HVAC spikes.</li>
          <li><strong>Best For</strong>: Wallboards, tiles, and flooring that double as climate managers.</li>
          <li><strong>Keep in Mind</strong>: Needs big temp swings to really shine.</li>
        </ul>
        
        <div class="mb-6">
          <button class="savings-button bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full inline-flex items-center" data-section="pcms">
            <span>How Does That Even Work? 🤯</span>
          </button>
        </div>
        
        <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm mb-6">
          <pre>   ┌────────────────────────────┐
   │  PHASE CHANGE MATERIALS    │
   │  Daytime: absorbs heat ☀️   │
   │   ┌───────┐                │
   │   │ Liquid│ ← melts       │
   │   └───────┘                │
   │  Night: releases heat 🌙   │
   │   ┌───────┐                │
   │   │ Solid │ ← solidifies  │
   │   └───────┘                │
   └────────────────────────────┘</pre>
        </div>
      </div>
      
      <hr class="my-8" />
      
      <div id="radiant" class="mb-12">
        <h3 class="text-2xl font-bold mb-3">☀️ 5. Reflective & Radiant Barrier Insulation – Your Roof's Sunglasses</h3>
        <p class="italic mb-4">"Blocks heat like shades block sunlight."</p>
        
        <h4 class="font-bold mb-2">💡 Use Case</h4>
        <p class="mb-4">You live in a hot climate and your attic feels like the inside of a volcano.</p>
        
        <ul class="list-disc pl-6 mb-6">
          <li><strong>Why it's cool</strong>: Reflects radiant heat instead of absorbing it.</li>
          <li><strong>Benefits</strong>: Keeps attics cooler, lowers AC load.</li>
          <li><strong>Best For</strong>: Attics, under roofs, and sun-facing walls.</li>
          <li><strong>Heads-up</strong>: Not great for cold climates or tight spaces.</li>
        </ul>
        
        <div class="mb-6">
          <button class="savings-button bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-full inline-flex items-center" data-section="radiant">
            <span>Protect My Attic 🌞</span>
          </button>
        </div>
        
        <div class="bg-gray-100 p-4 rounded-lg font-mono text-sm mb-6">
          <pre>   ┌───────────────────────────────────┐
   │     REFLECTIVE ROOF BARRIER       │
   │     Sunlight ☀️ hits the roof     │
   │         ↓↓↓↓↓↓↓↓↓↓↓↓↓             │
   │    ┌─────────────────────┐        │
   │    │   Reflective Foil   │← Reflects radiant heat
   │    └─────────────────────┘        │
   │         ↓                        │
   │   Less heat enters attic space   │
   └───────────────────────────────────┘</pre>
        </div>
      </div>
      
      <hr class="my-8" />
      
      <div id="conclusion" class="mb-12">
        <h3 class="text-2xl font-bold mb-4">Conclusion: The Silent Power of Smart Insulation</h3>
        <p class="mb-4">Most insulation isn't sexy—but it can be <strong>seriously profitable</strong>. Whether you're building new, retrofitting, or just curious, these techniques can turn your home into a thermal fortress. Higher upfront costs? Sure. But the <strong>ROI in comfort and cash</strong> makes them well worth it.</p>
        
        <blockquote class="border-l-4 border-green-500 pl-4 italic my-6">
          <p><strong>Next Step</strong>: Want to find out which technique fits your home best? Take our 60-second audit quiz and get instant recommendations.</p>
        </blockquote>
        
        <div class="mb-8">
          <a href="/energy-audit" class="audit-button bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg inline-flex items-center text-lg">
            <span>Start My Energy Audit 🔍</span>
          </a>
        </div>
        
        <div class="text-sm text-gray-600">
          <p>#InsulationThatPays #EnergyAuditMadeEasy #GoodbyeDrafts</p>
        </div>
      </div>
    `
  },
  '3': {
    id: '3',
    preview: `Smart home technologies offer unprecedented control over your home's energy use. Learn how to implement and optimize these systems for maximum savings and convenience.`,
    content: `
      <h2>Smart Home Energy Management</h2>
      
      <p>Smart home technology has revolutionized how we monitor, control, and optimize energy use in our homes. This guide explores how to leverage these innovations to create an intelligent energy management system that reduces waste while enhancing comfort and convenience.</p>
      
      <h3>The Smart Home Energy Ecosystem</h3>
      
      <p>A comprehensive smart home energy system typically includes:</p>
      
      <ul>
        <li><strong>Smart Thermostats</strong>: Learning your preferences and optimizing HVAC operation</li>
        <li><strong>Smart Lighting</strong>: LED bulbs and fixtures controlled via apps or voice</li>
        <li><strong>Smart Plugs and Switches</strong>: For controlling individual appliances and devices</li>
        <li><strong>Energy Monitoring Systems</strong>: Tracking usage at the circuit or device level</li>
        <li><strong>Home Energy Management Systems (HEMS)</strong>: Central platforms that coordinate multiple systems</li>
        <li><strong>Smart Appliances</strong>: Energy-efficient devices with built-in connectivity</li>
      </ul>
      
      <h3>Smart Thermostats: The Foundation</h3>
      
      <p>Smart thermostats are typically the entry point for smart home energy management:</p>
      
      <h4>Key Features to Look For:</h4>
      <ul>
        <li><strong>Learning Algorithms</strong>: Adapting to your schedule and preferences</li>
        <li><strong>Occupancy Detection</strong>: Adjusting settings when no one is home</li>
        <li><strong>Remote Control</strong>: Adjusting temperature from anywhere</li>
        <li><strong>Energy Usage Reports</strong>: Providing insights into consumption patterns</li>
        <li><strong>Multi-Zone Compatibility</strong>: Managing different areas independently</li>
        <li><strong>Integration Capabilities</strong>: Working with other smart home systems</li>
      </ul>
      
      <p>Popular options include Nest Learning Thermostat, ecobee SmartThermostat, and Honeywell Home T9, each with different strengths.</p>
      
      <h4>Optimization Strategies:</h4>
      <ul>
        <li>Allow learning features to operate for at least 1-2 weeks</li>
        <li>Set energy-saving temperature thresholds (68°F heating, 78°F cooling)</li>
        <li>Utilize "Away" modes when traveling</li>
        <li>Take advantage of utility demand response programs</li>
      </ul>
      
      <h3>Comprehensive Energy Monitoring</h3>
      
      <p>You can't manage what you don't measure. Smart energy monitoring gives visibility into your consumption:</p>
      
      <h4>Types of Monitoring Systems:</h4>
      <ul>
        <li><strong>Whole-Home Monitors</strong>: Devices like Sense or Emporia Vue that install in your electrical panel</li>
        <li><strong>Circuit-Level Monitoring</strong>: Systems that track individual circuits</li>
        <li><strong>Smart Plugs with Energy Tracking</strong>: For monitoring individual devices</li>
        <li><strong>Utility Smart Meters</strong>: Many now provide granular usage data</li>
      </ul>
      
      <h4>What to Look For in the Data:</h4>
      <ul>
        <li>Baseline energy use (especially overnight when most devices should be off)</li>
        <li>Peak usage periods and correlating them with activities</li>
        <li>Energy vampires that consume power even when "off"</li>
        <li>Seasonal patterns that might indicate HVAC efficiency issues</li>
        <li>Unusual spikes that could indicate malfunctioning equipment</li>
      </ul>
      
      <h3>Smart Lighting for Efficiency</h3>
      
      <p>Lighting accounts for about 10% of home electricity use. Smart lighting systems offer:</p>
      
      <h4>Key Components:</h4>
      <ul>
        <li><strong>Smart Bulbs</strong>: Individual LED bulbs with wireless connectivity</li>
        <li><strong>Smart Switches</strong>: Replacing traditional wall switches for controlling fixtures</li>
        <li><strong>Motion Sensors</strong>: Automatically controlling lights based on occupancy</li>
        <li><strong>Light Level Sensors</strong>: Adjusting artificial light based on natural light levels</li>
      </ul>
      
      <h4>Energy-Saving Strategies:</h4>
      <ul>
        <li>Create automated schedules aligned with household routines</li>
        <li>Implement motion-activated lighting in low-use areas</li>
        <li>Use dimming features (a light dimmed 50% uses about 40% less energy)</li>
        <li>Group lights for one-command control of multiple fixtures</li>
        <li>Set lights to automatically turn off when rooms are unoccupied</li>
      </ul>
      
      <h3>Smart Appliances and Plugs</h3>
      
      <p>Control and optimize the energy use of everything from your refrigerator to your coffee maker:</p>
      
      <h4>Smart Plug Strategies:</h4>
      <ul>
        <li>Target entertainment centers to eliminate standby power consumption</li>
        <li>Create schedules for regular-use devices like coffee makers and lamps</li>
        <li>Add intelligence to "dumb" appliances like space heaters or window AC units</li>
        <li>Use energy monitoring smart plugs to identify power-hungry devices</li>
      </ul>
      
      <h4>Smart Appliance Features:</h4>
      <ul>
        <li><strong>Delay Start</strong>: Running cycles during off-peak rate periods</li>
        <li><strong>Remote Diagnostics</strong>: Identifying performance issues early</li>
        <li><strong>Energy Usage Reports</strong>: Tracking consumption over time</li>
        <li><strong>Adaptive Defrost</strong>: Only defrosting refrigerators when needed</li>
        <li><strong>Grid-Responsive Features</strong>: Participating in utility demand response programs</li>
      </ul>
      
      <h3>Integration and Automation</h3>
      
      <p>The real power of smart home energy management comes from intelligent integration:</p>
      
      <h4>Home Energy Management Systems:</h4>
      <ul>
        <li>Central platforms like Samsung SmartThings, Apple HomeKit, or Google Home</li>
        <li>Dedicated energy management systems like Sense or Wiser Energy</li>
        <li>Voice assistants (Amazon Alexa, Google Assistant) for convenient control</li>
      </ul>
      
      <h4>Powerful Automation Examples:</h4>
      <ul>
        <li><strong>"Goodbye" Scene</strong>: Turn off all non-essential devices, adjust thermostat, close motorized shades</li>
        <li><strong>"Sleep" Mode</strong>: Lower temperature, turn off entertainment systems, activate only essential nighttime plugs</li>
        <li><strong>Occupancy-Based Control</strong>: Adjust settings room-by-room based on presence</li>
        <li><strong>Weather-Responsive Actions</strong>: Close shades on sunny days, adjust temperature based on forecast</li>
        <li><strong>Time-of-Use Optimization</strong>: Shift energy-intensive activities to lower-rate periods</li>
      </ul>
      
      <h3>Advanced Smart Home Energy Features</h3>
      
      <p>For those ready to take smart energy management further:</p>
      
      <h4>Solar Integration:</h4>
      <ul>
        <li>Smart inverters that optimize solar production</li>
        <li>Battery storage systems with intelligent charge/discharge cycles</li>
        <li>Load shifting to maximize self-consumption of solar energy</li>
      </ul>
      
      <h4>EV Charging Management:</h4>
      <ul>
        <li>Scheduled charging during off-peak rates</li>
        <li>Integration with home energy systems</li>
        <li>Solar-synchronized charging when excess production is available</li>
      </ul>
      
      <h4>Utility Program Integration:</h4>
      <ul>
        <li>Demand response participation for bill credits</li>
        <li>Time-of-use rate optimization</li>
        <li>Peak-time rebate programs</li>
      </ul>
      
      <h3>Privacy and Security Considerations</h3>
      
      <p>Smart home energy systems collect substantial data about your habits and home:</p>
      
      <ul>
        <li>Evaluate privacy policies before choosing devices and platforms</li>
        <li>Secure your home network with strong passwords and regular updates</li>
        <li>Consider local processing options that keep data within your home</li>
        <li>Regularly update firmware on all connected devices</li>
      </ul>
      
      <h3>Getting Started: A Phased Approach</h3>
      
      <p>Building a smart energy management system can be done incrementally:</p>
      
      <ol>
        <li><strong>Phase 1</strong>: Install a smart thermostat and begin monitoring overall energy use</li>
        <li><strong>Phase 2</strong>: Add smart lighting in high-use areas and smart plugs for major electronics</li>
        <li><strong>Phase 3</strong>: Implement room-by-room monitoring and control with additional sensors</li>
        <li><strong>Phase 4</strong>: Create advanced automation routines and scenes for different scenarios</li>
        <li><strong>Phase 5</strong>: Add renewable energy integration and grid-interactive features</li>
      </ol>
      
      <p>Remember that the goal is to create a system that saves energy without requiring constant attention. The best smart home energy systems are those that fade into the background while quietly optimizing your home's efficiency.</p>
    `
  },
  '4': {
    id: '4',
    preview: `This comprehensive video guide walks you through everything you need to know about solar panel installation for your home.`,
    videoUrl: 'https://www.youtube.com/embed/xKxrkht7CpY',
    content: `
      <h2>Solar Panel Installation Guide</h2>
      
      <div class="video-container">
        <iframe width="100%" height="400" src="https://www.youtube.com/embed/xKxrkht7CpY" title="Solar Panel Installation Guide" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      
      <h3>Overview</h3>
      
      <p>This comprehensive video guide walks you through the entire process of understanding and installing solar panels for your home. While many homeowners choose professional installation, understanding the process helps you make informed decisions and potentially save on costs.</p>
      
      <h3>Video Chapters</h3>
      
      <ol>
        <li><strong>0:00</strong> - Introduction to residential solar power</li>
        <li><strong>2:15</strong> - Assessing your home's solar potential</li>
        <li><strong>5:42</strong> - Understanding solar panel types and technologies</li>
        <li><strong>10:17</strong> - Sizing your system based on your energy needs</li>
        <li><strong>15:33</strong> - Equipment overview: panels, inverters, racking, and accessories</li>
        <li><strong>22:05</strong> - Permitting and utility requirements</li>
        <li><strong>25:48</strong> - Roof preparation and structural considerations</li>
        <li><strong>31:10</strong> - Mounting system installation</li>
        <li><strong>38:25</strong> - Panel placement and connection</li>
        <li><strong>45:52</strong> - Electrical wiring and inverter setup</li>
        <li><strong>52:16</strong> - System testing and commissioning</li>
        <li><strong>56:30</strong> - Maintenance and monitoring best practices</li>
        <li><strong>59:45</strong> - Conclusion and additional resources</li>
      </ol>
      
      <h3>Key Takeaways</h3>
      
      <ul>
        <li>Solar potential assessment involves analyzing roof orientation, shading, and local climate</li>
        <li>Modern solar panels typically generate 250-400 watts per panel</li>
        <li>The average home installation requires 20-30 panels for full electricity coverage</li>
        <li>Permitting requirements vary significantly by location</li>
        <li>Proper roof preparation and structural assessment is critical for safe installation</li>
        <li>Professional installation is recommended for electrical connections</li>
        <li>Regular cleaning and annual inspections maximize system efficiency</li>
      </ul>
      
      <h3>Additional Resources</h3>
      
      <p>To supplement the information in this video, consider exploring these resources:</p>
      
      <ul>
        <li>Your local utility's interconnection requirements</li>
        <li>DSIRE database for solar incentives and rebates in your area</li>
        <li>Solar panel manufacturer specifications and warranties</li>
        <li>Local solar installation companies for consultations and quotes</li>
      </ul>
      
      <p>Remember that while DIY solar installation is possible, most homeowners choose professional installation due to electrical risks, warranty considerations, and the complexity of permitting requirements.</p>
    `
  },
  '5': {
    id: '5',
    preview: `Practical energy-saving strategies that change with the seasons. Learn how to optimize your home's efficiency throughout the year.`,
    videoUrl: 'https://www.youtube.com/embed/EOvLQ65quuQ',
    content: `
      <h2>Seasonal Energy Saving Tips</h2>
      
      <div class="video-container">
        <iframe width="100%" height="400" src="https://www.youtube.com/embed/EOvLQ65quuQ" title="Seasonal Energy Saving Tips" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      
      <h3>Overview</h3>
      
      <p>This video presentation covers essential energy-saving strategies optimized for each season of the year. Understanding how to adjust your home's systems and your habits seasonally can lead to significant energy savings without sacrificing comfort.</p>
      
      <h3>Video Chapters</h3>
      
      <ol>
        <li><strong>0:00</strong> - Introduction to seasonal energy management</li>
        <li><strong>1:45</strong> - Year-round energy saving fundamentals</li>
        <li><strong>4:30</strong> - Spring energy optimization strategies</li>
        <li><strong>10:15</strong> - Summer cooling efficiency tactics</li>
        <li><strong>17:40</strong> - Fall preparation and transition tips</li>
        <li><strong>23:25</strong> - Winter heating efficiency maximization</li>
        <li><strong>30:10</strong> - Creating your seasonal energy calendar</li>
        <li><strong>34:30</strong> - Conclusion and actionable next steps</li>
      </ol>
      
      <h3>Seasonal Strategies Summary</h3>
      
      <h4>Spring Energy Tips</h4>
      <ul>
        <li>Schedule HVAC maintenance before cooling season begins</li>
        <li>Clean refrigerator coils and check door seals</li>
        <li>Use natural ventilation on mild days instead of mechanical cooling</li>
        <li>Check and clean window screens to maximize natural airflow</li>
        <li>Inspect and repair weather stripping around doors and windows</li>
        <li>Reverse ceiling fans to counter-clockwise rotation</li>
        <li>Plant shade trees on south and west sides of your home (long-term strategy)</li>
      </ul>
      
      <h4>Summer Energy Tips</h4>
      <ul>
        <li>Set thermostats to 78°F when home, higher when away</li>
        <li>Use ceiling fans to create a wind-chill effect (remember to turn off when leaving)</li>
        <li>Close blinds and curtains on sun-facing windows during peak heat</li>
        <li>Use bathroom and kitchen exhaust fans to remove humidity</li>
        <li>Grill outside instead of using your oven</li>
        <li>Run major appliances in the evening hours</li>
        <li>Consider a programmable or smart thermostat for optimal cooling schedules</li>
        <li>Keep air conditioner filters clean (check monthly)</li>
      </ul>
      
      <h4>Fall Energy Tips</h4>
      <ul>
        <li>Schedule heating system maintenance and tune-up</li>
        <li>Seal air leaks before the heating season</li>
        <li>Check attic insulation levels and add more if needed</li>
        <li>Clean gutters to prevent ice dams in winter</li>
        <li>Install door sweeps on exterior doors</li>
        <li>Reverse ceiling fans to clockwise rotation</li>
        <li>Clean or replace furnace filters</li>
        <li>Consider a humidifier to maintain comfort at lower temperatures</li>
      </ul>
      
      <h4>Winter Energy Tips</h4>
      <ul>
        <li>Set thermostats to 68°F when home, lower when sleeping or away</li>
        <li>Open curtains on south-facing windows during the day</li>
        <li>Close curtains at night to reduce heat loss</li>
        <li>Use draft stoppers at the bottom of doors</li>
        <li>Maintain 40-50% humidity to improve comfort at lower temperatures</li>
        <li>Check for and seal air leaks around electrical outlets</li>
        <li>Use space heaters judiciously in occupied rooms (with proper safety precautions)</li>
        <li>Insulate hot water pipes to reduce heat loss</li>
      </ul>
      
      <h3>Your Seasonal Energy Calendar</h3>
      
      <p>The video recommends creating a seasonal maintenance and adjustment calendar. Key times to remember:</p>
      
      <ul>
        <li><strong>Early Spring (March/April)</strong>: HVAC maintenance, refrigerator maintenance</li>
        <li><strong>Late Spring (May)</strong>: Window screen repairs, ceiling fan direction change</li>
        <li><strong>Early Summer (June)</strong>: AC filter checks, window coverings optimization</li>
        <li><strong>Late Summer (August)</strong>: Check for air conditioner performance issues</li>
        <li><strong>Early Fall (September/October)</strong>: Heating system check, insulation inspection</li>
        <li><strong>Late Fall (November)</strong>: Weatherstripping and draft-proofing</li>
        <li><strong>Mid-Winter (January)</strong>: Energy bill analysis, system adjustments</li>
      </ul>
      
      <p>By following these seasonal strategies, you can maintain optimal energy efficiency year-round while ensuring your home remains comfortable through changing weather conditions.</p>
    `
  }
};
