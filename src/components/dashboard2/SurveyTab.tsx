import React, { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';
import SurveyApiService from '@/services/surveyApiService';

interface Question {
  id: string;
  question: string;
  type: 'likert' | 'text' | 'multiple' | 'checkbox';
  options?: string[];
}

interface SurveySection {
  title: string;
  description: string;
  questions: Question[];
}

const PilotSurvey: React.FC = () => {
  usePageTracking('dashboard', { section: 'survey' });
  
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState('usability');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const surveyStartTime = useRef<number>(Date.now());
  
  const surveyData: Record<string, SurveySection> = {
    usability: {
      title: 'Usability Feedback',
      description: 'Help us understand how easy our platform is to use',
      questions: [
        {
          id: 'ui-intuitive',
          question: 'The user interface is intuitive and easy to navigate',
          type: 'likert'
        },
        {
          id: 'energy-audit-helpful',
          question: 'The DIY energy audit tool provides accurate and helpful recommendations',
          type: 'likert'
        },
        {
          id: 'ui-improvements',
          question: 'What aspects of the user interface could be improved?',
          type: 'text'
        }
      ]
    },
    features: {
      title: 'Feature Feedback',
      description: 'Tell us about your experience with specific features',
      questions: [
        {
          id: 'most-useful',
          question: 'Which features did you find most useful?',
          type: 'checkbox',
          options: [
            'Energy Audit Tool', 
            'Product Recommendations', 
            'Energy Usage Breakdown', 
            'Community Features',
            'Educational Resources'
          ]
        },
        {
          id: 'feature-improvements',
          question: 'What new features would you like to see added?',
          type: 'text'
        }
      ]
    },
    overall: {
      title: 'Overall Experience',
      description: 'Share your overall experience with our platform',
      questions: [
        {
          id: 'recommendation-likelihood',
          question: 'How likely are you to recommend our platform to others?',
          type: 'likert'
        },
        {
          id: 'overall-feedback',
          question: 'Please share any additional feedback or suggestions',
          type: 'text'
        }
      ]
    }
  };
  
  const handleInputChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  // Initialize the survey start time when component mounts
  useEffect(() => {
    surveyStartTime.current = Date.now();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Reset error state
    setSubmitError(null);
    setIsSubmitting(true);
    
    try {
      // Calculate completion time in seconds
      const completionTime = Math.floor((Date.now() - surveyStartTime.current) / 1000);
      
      // Submit response to backend
      const result = await SurveyApiService.submitSurveyResponse({
        responses,
        completionTime
      });
      
      if (result.success) {
        setSubmitted(true);
        // Clear responses for if user wants to submit another response
        setResponses({});
      } else {
        setSubmitError(result.message);
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case 'likert':
        return (
          <div className="mb-6" key={question.id}>
            <p className="mb-2 font-medium text-gray-700">{question.question}</p>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">Strongly Disagree</span>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map(value => (
                  <label key={value} className="flex flex-col items-center">
                    <input
                      type="radio"
                      name={question.id}
                      value={value}
                      checked={responses[question.id] === value}
                      onChange={() => handleInputChange(question.id, value)}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="mt-1 text-sm">{value}</span>
                  </label>
                ))}
              </div>
              <span className="text-sm text-gray-500">Strongly Agree</span>
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div className="mb-6" key={question.id}>
            <label className="block mb-2 font-medium text-gray-700">
              {question.question}
            </label>
            <textarea
              id={question.id}
              value={responses[question.id] || ''}
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        );
        
      case 'checkbox':
        return (
          <div className="mb-6" key={question.id}>
            <p className="mb-2 font-medium text-gray-700">{question.question}</p>
            <div className="space-y-2">
              {question.options?.map(option => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={responses[question.id]?.includes(option) || false}
                    onChange={(e) => {
                      const currentValues = responses[question.id] || [];
                      if (e.target.checked) {
                        handleInputChange(question.id, [...currentValues, option]);
                      } else {
                        handleInputChange(question.id, currentValues.filter((v: string) => v !== option));
                      }
                    }}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">{option}</span>
                </label>
              ))}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-blue-50 rounded-lg p-8 max-w-lg w-full">
          <svg
            className="mx-auto h-12 w-12 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Thank you for your feedback!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your responses have been recorded. We appreciate your participation in our pilot study.
          </p>
          <button
            type="button"
            className="mt-5 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            onClick={() => setSubmitted(false)}
          >
            Submit Another Response
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Pilot Study Feedback</h3>
        <p className="text-blue-700">
          Thank you for participating in our pilot study! Your feedback will help us improve the platform for everyone. 
          This survey should take approximately 5-10 minutes to complete.
        </p>
      </div>
      
      <Tabs defaultValue={activeSection} value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="usability" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Usability
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Features
          </TabsTrigger>
          <TabsTrigger value="overall" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Overall
          </TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          {Object.entries(surveyData).map(([sectionId, section]) => (
            <TabsContent key={sectionId} value={sectionId} className="mt-0">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                <p className="text-gray-600">{section.description}</p>
              </div>
              
              <div className="space-y-4">
                {section.questions.map(question => renderQuestion(question))}
              </div>
              
              <div className="mt-8 flex justify-between">
                {sectionId !== 'usability' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (sectionId === 'features') setActiveSection('usability');
                      if (sectionId === 'overall') setActiveSection('features');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
                
                {sectionId !== 'overall' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (sectionId === 'usability') setActiveSection('features');
                      if (sectionId === 'features') setActiveSection('overall');
                    }}
                    className="ml-auto px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Submit Feedback
                  </button>
                )}
              </div>
            </TabsContent>
          ))}
        </form>
      </Tabs>
    </div>
  );
};

export default PilotSurvey;
