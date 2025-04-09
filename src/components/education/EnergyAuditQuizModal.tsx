import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../ui/Dialog';

interface EnergyAuditQuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (answers: QuizAnswers) => void;
}

export interface QuizAnswers {
  homeType: string;
  homeAge: string;
  climateZone: string;
  currentInsulation: string;
  energyBills: string;
  priorities: string[];
}

const EnergyAuditQuizModal: React.FC<EnergyAuditQuizModalProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    homeType: '',
    homeAge: '',
    climateZone: '',
    currentInsulation: '',
    energyBills: '',
    priorities: []
  });

  const questions = [
    {
      id: 'homeType',
      question: 'What type of home do you have?',
      options: [
        { value: 'single-family', label: 'Single-family house' },
        { value: 'townhouse', label: 'Townhouse/Duplex' },
        { value: 'apartment', label: 'Apartment/Condo' },
        { value: 'mobile', label: 'Mobile home' }
      ]
    },
    {
      id: 'homeAge',
      question: 'How old is your home?',
      options: [
        { value: 'new', label: 'Less than 10 years' },
        { value: 'medium', label: '10-30 years' },
        { value: 'older', label: '30-50 years' },
        { value: 'historic', label: 'Over 50 years' }
      ]
    },
    {
      id: 'climateZone',
      question: 'What climate do you live in?',
      options: [
        { value: 'hot', label: 'Hot (mostly cooling needs)' },
        { value: 'cold', label: 'Cold (mostly heating needs)' },
        { value: 'mixed', label: 'Mixed (both heating and cooling)' },
        { value: 'temperate', label: 'Temperate (mild year-round)' }
      ]
    },
    {
      id: 'currentInsulation',
      question: 'How would you describe your current insulation?',
      options: [
        { value: 'none', label: 'Minimal or none' },
        { value: 'basic', label: 'Basic/standard' },
        { value: 'partial', label: 'Some areas well-insulated' },
        { value: 'unknown', label: 'I\'m not sure' }
      ]
    },
    {
      id: 'energyBills',
      question: 'How would you characterize your energy bills?',
      options: [
        { value: 'very-high', label: 'Very high - major concern' },
        { value: 'high', label: 'Higher than I\'d like' },
        { value: 'reasonable', label: 'Reasonable for my area' },
        { value: 'low', label: 'Already quite efficient' }
      ]
    },
    {
      id: 'priorities',
      question: 'What are your priorities for insulation improvements? (Select all that apply)',
      options: [
        { value: 'cost-savings', label: 'Lower energy bills' },
        { value: 'comfort', label: 'Comfort/temperature regulation' },
        { value: 'environmental', label: 'Environmental impact' },
        { value: 'noise', label: 'Noise reduction' },
        { value: 'value', label: 'Increasing home value' }
      ],
      multiSelect: true
    }
  ];

  const handleSingleSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleMultiSelect = (questionId: string, value: string) => {
    setAnswers(prev => {
      const currentSelections = prev[questionId as keyof QuizAnswers] as string[] || [];
      
      if (currentSelections.includes(value)) {
        return {
          ...prev,
          [questionId]: currentSelections.filter(item => item !== value)
        };
      } else {
        return {
          ...prev,
          [questionId]: [...currentSelections, value]
        };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Quiz completed
      if (onComplete) {
        onComplete(answers);
      }
      onOpenChange(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastQuestion = currentStep === questions.length - 1;
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return false;
    
    const answer = answers[currentQuestion.id as keyof QuizAnswers];
    if (currentQuestion.multiSelect) {
      return (answer as string[])?.length > 0;
    }
    return !!answer;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>60-Second Insulation Audit</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="quiz-progress mb-4">
          <div className="h-1 w-full bg-gray-200 rounded-full">
            <div
              className="h-1 bg-green-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="text-right text-sm text-gray-500 mt-1">
            Question {currentStep + 1} of {questions.length}
          </div>
        </div>

        <div className="quiz-question mb-6">
          {currentQuestion && (
            <>
              <h3 className="text-lg font-semibold mb-3">{currentQuestion.question}</h3>
            
              <div className="options-list space-y-2">
                {currentQuestion.options.map((option) => (
                  <div key={option.value} className="option">
                    {currentQuestion.multiSelect ? (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={option.value}
                          checked={(answers[currentQuestion.id as keyof QuizAnswers] as string[] || []).includes(option.value)}
                          onChange={() => handleMultiSelect(currentQuestion.id, option.value)}
                          className="mr-2"
                        />
                        <label htmlFor={option.value} className="cursor-pointer">{option.label}</label>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name={currentQuestion.id}
                          id={option.value}
                          value={option.value}
                          checked={answers[currentQuestion.id as keyof QuizAnswers] === option.value}
                          onChange={() => handleSingleSelect(currentQuestion.id, option.value)}
                          className="mr-2"
                        />
                        <label htmlFor={option.value} className="cursor-pointer">{option.label}</label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-between">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div for spacing when there's no back button
          )}
          
          <button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered()}
            className={`px-4 py-2 rounded-lg ${
              isCurrentQuestionAnswered()
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLastQuestion ? "Get Recommendations" : "Next"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnergyAuditQuizModal;