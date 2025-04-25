import React, { useState } from 'react';
// Mock implementation of useComponentTracking hook
const useComponentTracking = (section: string, component: string) => {
  return (event: string, data?: any) => {
    console.log(`Analytics: ${section}.${component} - ${event}`, data);
    // In a real implementation, this would send analytics data
  };
};
import { HelpCircle, Check, X, Share2 } from 'lucide-react';
// Mock Button component
const Button = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'default',
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: string;
  type?: 'button' | 'submit' | 'reset';
}) => (
  <button
    type={type}
    className={`px-4 py-2 rounded-md font-medium ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const WinterEnergyQuiz: React.FC = () => {
  const trackComponentEvent = useComponentTracking('education', 'WinterEnergyQuiz');
  
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Quiz questions
  const questions: QuizQuestion[] = [
    {
      question: 'What temperature setting is recommended for your thermostat during winter when you are home?',
      options: ['72°F or higher', '70°F', '68°F', '65°F or lower'],
      correctAnswer: 2,
      explanation: 'The Department of Energy recommends setting your thermostat to 68°F when you\'re at home in the winter to save energy. Every degree above 68°F can increase your heating costs by 3-5%.'
    },
    {
      question: 'Which of these is NOT an effective way to reduce heating costs in winter?',
      options: [
        'Opening curtains on south-facing windows during the day',
        'Using space heaters in every room of the house',
        'Reversing ceiling fans to clockwise rotation',
        'Adding weatherstripping to doors and windows'
      ],
      correctAnswer: 1,
      explanation: 'Using space heaters in every room is inefficient. While space heaters are useful for heating small areas, they use a lot of electricity and are not cost-effective for heating entire homes.'
    },
    {
      question: 'What is the ideal humidity level for your home during winter?',
      options: ['10-20%', '20-30%', '30-40%', '40-50%'],
      correctAnswer: 3,
      explanation: 'The ideal winter humidity is 40-50%. Proper humidity makes the air feel warmer at lower temperatures, reducing the need to turn up the heat. Too low humidity causes dry skin and respiratory issues, while too high can lead to condensation and mold.'
    },
    {
      question: 'Which of these areas typically loses the most heat in a home during winter?',
      options: ['Floors', 'Walls', 'Windows', 'Doors'],
      correctAnswer: 2,
      explanation: 'Windows typically account for 25-30% of heat loss in homes. Even double-pane windows have lower insulation values than walls, making them a primary source of heat loss during winter months.'
    },
    {
      question: 'How often should you replace or clean your furnace filter during the heating season?',
      options: [
        'Once per year is sufficient',
        'Every 1-3 months depending on type',
        'Only when the furnace stops working efficiently',
        'Every 6 months'
      ],
      correctAnswer: 1,
      explanation: 'Furnace filters should be checked every month during the heating season and replaced or cleaned every 1-3 months depending on the type. Dirty filters restrict airflow, reduce efficiency, and increase energy costs.'
    }
  ];

  const startQuiz = () => {
    trackComponentEvent('start_quiz');
    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newSelectedAnswers = [...selectedAnswers];
    newSelectedAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newSelectedAnswers);
    setShowExplanation(true);
    
    trackComponentEvent('select_answer', {
      questionIndex: currentQuestion,
      selectedAnswer: answerIndex,
      correct: answerIndex === questions[currentQuestion].correctAnswer
    });
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
      trackComponentEvent('finish_quiz', { score: calculateScore() });
    }
  };

  const calculateScore = () => {
    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (selectedAnswers[i] === questions[i].correctAnswer) {
        score++;
      }
    }
    return score;
  };

  const getScoreMessage = () => {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;
    
    if (percentage >= 80) {
      return "Excellent! You're a winter energy efficiency expert!";
    } else if (percentage >= 60) {
      return "Good job! You know quite a bit about winter energy efficiency.";
    } else if (percentage >= 40) {
      return "Not bad! You have some knowledge about winter energy efficiency.";
    } else {
      return "You could use some more information about winter energy efficiency.";
    }
  };

  // Get personalized recommendations based on incorrect answers
  const getPersonalizedRecommendations = () => {
    const incorrectAnswers = [];
    for (let i = 0; i < questions.length; i++) {
      if (selectedAnswers[i] !== questions[i].correctAnswer) {
        incorrectAnswers.push(i);
      }
    }

    const recommendations = [];
    
    // Add specific recommendations based on which questions were missed
    if (incorrectAnswers.includes(0)) { // Thermostat question
      recommendations.push('Consider installing a programmable thermostat to automatically set your temperature to 68°F when home and lower when away or sleeping');
    }
    
    if (incorrectAnswers.includes(1)) { // Space heater question
      recommendations.push('Instead of space heaters, focus on zone heating by closing doors to unused rooms and using the central heating system efficiently');
    }
    
    if (incorrectAnswers.includes(2)) { // Humidity question
      recommendations.push('Use a humidifier during winter to maintain 40-50% humidity, which makes air feel warmer and reduces heating needs');
    }
    
    if (incorrectAnswers.includes(3)) { // Heat loss question
      recommendations.push('Invest in window treatments like thermal curtains, cellular shades, or window insulation film to reduce heat loss');
    }
    
    if (incorrectAnswers.includes(4)) { // Furnace filter question
      recommendations.push('Set a monthly reminder to check your furnace filter during heating season; clean or replace it as needed');
    }
    
    // If all answers were correct, give general recommendations
    if (incorrectAnswers.length === 0) {
      recommendations.push('Great job! Continue practicing these winter energy efficiency strategies to maximize your savings');
      recommendations.push('Consider getting a professional energy audit to identify additional savings opportunities specific to your home');
    }
    
    return recommendations;
  };

  const shareResults = () => {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;
    let emoji = '❄️';
    
    if (percentage >= 80) emoji = '🏆';
    else if (percentage >= 60) emoji = '👍';
    else if (percentage >= 40) emoji = '👌';
    else emoji = '📚';
    
    const shareText = `${emoji} I scored ${score}/${questions.length} (${percentage}%) on the Winter Energy Efficiency Quiz! Test your knowledge too!`;
    
    trackComponentEvent('share_results', { score, percentage });
    alert(`In production, this would share:
${shareText}

Along with a link to the quiz.`);
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4 my-6 shadow-sm">
      <div className="flex items-center mb-4">
        <HelpCircle className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Winter Energy Efficiency Quiz</h3>
      </div>

      {!quizStarted ? (
        <div className="text-center py-8">
          <h4 className="text-xl font-medium mb-4">Test Your Winter Energy Knowledge</h4>
          <p className="mb-6 text-gray-600">Take this quick 5-question quiz to test your knowledge about winter energy efficiency and learn some valuable tips along the way!</p>
          <div className="max-w-md mx-auto bg-blue-100 rounded-lg p-4 mb-6 text-left">
            <h5 className="font-medium mb-2 text-blue-800">Why Take This Quiz?</h5>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Learn practical winter energy-saving tips</li>
              <li>Get personalized recommendations</li>
              <li>Reduce your winter heating costs</li>
              <li>Improve your home's comfort level</li>
            </ul>
          </div>
          <Button 
            onClick={startQuiz}
            className="bg-blue-600 hover:bg-blue-700 px-8 text-white"
          >
            Start Quiz
          </Button>
        </div>
      ) : !showResults ? (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
            <span className="text-sm font-medium text-blue-600">{calculateScore()} correct so far</span>
          </div>
          
          <h4 className="text-lg font-medium mb-4">{questions[currentQuestion].question}</h4>
          
          <div className="space-y-3 mb-6">
            {questions[currentQuestion].options.map((option, index) => (
              <div 
                key={index}
                className={`p-3 border rounded-lg cursor-pointer flex items-center ${selectedAnswers[currentQuestion] === index ? 
                  (index === questions[currentQuestion].correctAnswer ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300') :
                  'hover:bg-gray-50 border-gray-200'}`}
                onClick={() => selectedAnswers[currentQuestion] === undefined && handleAnswerSelect(index)}
              >
                <div className="flex-1">{option}</div>
                {selectedAnswers[currentQuestion] === index && (
                  index === questions[currentQuestion].correctAnswer ? 
                    <Check className="w-5 h-5 text-green-500" /> : 
                    <X className="w-5 h-5 text-red-500" />
                )}
              </div>
            ))}
          </div>
          
          {showExplanation && (
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm">
                <span className="font-medium">Explanation: </span>
                {questions[currentQuestion].explanation}
              </p>
            </div>
          )}
          
          {selectedAnswers[currentQuestion] !== undefined && (
            <Button 
              onClick={handleNextQuestion}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'View Results'}
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg p-4 shadow-sm text-center">
          <h4 className="text-xl font-medium mb-2">Quiz Results</h4>
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {calculateScore()}/{questions.length}
          </div>
          <p className="text-lg mb-6">{getScoreMessage()}</p>
          
          <div className="mb-6 px-4">
            <h5 className="font-medium mb-3 text-left">Your answers:</h5>
            {questions.map((question, index) => (
              <div key={index} className="flex items-start mb-2 text-left">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 mr-2 ${selectedAnswers[index] === question.correctAnswer ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {selectedAnswers[index] === question.correctAnswer ? 
                    <Check className="w-4 h-4" /> : 
                    <X className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{question.question}</p>
                  <p className="text-xs text-gray-500">
                    Your answer: {question.options[selectedAnswers[index]]}<br/>
                    Correct answer: {question.options[question.correctAnswer]}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {calculateScore() >= 4 && (
            <div className="mb-6 p-4 border border-green-300 rounded-lg bg-green-50 text-center">
              <p className="text-lg font-medium text-green-800 mb-1">Congratulations! 🎉</p>
              <p className="text-sm text-green-700">You've earned the Winter Energy Expert badge!</p>
              <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto my-3 flex items-center justify-center text-white text-3xl shadow-md">
                {calculateScore()}/{questions.length}
              </div>
            </div>
          )}
            
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <Button 
              onClick={startQuiz}
              variant="outline"
              className="flex-1"
            >
              Retake Quiz
            </Button>
            <Button 
              onClick={shareResults}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
          </div>
          
          <div className="mt-6 text-sm border-t pt-4">
            <h5 className="font-medium mb-2">Your Personalized Recommendations:</h5>
            <ul className="text-left space-y-1 pl-5 list-disc">
              {getPersonalizedRecommendations().map((recommendation, index) => (
                <li key={index} className="text-blue-800">{recommendation}</li>
              ))}
            </ul>
            
            <div className="mt-4 pt-4 border-t">
              <h5 className="font-medium mb-2">General Winter Energy Saving Tips:</h5>
              <ul className="text-left space-y-1 pl-5 list-disc">
                <li>Set your thermostat to 68°F during the day and lower at night</li>
                <li>Reverse ceiling fans to clockwise rotation to push warm air down</li>
                <li>Maintain 40-50% humidity for optimal comfort</li>
                <li>Address window heat loss with thermal curtains or plastic film</li>
                <li>Change furnace filters every 1-3 months during heating season</li>
              </ul>
            </div>
            
            <div className="mt-4 bg-green-50 p-3 rounded-lg">
              <p className="font-medium text-green-800">Potential Savings:</p>
              <p className="text-sm text-green-700">Implementing these recommendations could save you 10-30% on your winter heating costs!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WinterEnergyQuiz;