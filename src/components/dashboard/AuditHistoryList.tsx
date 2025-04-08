import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuditHistoryEntry } from '@/types/report';
import { Calendar, FileText, ChevronRight } from 'lucide-react';
import { formatDate } from '@/utils/formatting';

interface AuditHistoryListProps {
  audits: AuditHistoryEntry[];
  isLoading: boolean;
}

/**
 * Component for displaying a list of previous energy audits
 */
const AuditHistoryList: React.FC<AuditHistoryListProps> = ({ audits, isLoading }) => {
  const navigate = useNavigate();
  
  // Loading skeleton state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }
  
  // Empty state
  if (audits.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 italic">
        No audit history available yet. Complete an energy audit to see it here.
      </div>
    );
  }
  
  // Format date utility function if formatting.ts doesn't have this function
  const formatAuditDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDate ? formatDate(date) : date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-4">
      {audits.map((audit) => (
        <div
          key={audit.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer bg-white"
          onClick={() => navigate(`/reports/${audit.id}`)}
          data-testid="audit-history-item"
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatAuditDate(audit.date)}</span>
              </div>
              <div className="font-medium">{audit.title || 'Energy Audit'}</div>
              <div className="text-sm text-gray-600">{audit.address || 'Address not provided'}</div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="h-4 w-4 mr-1" />
                <span>{audit.recommendations} {audit.recommendations === 1 ? 'Recommendation' : 'Recommendations'}</span>
              </div>
            </div>
            <div className="flex items-center text-green-600 font-medium">
              <span className="hidden sm:inline mr-1">View</span>
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AuditHistoryList;
