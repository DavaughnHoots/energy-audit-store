import React from 'react';
import { InfoIcon } from 'lucide-react';

/**
 * DataExplanationNote component
 * 
 * Displays contextual information about the data source when there's a discrepancy
 * between the summary stats and the detailed visualization data
 */
interface DataExplanationNoteProps {
  aggregateCount: number;
  hasDetailedData: boolean;
  isUsingDefaultData?: boolean;
  dataSource?: 'detailed' | 'generated' | 'empty';
}

const DataExplanationNote: React.FC<DataExplanationNoteProps> = ({
  aggregateCount,
  hasDetailedData,
  isUsingDefaultData = false,
  dataSource = 'empty'
}) => {
  // Only show the note when there's a discrepancy
  if (aggregateCount === 0 || (hasDetailedData && !isUsingDefaultData)) {
    return null;
  }

  let message = '';
  let severity: 'info' | 'warning' = 'info';
  let bgColor = 'bg-blue-50';
  let textColor = 'text-blue-800';
  let borderColor = 'border-blue-200';

  if (aggregateCount > 0 && !hasDetailedData) {
    severity = 'warning';
    bgColor = 'bg-yellow-50';
    textColor = 'text-yellow-800';
    borderColor = 'border-yellow-200';
    message = `Your account has ${aggregateCount} total records, but detailed visualization data is not available for this view.`;
  } else if (isUsingDefaultData) {
    severity = 'info';
    message = `Showing sample data based on typical patterns. Complete a detailed energy audit to see your specific data.`;
  }

  return (
    <div className={`${bgColor} border ${borderColor} rounded-md p-3 text-sm ${textColor} mb-4`}>
      <div className="flex items-start space-x-2">
        <InfoIcon className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p>
            <strong>Note:</strong> {message}
          </p>
          {dataSource === 'generated' && (
            <p className="mt-1">
              Sample visualizations are shown to help you understand potential insights.
              For personalized analysis, please generate an interactive report.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataExplanationNote;
