import React from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/button';

export interface SolarCalculatorResult {
  systemSize: number;
  annualProduction: number;
  monthlySavings: number;
  co2Reduction: number;
  paybackPeriod: number;
}

export interface SolarQuizResult {
  recommendation: string;
  description: string;
  details: string;
}

export type ResultType = 'solar-calculator' | 'solar-quiz' | 'insulation-quiz';

interface ResultsSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartAudit: () => void;
  resultType: ResultType;
  result: SolarCalculatorResult | SolarQuizResult | any;
}

const ResultsSummaryModal: React.FC<ResultsSummaryModalProps> = ({
  open,
  onOpenChange,
  onStartAudit,
  resultType,
  result
}) => {
  // Generate heading based on result type
  const getHeading = () => {
    switch (resultType) {
      case 'solar-calculator':
        return 'Your Solar Potential Results';
      case 'solar-quiz':
        return 'Your Solar Recommendation';
      case 'insulation-quiz':
        return 'Your Insulation Recommendation';
      default:
        return 'Your Results';
    }
  };

  // Generate content based on result type
  const getContent = () => {
    switch (resultType) {
      case 'solar-calculator': {
        const calcResult = result as SolarCalculatorResult;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold">System Size</h4>
                <p className="text-2xl font-bold text-blue-700">{calcResult.systemSize} kW</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-semibold">Annual Production</h4>
                <p className="text-2xl font-bold text-green-700">{calcResult.annualProduction.toLocaleString()} kWh</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="font-semibold">Monthly Savings</h4>
                <p className="text-2xl font-bold text-yellow-700">${calcResult.monthlySavings}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <h4 className="font-semibold">Payback Period</h4>
                <p className="text-2xl font-bold text-purple-700">{calcResult.paybackPeriod} years</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-2">
              <h3 className="font-bold text-xl mb-2">What's Next?</h3>
              <p className="mb-2">
                These calculations show your potential solar benefits based on the information you provided.
              </p>
              <p className="mb-2">
                To get a complete picture of your home's energy profile and maximize your savings, we recommend 
                completing a full energy audit.
              </p>
              <p>
                An energy audit will help you understand how solar integrates with your other home systems and 
                identify additional opportunities for energy savings.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-1">During the audit, pay special attention to:</h4>
              <ul className="list-disc pl-5">
                <li>Energy usage patterns and timing</li>
                <li>Roof condition assessment</li>
                <li>Electrical system compatibility</li>
                <li>Additional energy efficiency opportunities</li>
              </ul>
            </div>
          </div>
        );
      }
      
      case 'solar-quiz': {
        const quizResult = result as SolarQuizResult;
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-2">Your Recommended Solution:</h3>
              <p className="text-2xl font-bold text-green-700 mb-2">{quizResult.recommendation}</p>
              <p className="text-gray-700">{quizResult.description}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-1">Why this works for you:</h4>
              <p>{quizResult.details}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-2">What's Next?</h3>
              <p className="mb-2">
                Based on your answers, {quizResult.recommendation} appears to be the best match for your situation.
              </p>
              <p className="mb-2">
                A full energy audit will help you understand how this solar solution fits into your overall 
                energy picture, including potential savings on your utility bills.
              </p>
              <p>
                The audit will provide detailed recommendations customized to your home's specific needs and 
                your energy goals.
              </p>
            </div>
          </div>
        );
      }
      
      case 'insulation-quiz': {
        const quizResult = result as SolarQuizResult;
        return (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-2">Your Recommended Solution:</h3>
              <p className="text-2xl font-bold text-green-700 mb-2">{quizResult.recommendation}</p>
              <p className="text-gray-700">{quizResult.description}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-semibold mb-1">Why this works for you:</h4>
              <p>{quizResult.details}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-xl mb-2">What's Next?</h3>
              <p className="mb-2">
                Based on your answers, {quizResult.recommendation} appears to be the best match for your situation.
              </p>
              <p className="mb-2">
                A full energy audit will help you understand how this insulation solution fits into your overall 
                energy picture, including potential savings on your utility bills.
              </p>
              <p>
                The audit will provide detailed recommendations customized to your home's specific needs and 
                your energy goals.
              </p>
            </div>
          </div>
        );
      }
      
      default:
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>Thank you for completing this interactive exercise. To get a full assessment of your home's energy profile, 
               we recommend completing a comprehensive energy audit.</p>
          </div>
        );
    }
  };

  // Handle starting the audit
  const handleStartAudit = () => {
    onOpenChange(false);
    onStartAudit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{getHeading()}</DialogTitle>
      </DialogHeader>
      <DialogContent className="max-w-2xl">
        <div className="py-2">
          {getContent()}
          
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Return to Education
            </Button>
            <Button onClick={handleStartAudit} className="bg-green-600 hover:bg-green-700">
              Start Full Energy Audit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsSummaryModal;
