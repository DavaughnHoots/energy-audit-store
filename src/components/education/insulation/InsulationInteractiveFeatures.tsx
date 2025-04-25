import React, { useState } from 'react';
import TableOfContents from '../TableOfContents';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

interface InsulationInteractiveFeaturesProps {
  onStartAudit: () => void;
}

// Table of contents items
const tocItems = [
  { id: 'insulation-types', title: 'Types of Insulation' },
  { id: 'r-value', title: 'R-Value Explained' },
  { id: 'where-to-insulate', title: 'Where to Insulate' },
  { id: 'benefits', title: 'Benefits of Insulation' },
  { id: 'quiz', title: 'Insulation Readiness Quiz' },
];

// Import subcomponents
import InsulationMaterialTabs from './InsulationMaterialTabs';
import InsulationZonesVisualization from './InsulationZonesVisualization';
import InsulationReadinessQuiz from './InsulationReadinessQuiz';

// Main component
const InsulationInteractiveFeatures: React.FC<InsulationInteractiveFeaturesProps> = ({ onStartAudit }) => {
  const [selectedSection, setSelectedSection] = useState<string>('');
  
  return (
    <div className="insulation-interactive-content mt-6">
      {/* Table of Contents */}
      <TableOfContents
        items={tocItems}
        containerClassName="mb-8"
      />
      
      <div className="content space-y-12 mt-8">
        {/* Types of Insulation Section */}
        <section id="insulation-types" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🧱 Types of Insulation Materials</h2>
          <p className="italic text-gray-600 mb-4">"Choosing the right insulation material is crucial for your project's success."</p>
          
          <p className="mb-4">
            Each insulation material has unique properties, benefits, and ideal applications. 
            Compare the options below to find the best fit for your specific project and needs.
          </p>
          
          <InsulationMaterialTabs />
        </section>
        
        {/* R-Value Section */}
        <section id="r-value" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🔢 Understanding R-Value</h2>
          <p className="italic text-gray-600 mb-4">"The higher the R-value, the better the insulation's effectiveness at stopping heat flow."</p>
          
          <div className="bg-white rounded-lg shadow-sm p-4 my-6">
            <h3 className="text-lg font-bold mb-3">What Is R-Value?</h3>
            
            <p className="mb-4">
              R-value measures insulation's resistance to heat flow. It's the standard way to compare insulation effectiveness - 
              a higher R-value means better insulating performance. R-values can be added together when you layer insulation.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">R-Value Factors</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li><strong>Material:</strong> Different materials have different R-values per inch</li>
                  <li><strong>Thickness:</strong> Thicker insulation = higher R-value</li>
                  <li><strong>Density:</strong> Affects thermal resistance</li>
                  <li><strong>Installation:</strong> Proper installation is critical to achieving rated R-value</li>
                  <li><strong>Aging:</strong> Some insulations lose R-value over time</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Recommended R-Values by Zone</h4>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-2">Climate Zone</th>
                      <th className="text-left pb-2">Attic</th>
                      <th className="text-left pb-2">Walls</th>
                      <th className="text-left pb-2">Floors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-1.5 pr-2">Northern</td>
                      <td className="py-1.5">R-49 to R-60</td>
                      <td className="py-1.5">R-15 to R-21</td>
                      <td className="py-1.5">R-25 to R-30</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2">Central</td>
                      <td className="py-1.5">R-38 to R-49</td>
                      <td className="py-1.5">R-13 to R-15</td>
                      <td className="py-1.5">R-19 to R-25</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-2">Southern</td>
                      <td className="py-1.5">R-30 to R-38</td>
                      <td className="py-1.5">R-13</td>
                      <td className="py-1.5">R-13 to R-19</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        
        {/* Where to Insulate Section */}
        <section id="where-to-insulate" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🏠 Where to Insulate Your Home</h2>
          <p className="italic text-gray-600 mb-4">"Focus on the areas with the biggest impact first."</p>
          
          <p className="mb-4">
            Some areas of your home can lose more heat than others. Understanding where to prioritize your insulation 
            efforts can maximize comfort improvements and energy savings.
          </p>
          
          <InsulationZonesVisualization />
        </section>
        
        {/* Benefits of Insulation section */}
        <section id="benefits" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">💰 Benefits of Good Insulation</h2>
          <p className="italic text-gray-600 mb-4">"Insulation pays for itself through multiple benefits."</p>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-center mb-2">
                  <span className="text-4xl">💵</span>
                  <h3 className="font-bold mt-1">Financial</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Save 15-20% on heating/cooling costs</li>
                  <li>Increase property value</li>
                  <li>Quick return on investment</li>
                  <li>Potential tax incentives/rebates</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-center mb-2">
                  <span className="text-4xl">🛋️</span>
                  <h3 className="font-bold mt-1">Comfort</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Even temperatures throughout home</li>
                  <li>Fewer drafts and cold spots</li>
                  <li>Reduced noise from outside</li>
                  <li>Better indoor air quality</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-center mb-2">
                  <span className="text-4xl">🌎</span>
                  <h3 className="font-bold mt-1">Environmental</h3>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Lower carbon footprint</li>
                  <li>Reduced energy consumption</li>
                  <li>Less strain on power grid</li>
                  <li>Sustainable home improvement</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">What Our Data Shows:</h3>
            <p>Homes with proper insulation can experience:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Up to <strong>30% less energy used</strong> for heating and cooling</li>
              <li>Temperature differences between rooms reduced by <strong>up to 70%</strong></li>
              <li>Noise reduction of <strong>25-50%</strong> from outside sources</li>
              <li>HVAC systems that <strong>last 2-3 years longer</strong> due to reduced workload</li>
            </ul>
          </div>
        </section>
        
        {/* Quiz section */}
        <section id="quiz" className="scroll-mt-24">
          <h2 className="text-2xl font-bold text-green-800 mb-3">🧩 Insulation Readiness Quiz</h2>
          <p className="italic text-gray-600 mb-4">"Find out what insulation approach makes sense for your home."</p>
          
          <InsulationReadinessQuiz onStartAudit={onStartAudit} />
        </section>
      </div>
    </div>
  );
};

export default InsulationInteractiveFeatures;