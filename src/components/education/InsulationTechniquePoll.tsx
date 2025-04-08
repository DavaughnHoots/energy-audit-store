import React, { useState } from "react";
import { useComponentTracking } from "../../hooks/analytics/useComponentTracking";

const InsulationTechniquePoll: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const trackComponentEvent = useComponentTracking(
    "education",
    "InsulationTechniquePoll"
  );

  const options = [
    { id: "aerogel", label: "Aerogel 🧊", votes: 32 },
    { id: "vips", label: "Vacuum Panels 🚀", votes: 41 },
    { id: "sips", label: "SIPs 🏗️", votes: 28 },
    { id: "pcms", label: "PCMs 🌡️", votes: 19 },
    { id: "radiant", label: "Radiant Barrier ☀️", votes: 35 },
  ];

  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0) + (hasVoted ? 1 : 0);

  const handleVote = () => {
    if (selectedOption && !hasVoted) {
      setHasVoted(true);
      trackComponentEvent("insulation_poll_vote", {
        selected_option: selectedOption,
      });
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <h3 className="font-semibold text-gray-800 mb-3">
        Quick Poll: Which insulation technique do you find most interesting?
      </h3>
      <div className="space-y-3 mb-4">
        {options.map((option) => {
          const voteCount = option.votes + (hasVoted && selectedOption === option.id ? 1 : 0);
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          
          return (
            <div key={option.id}>
              <div className="flex items-center mb-1">
                <input
                  type="radio"
                  id={option.id}
                  name="insulation-poll"
                  disabled={hasVoted}
                  checked={selectedOption === option.id}
                  onChange={() => setSelectedOption(option.id)}
                  className="mr-2"
                />
                <label htmlFor={option.id} className="cursor-pointer">
                  {option.label}
                </label>
              </div>
              
              {hasVoted && (
                <div className="mt-1">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {voteCount} votes ({percentage}%)
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {!hasVoted ? (
        <button
          onClick={handleVote}
          disabled={!selectedOption}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
        >
          Submit Vote
        </button>
      ) : (
        <div className="text-sm text-gray-700">
          Thanks for voting! {totalVotes} people have participated in this poll.
        </div>
      )}
    </div>
  );
};

export default InsulationTechniquePoll;
