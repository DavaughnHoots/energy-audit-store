import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';

interface EnergyAuditQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingLocation: string;
  resourceId: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

const EnergyAuditQuizModal: React.FC<EnergyAuditQuizModalProps> = ({
  isOpen,
  onClose,
  trackingLocation,
  resourceId
}) => {
  const navigate = useNavigate();
  const trackComponentEvent = useComponentTracking('education', 'EnergyAuditQuizModal');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Quiz questions - simplified version to qualify for energy audit
  const questions: QuizQuestion[] = [
    {
      id: 'home_type',
      question: 'What type of home do you live in?',
      options: [
        { value: 'single_family', label: 'Single-family house' },
        { value: 'apartment', label: 'Apartment/Condo' },
        { value: 'townhouse', label: 'Townhouse' },
        { value: 'mobile', label: 'Mobile home' }
      ]
    },
    {
      id: 'home_age',
      question: 'How old is your home?',
      options: [
        { value: 'new', label: 'Less than 5 years' },
        { value: 'recent', label: '5-15 years' },
        { value: 'older', label: '16-30 years' },
        { value: 'historic', label: 'Over 30 years' }
      ]
    },
    {
      id: 'energy_bill',
      question: 'How much is your average monthly energy bill?',
      options: [
        { value: 'low', label: 'Less than $100' },
        { value: 'medium', label: '$100-$200' },
        { value: 'high', label: '$200-$300' },
        { value: 'very_high', label: 'Over $300' }
      ]
    }
  ];
  
  // Ensure we always have a valid question
  const currentQuestion = questions[currentQuestionIndex] || questions[0];
  
  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    
    // Save the answer
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
    
    // Track the answer
    trackComponentEvent('quiz_answer', {
      question_id: currentQuestion.id,
      answer: value,
      resource_id: resourceId,
      location: trackingLocation
    });
    
    // Move to next question or finish
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed
      trackComponentEvent('quiz_complete', {
        resource_id: resourceId,
        location: trackingLocation
      });
      
      // Navigate to the full energy audit form with pre-filled answers
      const queryParams = new URLSearchParams();
      Object.entries(answers).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      queryParams.append('source', 'education');
      queryParams.append('resource', resourceId);
      
      navigate(`/energy-audit?${queryParams.toString()}`);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Quick Energy Audit</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="mb-6">
            {currentQuestion && (
              <>
                <h4 className="text-lg font-medium mb-4">{currentQuestion.question}</h4>
                <div className="space-y-3">
                  {currentQuestion.options.map(option => (
                    <button
                      key={option.value}
                      className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition-colors"
                      onClick={() => handleAnswer(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyAuditQuizModal;