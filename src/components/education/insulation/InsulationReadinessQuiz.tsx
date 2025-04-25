import React, { useState } from 'react';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

interface InsulationReadinessQuizProps {
  onStartAudit: () => void;
}

// Quiz questions data
const quizQuestions = [
  {
    id: 'comfort',
    question: 'How comfortable is your home throughout the year?',
    options: [
      { value: 'very', text: 'Very comfortable - consistent temperatures' },
      { value: 'mostly', text: 'Mostly comfortable - occasional issues' },
      { value: 'somewhat', text: 'Somewhat comfortable - noticeable hot/cold spots' },
      { value: 'not', text: 'Not comfortable - drafty and inconsistent' }
    ]
  },
  {
    id: 'age',
    question: 'When was your home last insulated?',
    options: [
      { value: 'recent', text: 'Within the last 5 years' },
      { value: 'decade', text: '5-15 years ago' },
      { value: 'old', text: '15+ years ago' },
      { value: 'unknown', text: 'I don\'t know' }
    ]
  },
  {
    id: 'utility',
    question: 'How would you describe your energy bills?',
    options: [
      { value: 'low', text: 'Lower than average for my area' },
      { value: 'average', text: 'About average for my area' },
      { value: 'high', text: 'Higher than average for my area' },
      { value: 'very-high', text: 'Much higher than I would expect' }
    ]
  },
  {
    id: 'skill',
    question: 'What is your comfort level with DIY home projects?',
    options: [
      { value: 'pro', text: 'Very comfortable with most home projects' },
      { value: 'capable', text: 'Comfortable with basic to intermediate projects' },
      { value: 'basic', text: 'Prefer simple, well-documented projects only' },
      { value: 'none', text: 'I prefer to hire professionals' }
    ]
  }
];

// Quiz recommendations based on answers
const getRecommendation = (answers: Record<string, string>) => {
  // Determine comfort issues
  const hasComfortIssues = answers.comfort === 'somewhat' || answers.comfort === 'not';
  
  // Determine insulation age issues
  const hasOldInsulation = answers.age === 'old' || answers.age === 'unknown';
  
  // Determine bill issues
  const hasHighBills = answers.utility === 'high' || answers.utility === 'very-high';
  
  // Determine DIY capability
  const isDIYCapable = answers.skill === 'pro' || answers.skill === 'capable';
  
  // Priority areas recommendation
  let priorityAreas = [];
  if (hasComfortIssues || hasHighBills) {
    priorityAreas.push('attic');
    if (hasComfortIssues) {
      priorityAreas.push('walls');
    }
    if (hasHighBills) {
      priorityAreas.push('air-sealing');
    }
  } else {
    priorityAreas.push('maintenance');
  }
  
  // Material recommendation
  let recommendedMaterial = '';
  if (isDIYCapable && !hasComfortIssues && !hasHighBills) {
    recommendedMaterial = 'fiberglass';
  } else if (isDIYCapable && (hasComfortIssues || hasHighBills)) {
    recommendedMaterial = 'mineral-wool';
  } else if (!isDIYCapable && (hasComfortIssues || hasHighBills)) {
    recommendedMaterial = 'spray-foam';
  } else {
    recommendedMaterial = 'cellulose';
  }
  
  // Next steps
  const nextSteps = [];
  if (hasOldInsulation || hasComfortIssues || hasHighBills) {
    nextSteps.push('energy-audit');
    
    if (hasOldInsulation) {
      nextSteps.push('insulation-inspection');
    }
    
    if (hasComfortIssues) {
      nextSteps.push('thermal-imaging');
    }
    
    if (hasHighBills) {
      nextSteps.push('air-sealing');
    }
  } else {
    nextSteps.push('maintenance');
  }
  
  return {
    urgency: hasHighBills && hasComfortIssues ? 'high' : hasHighBills || hasComfortIssues ? 'medium' : 'low',
    priorityAreas,
    recommendedMaterial,
    nextSteps,
    diy: isDIYCapable
  };
};

// Main component for the insulation readiness quiz
const InsulationReadinessQuiz: React.FC<InsulationReadinessQuizProps> = ({ onStartAudit }) => {
  const [quizActive, setQuizActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReturnType<typeof getRecommendation> | null>(null);
  
  const trackComponentEvent = useComponentTracking('education', 'InsulationReadinessQuiz');
  
  const startQuiz = () => {
    setQuizActive(true);
    setCurrentStep(0);
    setAnswers({});
    setResult(null);
    trackComponentEvent('start_insulation_quiz', {});
  };
  
  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Advance to next question or show results
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Calculate results
      const recommendation = getRecommendation({
        ...answers,
        [questionId]: answer
      });
      setResult(recommendation);
      trackComponentEvent('complete_insulation_quiz', { recommendation: recommendation.urgency });
    }
  };
  
  const resetQuiz = () => {
    setQuizActive(false);
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
  };
  
  const currentQuestion = quizQuestions[currentStep];
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 my-6">
      <h3 className="text-lg font-bold mb-3">Insulation Readiness Quiz</h3>
      
      {!quizActive && !result && (
        <div className="text-center py-6">
          <p className="mb-4">Take our 4-question quiz to get personalized insulation recommendations for your home.</p>
          <button
            onClick={startQuiz}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Start Quiz
          </button>
        </div>
      )}
      
      {quizActive && !result && (
        <div>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Question {currentStep + 1} of {quizQuestions.length}</span>
              <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / quizQuestions.length) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${((currentStep + 1) / quizQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <h4 className="text-lg font-medium mb-4">{currentQuestion.question}</h4>
          
          <div className="space-y-3 mb-4">
            {currentQuestion.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(currentQuestion.id, option.value)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {result && (
        <div>
          <div className="mb-6">
            <h4 className="text-xl font-bold mb-2">Your Insulation Recommendation</h4>
            <div className={`rounded-lg p-4 mb-4 ${
              result.urgency === 'high' 
                ? 'bg-red-50 text-red-800' 
                : result.urgency === 'medium'
                ? 'bg-yellow-50 text-yellow-800'
                : 'bg-green-50 text-green-800'
            }`}>
              <div className="font-bold mb-1">
                {result.urgency === 'high' 
                  ? '🔴 High Priority: Immediate attention recommended' 
                  : result.urgency === 'medium'
                  ? '🟡 Medium Priority: Improvement opportunities available'
                  : '🟢 Low Priority: Your insulation appears adequate'}
              </div>
              <p className="text-sm">
                {result.urgency === 'high' 
                  ? 'Based on your answers, your home likely has significant insulation issues that are affecting comfort and energy costs.'
                  : result.urgency === 'medium'
                  ? 'Your responses indicate some insulation improvements would be beneficial for better comfort and energy efficiency.'
                  : 'Your home appears to have reasonable insulation, but there may still be opportunities for enhancement.'}
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h5 className="font-bold mb-2">Recommended Focus Areas</h5>
              <ul className="list-disc pl-5 space-y-1">
                {result.priorityAreas.includes('attic') && (
                  <li><strong>Attic Insulation:</strong> The highest priority area with the best ROI</li>
                )}
                {result.priorityAreas.includes('walls') && (
                  <li><strong>Wall Insulation:</strong> Important for comfort and consistent temperatures</li>
                )}
                {result.priorityAreas.includes('air-sealing') && (
                  <li><strong>Air Sealing:</strong> Critical for improving insulation effectiveness</li>
                )}
                {result.priorityAreas.includes('maintenance') && (
                  <li><strong>Maintenance:</strong> Check existing insulation for settling or damage</li>
                )}
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold mb-2">Recommended Material</h5>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p>
                  <strong>
                    {result.recommendedMaterial === 'fiberglass' && 'Fiberglass'}
                    {result.recommendedMaterial === 'cellulose' && 'Cellulose'}
                    {result.recommendedMaterial === 'mineral-wool' && 'Mineral Wool'}
                    {result.recommendedMaterial === 'spray-foam' && 'Spray Foam'}
                  </strong> 
                  may be best suited for your situation based on your DIY comfort level and home needs.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h5 className="font-bold mb-2">Suggested Next Steps</h5>
            <ol className="list-decimal pl-5 space-y-2">
              {result.nextSteps.includes('energy-audit') && (
                <li>Schedule a professional energy audit to identify specific issues</li>
              )}
              {result.nextSteps.includes('insulation-inspection') && (
                <li>Have your current insulation inspected for effectiveness</li>
              )}
              {result.nextSteps.includes('thermal-imaging') && (
                <li>Consider thermal imaging to identify major heat loss areas</li>
              )}
              {result.nextSteps.includes('air-sealing') && (
                <li>Address air leaks before adding new insulation</li>
              )}
              {result.nextSteps.includes('maintenance') && (
                <li>Perform seasonal insulation check and maintenance</li>
              )}
            </ol>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={resetQuiz}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Retake Quiz
            </button>
            
            <button
              onClick={onStartAudit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
            >
              Start Energy Audit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsulationReadinessQuiz;