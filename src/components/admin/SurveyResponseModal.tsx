import React, { useEffect, useState } from 'react';
import SurveyApiService from '../../services/surveyApiService';

interface SurveyResponseModalProps {
  responseId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

// Map for question display names to make the modal more user-friendly
const questionDisplayNames: Record<string, string> = {
  'ui-intuitive': 'The user interface is intuitive and easy to navigate',
  'energy-audit-helpful': 'The DIY energy audit tool provides accurate and helpful recommendations',
  'ui-improvements': 'What aspects of the user interface could be improved?',
  'most-useful': 'Which features did you find most useful?',
  'feature-improvements': 'What new features would you like to see added?',
  'recommendation-likelihood': 'How likely are you to recommend our platform to others?',
  'overall-feedback': 'Please share any additional feedback or suggestions'
};

const SurveyResponseModal: React.FC<SurveyResponseModalProps> = ({ responseId, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('usability');
  
  useEffect(() => {
    if (isOpen && responseId) {
      // Fetch response details
      setIsLoading(true);
      setError(null);
      
      SurveyApiService.getResponseById(responseId)
        .then(data => {
          setResponse(data);
          
          // Set active tab to the first section that has answers
          if (data.answers && data.answers.length > 0 && data.answers[0]?.question_section) {
            const firstSection = data.answers[0].question_section;
            setActiveTab(firstSection);
          }
        })
        .catch(err => setError(typeof err === 'string' ? err : err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, responseId]);
  
  if (!isOpen) return null;
  
  // Get the set of available tabs from the response data
  const availableTabs = response?.answers 
    ? [...new Set(response.answers.map((a: any) => a.question_section))] as string[]
    : [];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-xl font-bold">Survey Response Details</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading response data...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded">
              <p className="font-medium">Error loading response</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : response ? (
            <>
              <div className="mb-4 text-sm text-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p><span className="font-medium">Response ID:</span> {response.id}</p>
                    <p><span className="font-medium">Submitted:</span> {new Date(response.submission_date).toLocaleString()}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">User:</span> {response.user_id || 'Anonymous'}</p>
                    <p><span className="font-medium">Completion Time:</span> {response.completion_time_seconds ? `${response.completion_time_seconds} seconds` : 'Not recorded'}</p>
                  </div>
                </div>
              </div>
              
              {/* Tabs navigation */}
              {availableTabs.length > 0 && (
                <div className="border-b mb-4">
                  <nav className="flex space-x-8">
                    {availableTabs.map(section => (
                      <button 
                        key={section}
                        className={`pb-2 px-1 ${activeTab === section ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                        onClick={() => setActiveTab(section)}
                      >
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </button>
                    ))}
                  </nav>
                </div>
              )}
              
              {/* Tab content */}
              <div className="space-y-6">
                {response.answers
                  .filter((answer: any) => answer.question_section === activeTab)
                  .map((answer: any) => (
                    <div key={answer.question_id} className="border-b pb-4">
                      <p className="font-medium mb-2">
                        {questionDisplayNames[answer.question_id] || answer.question_id}
                      </p>
                      
                      {/* Different answer types */}
                      {answer.question_type === 'likert' && (
                        <div className="flex items-center">
                          <span className="text-lg font-bold mr-2">{answer.likert_value}</span>
                          <div className="flex text-yellow-400">
                            {/* Stars based on rating */}
                            {[...Array(5)].map((_, i) => (
                              <span key={i}>{i < answer.likert_value ? '★' : '☆'}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {answer.question_type === 'text' && (
                        <p className="text-gray-700">{answer.text_value || "(No response)"}</p>
                      )}
                      
                      {answer.question_type === 'checkbox' && (
                        <ul className="list-disc list-inside">
                          {answer.checkbox_values?.map((option: string, i: number) => (
                            <li key={i} className="text-gray-700">{option}</li>
                          )) || "(No options selected)"}
                        </ul>
                      )}
                    </div>
                  ))}
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button 
                  onClick={onClose} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No response data available.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyResponseModal;
