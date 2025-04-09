// src/components/education/InteractivePoll.tsx
import React, { useState } from 'react';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';

// Export this interface for reuse in other components
export interface PollOption {
  id: string;
  label: string;
  icon?: string;
}

interface InteractivePollProps {
  question: string;
  options: PollOption[];
  resourceId: string;
  pollId: string;
}

const InteractivePoll: React.FC<InteractivePollProps> = ({
  question,
  options,
  resourceId,
  pollId
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  // For tracking
  const trackComponentEvent = useComponentTracking('education', 'InteractivePoll');
  
  const handleVote = () => {
    if (!selectedOption) return;
    
    // In a real implementation, we would save this to the backend
    setHasVoted(true);
    
    // Track the vote
    trackComponentEvent('poll_vote', {
      resourceId,
      pollId,
      optionId: selectedOption
    });
  };
  
  return (
    <div className="bg-green-50 border border-green-100 rounded-lg p-5 my-6">
      <h4 className="font-medium text-lg mb-3 text-gray-900">{question}</h4>
      
      <div className="space-y-2 mb-4">
        {options.map((option) => (
          <div 
            key={option.id}
            className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-green-100 transition-colors ${
              selectedOption === option.id ? 'bg-green-100 border border-green-200' : 'bg-white border border-gray-100'
            }`}
            onClick={() => !hasVoted && setSelectedOption(option.id)}
          >
            <input
              type="radio"
              id={option.id}
              name="poll-option"
              className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500"
              checked={selectedOption === option.id}
              onChange={() => !hasVoted && setSelectedOption(option.id)}
              disabled={hasVoted}
            />
            <label 
              htmlFor={option.id} 
              className={`flex-grow cursor-pointer ${hasVoted && selectedOption !== option.id ? 'text-gray-500' : 'text-gray-900'}`}
            >
              {option.label} {option.icon}
            </label>
            
            {hasVoted && (
              <span className="text-sm font-medium text-green-600">
                {selectedOption === option.id ? 'Your vote ✓' : ''}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <button
        onClick={handleVote}
        disabled={!selectedOption || hasVoted}
        className={`px-4 py-2 rounded-md font-medium text-sm ${
          !selectedOption || hasVoted
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {hasVoted ? 'Thank you for voting!' : 'Submit Vote'}
      </button>
      
      {hasVoted && (
        <p className="mt-3 text-sm text-gray-600">
          Thanks for sharing your preference! This helps us improve our content.
        </p>
      )}
    </div>
  );
};

export default InteractivePoll;
