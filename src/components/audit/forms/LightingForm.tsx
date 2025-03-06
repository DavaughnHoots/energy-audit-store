import React, { useState, ChangeEvent } from 'react';
import { CurrentConditions, LightingFixture } from '@/types/energyAudit';
import { Lightbulb } from 'lucide-react';
import FormSection, { FormSectionAdvanced } from '../FormSection';
import { FormGrid, SelectField, InputField, FormSubsection } from '../FormFields';

interface LightingFormProps {
  data: CurrentConditions;
  onInputChange: (field: keyof CurrentConditions, value: any) => void;
}

const LightingForm: React.FC<LightingFormProps> = ({
  data,
  onInputChange
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize fixtures array if it doesn't exist
  if (!data.fixtures) {
    onInputChange('fixtures', []);
  }

  // Initialize bulbPercentages if it doesn't exist
  if (!data.bulbPercentages) {
    onInputChange('bulbPercentages', { led: 0, cfl: 0, incandescent: 0 });
  }

  // Initialize lightingPatterns if it doesn't exist
  if (!data.lightingPatterns) {
    onInputChange('lightingPatterns', { 
      morning: 'some', 
      day: 'few', 
      evening: 'most', 
      night: 'few' 
    });
  }

  return (
    <FormSection
      title="Lighting Assessment"
      description="Tell us about your lighting fixtures and usage patterns."
      icon={Lightbulb}
      showAdvanced={showAdvanced}
      onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
    >
      {/* Basic Fields */}
      <FormSubsection title="Light Bulb Types">
        <FormGrid>
          <SelectField
            label="Primary Light Bulb Types"
            value={data.primaryBulbType || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => 
              onInputChange('primaryBulbType', e.target.value)}
            options={[
              { value: 'mostly-led', label: 'Mostly LED/Efficient Bulbs' },
              { value: 'mixed', label: 'Mix of Bulb Types' },
              { value: 'mostly-incandescent', label: 'Mostly Older Bulb Types' }
            ]}
            required
          />
          
          <SelectField
            label="Natural Light"
            value={data.naturalLight || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => 
              onInputChange('naturalLight', e.target.value)}
            options={[
              { value: 'good', label: 'Good Natural Light' },
              { value: 'moderate', label: 'Moderate Natural Light' },
              { value: 'limited', label: 'Limited Natural Light' }
            ]}
            required
          />
          
          <SelectField
            label="Lighting Controls"
            value={data.lightingControls || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => 
              onInputChange('lightingControls', e.target.value)}
            options={[
              { value: 'basic', label: 'Basic Switches Only' },
              { value: 'some-advanced', label: 'Some Advanced Controls' },
              { value: 'smart', label: 'Smart/Automated Lighting' }
            ]}
            required
          />
        </FormGrid>
      </FormSubsection>

      {/* Advanced Fields */}
      {showAdvanced && (
        <FormSectionAdvanced>
          {/* Detailed Lighting Information */}
          <FormSubsection title="Detailed Lighting Information">
            <FormGrid>
              <InputField
                label="LED Percentage"
                type="number"
                value={data.bulbPercentages?.led || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    onInputChange('bulbPercentages', {
                      ...data.bulbPercentages,
                      led: value
                    });
                  }
                }}
                min="0"
                max="100"
                placeholder="0-100"
                helpText="Approximate percentage of LED bulbs"
              />
              
              <InputField
                label="CFL Percentage"
                type="number"
                value={data.bulbPercentages?.cfl || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    onInputChange('bulbPercentages', {
                      ...data.bulbPercentages,
                      cfl: value
                    });
                  }
                }}
                min="0"
                max="100"
                placeholder="0-100"
                helpText="Approximate percentage of CFL bulbs"
              />
              
              <InputField
                label="Incandescent Percentage"
                type="number"
                value={data.bulbPercentages?.incandescent || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 100) {
                    onInputChange('bulbPercentages', {
                      ...data.bulbPercentages,
                      incandescent: value
                    });
                  }
                }}
                min="0"
                max="100"
                placeholder="0-100"
                helpText="Approximate percentage of incandescent bulbs"
              />
            </FormGrid>
          </FormSubsection>

          {/* Lighting Usage Patterns */}
          <FormSubsection title="Lighting Usage Patterns">
            <h4 className="text-sm font-medium mb-2">Weekday Lights Typically On:</h4>
            
            <FormGrid>
              <SelectField
                label="Morning (5am-9am)"
                value={data.lightingPatterns?.morning || 'some'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  onInputChange('lightingPatterns', {
                    ...data.lightingPatterns,
                    morning: e.target.value
                  })}
                options={[
                  { value: 'most', label: 'Most Lights' },
                  { value: 'some', label: 'Some Lights' },
                  { value: 'few', label: 'Few Lights' },
                  { value: 'none', label: 'No Lights' }
                ]}
              />
              
              <SelectField
                label="Day (9am-5pm)"
                value={data.lightingPatterns?.day || 'few'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  onInputChange('lightingPatterns', {
                    ...data.lightingPatterns,
                    day: e.target.value
                  })}
                options={[
                  { value: 'most', label: 'Most Lights' },
                  { value: 'some', label: 'Some Lights' },
                  { value: 'few', label: 'Few Lights' },
                  { value: 'none', label: 'No Lights' }
                ]}
              />
              
              <SelectField
                label="Evening (5pm-10pm)"
                value={data.lightingPatterns?.evening || 'most'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  onInputChange('lightingPatterns', {
                    ...data.lightingPatterns,
                    evening: e.target.value
                  })}
                options={[
                  { value: 'most', label: 'Most Lights' },
                  { value: 'some', label: 'Some Lights' },
                  { value: 'few', label: 'Few Lights' },
                  { value: 'none', label: 'No Lights' }
                ]}
              />
              
              <SelectField
                label="Night (10pm-5am)"
                value={data.lightingPatterns?.night || 'few'}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => 
                  onInputChange('lightingPatterns', {
                    ...data.lightingPatterns,
                    night: e.target.value
                  })}
                options={[
                  { value: 'most', label: 'Most Lights' },
                  { value: 'some', label: 'Some Lights' },
                  { value: 'few', label: 'Few Lights' },
                  { value: 'none', label: 'No Lights' }
                ]}
              />
            </FormGrid>
          </FormSubsection>

          {/* Fixture Management */}
          <FormSubsection title="Lighting Fixtures">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Manage Lighting Fixtures:</h4>
              
              {data.fixtures && data.fixtures.map((fixture, index) => (
                <div key={index} className="p-3 border rounded-md mb-2 bg-gray-50">
                  <div className="flex justify-between mb-2">
                    <h5 className="font-medium">{fixture.name || `Fixture ${index + 1}`}</h5>
                    <button
                      type="button"
                      onClick={() => {
                        const newFixtures = [...(data.fixtures || [])];
                        newFixtures.splice(index, 1);
                        onInputChange('fixtures', newFixtures);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <FormGrid>
                    <InputField
                      label="Fixture Name"
                      type="text"
                      value={fixture.name || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const newFixtures = [...(data.fixtures || [])];
                        newFixtures[index] = {
                          ...newFixtures[index],
                          name: e.target.value
                        };
                        onInputChange('fixtures', newFixtures);
                      }}
                      placeholder="e.g., Kitchen Ceiling"
                    />
                    
                    <InputField
                      label="Watts per Fixture"
                      type="number"
                      value={fixture.watts || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          const newFixtures = [...(data.fixtures || [])];
                          newFixtures[index] = {
                            ...newFixtures[index],
                            watts: value
                          };
                          onInputChange('fixtures', newFixtures);
                        }
                      }}
                      min="0"
                      placeholder="Watts"
                    />
                    
                    <InputField
                      label="Hours of Use per Day"
                      type="number"
                      value={fixture.hoursPerDay || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0 && value <= 24) {
                          const newFixtures = [...(data.fixtures || [])];
                          newFixtures[index] = {
                            ...newFixtures[index],
                            hoursPerDay: value
                          };
                          onInputChange('fixtures', newFixtures);
                        }
                      }}
                      min="0"
                      max="24"
                      placeholder="Hours"
                    />
                    
                    <InputField
                      label="Lumens Output"
                      type="number"
                      value={fixture.lumens || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value) && value >= 0) {
                          const newFixtures = [...(data.fixtures || [])];
                          newFixtures[index] = {
                            ...newFixtures[index],
                            lumens: value
                          };
                          onInputChange('fixtures', newFixtures);
                        }
                      }}
                      min="0"
                      placeholder="Lumens"
                    />
                  </FormGrid>
                </div>
              ))}
              
              <button
                type="button"
                onClick={() => {
                  onInputChange('fixtures', [
                    ...(data.fixtures || []),
                    { name: '', watts: 0, hoursPerDay: 0, lumens: 0 }
                  ]);
                }}
                className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Fixture
              </button>
            </div>
          </FormSubsection>
        </FormSectionAdvanced>
      )}
    </FormSection>
  );
};

export default LightingForm;
