import { useState } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";

const questions = [
  {
    id: 1,
    question: "What's your primary goal with solar?",
    options: ["Lower electric bills", "Energy independence", "Environmental impact", "Increase property value"]
  },
  {
    id: 2,
    question: "What type of property do you have?",
    options: ["Single-family home", "Townhouse/Duplex", "Small apartment building", "Large commercial"]
  },
  {
    id: 3,
    question: "Which describes your roof best?",
    options: ["Newer roof with good sun exposure", "Older roof with good sun exposure", "Heavily shaded roof", "No suitable roof space"]
  }
];

const resultsMap: Record<string, { recommendation: string; description: string; details: string }> = {
  "Lower electric bills|Single-family home|Newer roof with good sun exposure": {
    recommendation: "Traditional rooftop solar panels",
    description: "Rooftop solar panels would provide the best ROI for your situation.",
    details: "With good sun exposure on a single-family home, traditional panels typically pay for themselves in 7-10 years while significantly reducing your electric bills."
  },
  "Energy independence|Single-family home|Newer roof with good sun exposure": {
    recommendation: "Solar + Battery Storage",
    description: "A rooftop solar system paired with battery storage would be ideal for your goals.",
    details: "Adding battery storage like Tesla Powerwall allows you to store excess energy for use during outages or peak pricing times, reducing grid dependence."
  },
  "Environmental impact|Single-family home|Newer roof with good sun exposure": {
    recommendation: "High-efficiency panels",
    description: "High-efficiency panels would maximize your environmental impact.",
    details: "Premium panels with higher efficiency ratings will generate more clean energy per square foot, maximizing your positive environmental impact."
  },
  "Lower electric bills|Single-family home|Heavily shaded roof": {
    recommendation: "Selective rooftop installation or community solar",
    description: "Consider installing panels only on unshaded roof sections or joining a community solar program.",
    details: "Shade significantly reduces solar panel efficiency. Focus on unshaded areas or consider community solar as an alternative."
  },
  "Lower electric bills|Single-family home|No suitable roof space": {
    recommendation: "Ground-mounted solar or community solar",
    description: "Consider ground-mounted solar arrays or community solar programs.",
    details: "Without suitable roof space, ground-mounted systems can be installed elsewhere on your property, or you can participate in a local community solar program."
  }
};

// Default result for combinations not explicitly mapped
const defaultResult = {
  recommendation: "Custom solar assessment",
  description: "Your situation may benefit from a professional assessment.",
  details: "Based on your specific needs and property characteristics, we recommend scheduling a free consultation with a solar professional to identify the best solution."
};

interface SolarQuizProps {
  onComplete?: (result: { recommendation: string; description: string; details: string }) => void;
}

export default function SolarQuiz({ onComplete }: SolarQuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showResult, setShowResult] = useState<{ recommendation: string; description: string; details: string } | null>(null);

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    
    // If not the last question, move to next
    if (questionId < questions.length) {
      setCurrentQuestion(questionId + 1);
    } else {
      // Generate result
      const key = `${answers[1]}|${answers[2]}|${answer}`;
      const result = resultsMap[key] || defaultResult;
      setShowResult(result);
      if (onComplete) {
        onComplete(result);
      }
    }
  };

  const resetQuiz = () => {
    setAnswers({});
    setCurrentQuestion(1);
    setShowResult(null);
  };

  const currentQ = questions.find(q => q.id === currentQuestion);

  return (
    <div className="my-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Solar Solution Finder Quiz</CardTitle>
          <p className="text-sm text-gray-600">Answer 3 questions to find your ideal solar solution.</p>
        </CardHeader>
        <CardContent>
          {!showResult ? (
            <>
              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((currentQuestion - 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question */}
              {currentQ && (
                <div key={currentQ.id} className="mb-6">
                  <p className="font-medium mb-3">{currentQ.question}</p>
                  <div className="flex flex-wrap gap-2">
                    {currentQ.options.map((option) => (
                      <Button
                        key={option}
                        variant={answers[currentQ.id] === option ? "default" : "outline"}
                        onClick={() => handleAnswer(currentQ.id, option)}
                        className="mb-2"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-2">
              {/* Results */}
              <div className="text-center mb-4">
                <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-1">Recommended: {showResult.recommendation}</h3>
                <p className="text-gray-600 mb-4">{showResult.description}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold mb-2">Why this works for you:</h4>
                <p>{showResult.details}</p>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={resetQuiz}>
                  Start Over
                </Button>
                <Button>Get A Free Consultation</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
