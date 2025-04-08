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
      <h2>Advanced Insulation Techniques</h2>
      
      <p>While traditional insulation methods are effective, advanced techniques can provide superior energy efficiency, especially in challenging areas of your home. This guide covers innovative approaches for those ready to take their home insulation to the next level.</p>
      
      <h3>Understanding Insulation Performance</h3>
      
      <p>Before diving into advanced techniques, it's important to understand how insulation performance is measured:</p>
      
      <ul>
        <li><strong>R-Value</strong>: Measures resistance to heat flow; higher numbers mean better insulation performance</li>
        <li><strong>Continuous Insulation</strong>: Uninterrupted insulation that eliminates thermal bridging</li>
        <li><strong>Air Barriers</strong>: Systems that prevent air movement through the building envelope</li>
        <li><strong>Thermal Bridging</strong>: Heat transfer that occurs when materials with poor insulating properties span from heated to unheated spaces</li>
      </ul>
      
      <h3>Advanced Insulation Materials</h3>
      
      <p>These innovative materials offer superior performance compared to conventional options:</p>
      
      <h4>Aerogel Insulation</h4>
      <p>Developed from NASA technology, aerogel is one of the most efficient insulating materials available:</p>
      <ul>
        <li>R-value of R-10.3 per inch (compared to R-3.8 for fiberglass)</li>
        <li>Ultra-lightweight, hydrophobic material</li>
        <li>Excellent for space-constrained areas where thickness is limited</li>
        <li>Can be used as blankets, panels, or loose-fill</li>
      </ul>
      
      <h4>Vacuum Insulation Panels (VIPs)</h4>
      <p>These high-performance panels consist of a core material encased in an airtight envelope:</p>
      <ul>
        <li>R-value of R-25 to R-30 per inch</li>
        <li>Up to 10 times more effective than conventional insulation</li>
        <li>Ideal for projects with severe space limitations</li>
        <li>Cannot be cut or modified on-site; must be ordered to exact specifications</li>
      </ul>
      
      <h4>Phase Change Materials (PCMs)</h4>
      <p>These materials absorb and release thermal energy during melting and freezing:</p>
      <ul>
        <li>Store and release heat as they change from solid to liquid state</li>
        <li>Help moderate temperature swings within the home</li>
        <li>Can be integrated into drywall, insulation, or as separate panels</li>
        <li>Most effective in climates with large daily temperature variations</li>
      </ul>
      
      <h3>Advanced Installation Techniques</h3>
      
      <p>Even the best materials won't perform optimally without proper installation methods:</p>
      
      <h4>Exterior Continuous Insulation</h4>
      <p>Adding a layer of rigid foam or mineral wool to the exterior of your home:</p>
      <ul>
        <li>Eliminates thermal bridging through wall studs</li>
        <li>Creates a thermal break between indoor and outdoor environments</li>
        <li>Can be combined with rain screen systems for superior moisture management</li>
        <li>Often installed during re-siding projects or deep energy retrofits</li>
      </ul>
      
      <h4>Raised Heel Trusses</h4>
      <p>These modified roof trusses allow for full-depth insulation at the roof-wall intersection:</p>
      <ul>
        <li>Solves the problem of compressed insulation at the eaves</li>
        <li>Allows for R-49 or greater in attic spaces</li>
        <li>Reduces ice dam formation in cold climates</li>
        <li>Best implemented during new construction or roof replacement</li>
      </ul>
      
      <h4>Flash-and-Batt Method</h4>
      <p>A hybrid approach combining spray foam with traditional batt insulation:</p>
      <ul>
        <li>1-2 inches of closed-cell spray foam creates an air barrier</li>
        <li>Remainder of cavity filled with less expensive fiberglass/mineral wool batts</li>
        <li>Combines the air-sealing benefits of foam with the cost-effectiveness of batts</li>
        <li>Particularly effective in cathedral ceilings and vaulted spaces</li>
      </ul>
      
      <h3>Addressing Challenging Areas</h3>
      
      <p>Some areas of the home require specialized approaches:</p>
      
      <h4>Rim Joists and Sill Plates</h4>
      <p>These areas are notorious for air leakage and heat loss:</p>
      <ul>
        <li>Closed-cell spray foam provides both insulation and air sealing</li>
        <li>Rigid foam board cut to fit and sealed with expansion foam</li>
        <li>Critical area that can account for up to 15% of a home's heat loss</li>
      </ul>
      
      <h4>Existing Walls Without Removing Drywall</h4>
      <p>Techniques for insulating finished walls:</p>
      <ul>
        <li>Dense-packed cellulose installed through small holes</li>
        <li>Liquid injection foam systems that expand within wall cavities</li>
        <li>Exterior approaches that avoid interior disruption</li>
      </ul>
      
      <h4>Old Masonry Buildings</h4>
      <p>Special considerations for brick, stone, or concrete structures:</p>
      <ul>
        <li>Interior insulation systems that manage moisture movement</li>
        <li>Breathable insulation materials like mineral wool or cork</li>
        <li>Vapor-open systems that allow walls to dry in both directions</li>
      </ul>
      
      <h3>Performance Monitoring</h3>
      
      <p>Advanced insulation projects benefit from performance verification:</p>
      
      <ul>
        <li><strong>Thermal Imaging</strong>: Using infrared cameras to identify remaining thermal bridges or gaps</li>
        <li><strong>Blower Door Testing</strong>: Quantifying air leakage before and after improvements</li>
        <li><strong>Energy Monitoring</strong>: Tracking energy usage to verify performance improvements</li>
      </ul>
      
      <h3>Cost-Benefit Analysis</h3>
      
      <p>Advanced insulation techniques typically involve higher upfront costs:</p>
      
      <ul>
        <li>Premium materials can cost 2-5 times more than conventional insulation</li>
        <li>Labor costs may also be higher due to specialized installation requirements</li>
        <li>Energy savings of 30-50% are possible with comprehensive approaches</li>
        <li>Return on investment typically ranges from 3-10 years depending on climate and energy costs</li>
      </ul>
      
      <p>For maximum cost-effectiveness, consider implementing advanced insulation during other planned renovations.</p>
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
