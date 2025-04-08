import React, { useState } from 'react';
import { API_ENDPOINTS } from '@/config/api';
import { formatCurrency } from '@/utils/formatting';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'implemented';
  estimatedSavings: number;
  actualSavings: number | null;
  implementationDate: string | null;
  implementationCost: number | null;
  lastUpdate: string;
}

interface SavingsUpdateForm {
  actualSavings: number;
  implementationCost?: number;
  notes?: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  onUpdate: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSavingsDialog, setShowSavingsDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingsForm, setSavingsForm] = useState<SavingsUpdateForm>({
    actualSavings: recommendation.actualSavings || 0,
    implementationCost: recommendation.implementationCost || undefined
  });

  const handleStatusUpdate = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_STATUS(recommendation.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        },
        body: JSON.stringify({
          status: 'implemented',
          implementationDate: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      onUpdate();
      setShowSavingsDialog(true);
    } catch (error) {
      setError('Failed to update recommendation status');
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavingsUpdate = async () => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(API_ENDPOINTS.RECOMMENDATIONS.UPDATE_SAVINGS(recommendation.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        },
        body: JSON.stringify({
          ...savingsForm,
          month: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update savings');
      }

      onUpdate();
      setShowSavingsDialog(false);
    } catch (error) {
      setError('Failed to update savings information');
      console.error('Error updating savings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0">
        <div className="flex-grow">
          <h3 className="text-lg font-medium text-gray-900">{recommendation.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{recommendation.description}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <span className="text-blue-600 whitespace-nowrap">
              Estimated: {formatCurrency(recommendation.estimatedSavings)}
            </span>
            <span className="text-green-600 whitespace-nowrap">
              Actual: {formatCurrency(recommendation.actualSavings, "$0")}
            </span>
            <span className="text-gray-500 whitespace-nowrap">
              Cost: {formatCurrency(recommendation.implementationCost, "$0")}
            </span>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
        <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start w-full sm:w-auto space-y-0 sm:space-y-2 space-x-2 sm:space-x-0">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            recommendation.priority === 'high' ? 'bg-red-100 text-red-800' :
            recommendation.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {recommendation.priority} priority
          </span>
          <div className="flex items-center space-x-2">
            {recommendation.status === 'active' ? (
              <Button
                size="sm"
                onClick={handleStatusUpdate}
                disabled={isUpdating}
                className="flex items-center justify-center space-x-1 w-full sm:w-auto text-xs sm:text-sm"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span>Mark Implemented</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSavingsDialog(true)}
                disabled={isUpdating}
                className="flex items-center justify-center space-x-1 w-full sm:w-auto text-xs sm:text-sm"
              >
                <DollarSign className="h-4 w-4" />
                <span>Update Savings</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog 
        isOpen={showSavingsDialog} 
        onClose={() => setShowSavingsDialog(false)}
        title="Update Savings Information"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Savings Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Actual Monthly Savings ($)
              </label>
              <input
                type="number"
                value={savingsForm.actualSavings}
                onChange={(e) => setSavingsForm({
                  ...savingsForm,
                  actualSavings: parseFloat(e.target.value) || 0
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Implementation Cost ($)
              </label>
              <input
                type="number"
                value={savingsForm.implementationCost || ''}
                onChange={(e) => setSavingsForm({
                  ...savingsForm,
                  implementationCost: parseFloat(e.target.value) || undefined
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={savingsForm.notes || ''}
                onChange={(e) => setSavingsForm({
                  ...savingsForm,
                  notes: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSavingsDialog(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavingsUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecommendationCard;
