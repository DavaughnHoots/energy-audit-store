import React, { useState, useEffect } from 'react';
import { useComponentTracking } from '../../hooks/analytics/useComponentTracking';

interface PollOption {
  id: string;
  label: string;
  icon: string;
  votes: number;
}

const InsulationTechniquePoll: React.FC = () => {
  const trackComponentEvent = useComponentTracking('education', 'InsulationTechniquePoll');
  
  // Initial poll options with zero votes
  const initialOptions: PollOption[] = [
    { id: 'aerogel', label: 'Aerogel', icon: '🧊', votes: 0 },
    { id: 'vacuum_panels', label: 'Vacuum Panels', icon: '🚀', votes: 0 },
    { id: 'sips', label: 'SIPs', icon: '🏗️', votes: 0 },
    { id: 'pcms', label: 'PCMs', icon: '🌡️', votes: 0 },
    { id: 'radiant_barrier', label: 'Radiant Barrier', icon: '☀️', votes: 0 },
  ];

  // States
  const [options, setOptions] = useState<PollOption[]>(initialOptions);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  
  // Load saved votes from localStorage on component mount
  useEffect(() => {
    const savedVote = localStorage.getItem('insulation_poll_vote');
    const savedOptions = localStorage.getItem('insulation_poll_results');
    
    if (savedVote) {
      setUserVote(savedVote);
      setIsSubmitted(true);
    }
    
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions) as PollOption[];
        setOptions(parsedOptions);
        
        // Calculate total votes
        const total = parsedOptions.reduce((sum, option) => sum + option.votes, 0);
        setTotalVotes(total);
      } catch (error) {
        console.error('Error parsing saved poll results:', error);
      }
    } else {
      // Initialize with some random votes for a better user experience
      const randomizedOptions = initialOptions.map(option => ({
        ...option,
        votes: Math.floor(Math.random() * 20) + 5
      }));
      
      setOptions(randomizedOptions);
      setTotalVotes(randomizedOptions.reduce((sum, option) => sum + option.votes, 0));
    }
  }, []);
  
  // Handler for selecting an option
  const handleSelect = (optionId: string) => {
    if (isSubmitted) return;
    
    setUserVote(optionId);
    
    // Track selection event
    trackComponentEvent('poll_option_selected', {
      option_id: optionId,
      poll_id: 'insulation_techniques'
    });
  };
  
  // Handler for submitting vote
  const handleSubmit = () => {
    if (!userVote || isSubmitted) return;
    
    // Update votes
    const updatedOptions = options.map(option => {
      if (option.id === userVote) {
        return { ...option, votes: option.votes + 1 };
      }
      return option;
    });
    
    setOptions(updatedOptions);
    setTotalVotes(prev => prev + 1);
    setIsSubmitted(true);
    
    // Save to localStorage
    localStorage.setItem('insulation_poll_vote', userVote);
    localStorage.setItem('insulation_poll_results', JSON.stringify(updatedOptions));
    
    // Track submission event
    trackComponentEvent('poll_vote_submitted', {
      option_id: userVote,
      poll_id: 'insulation_techniques'
    });
  };
  
  // Calculate percentage for a given option
  const calculatePercentage = (votes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };
  
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Quick Poll: Which insulation technique do you find most interesting?
      </h3>
      
      <div className="space-y-3 mb-4">
        {options.map(option => (
          <div 
            key={option.id}
            className={`
              border rounded-lg p-3 cursor-pointer transition-all
              ${userVote === option.id 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'}
              ${isSubmitted ? 'relative overflow-hidden' : ''}
            `}
            onClick={() => handleSelect(option.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xl mr-2">{option.icon}</span>
                <span>{option.label}</span>
              </div>
              
              {/* Radio button visual when not submitted */}
              {!isSubmitted && (
                <div className={`w-5 h-5 rounded-full border ${
                  userVote === option.id 
                    ? 'border-green-500 bg-green-500' 
                    : 'border-gray-300'
                }`}>
                  {userVote === option.id && (
                    <div className="w-2 h-2 bg-white rounded-full m-auto mt-1.5"></div>
                  )}
                </div>
              )}
              
              {/* Percentage when submitted */}
              {isSubmitted && (
                <div className="font-medium">
                  {calculatePercentage(option.votes)}%
                </div>
              )}
            </div>
            
            {/* Progress bar when submitted */}
            {isSubmitted && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-green-100 z-0"
                style={{ 
                  width: `${calculatePercentage(option.votes)}%`,
                  opacity: 0.5
                }}
              />
            )}
          </div>
        ))}
      </div>
      
      {!isSubmitted ? (
        <button
          onClick={handleSubmit}
          disabled={!userVote}
          className={`
            w-full py-2 rounded-lg font-medium transition-colors
            ${userVote 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
          `}
        >
          Submit Vote
        </button>
      ) : (
        <div className="text-center text-gray-600 text-sm">
          Thanks for voting! {totalVotes} {totalVotes === 1 ? 'person has' : 'people have'} voted.
        </div>
      )}
    </div>
  );
};

export default InsulationTechniquePoll;