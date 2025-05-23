import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import { Download, Loader2, AlertCircle, BarChart2 } from 'lucide-react';
import { fetchAuditHistory } from '@/services/reportService';
import { AuditHistoryEntry } from '@/types/report';
import AuditHistoryList from './AuditHistoryList';
import Pagination from '@/components/common/Pagination';

interface ReportsTabProps {
  auditId: string | null;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ auditId }) => {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  
  // Audit history state
  const [audits, setAudits] = useState<AuditHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Helper function to validate audit ID
  const isValidAuditId = (id: string | null): boolean => {
    // Check if the id is not null/undefined and is not a "null" or "undefined" string
    return id !== null && id !== "null" && id !== undefined && id !== "undefined" && id !== "";
  };

  // Fetch audit history when component mounts or page changes
  useEffect(() => {
    const loadAuditHistory = async () => {
      setIsLoadingHistory(true);
      setHistoryError(null);
      
      try {
        const data = await fetchAuditHistory(currentPage, 5);
        setAudits(data.audits);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error('Failed to load audit history:', error);
        setHistoryError('Unable to load audit history. Please try again later.');
        setAudits([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadAuditHistory();
  }, [currentPage]);

  const handleDownloadReport = async () => {
    if (!isValidAuditId(auditId)) {
      setError(
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Audit Available</h2>
          <p className="text-gray-600 mb-4">
            There is no audit available to generate a report. Please complete an energy audit first.
          </p>
          <button
            onClick={() => window.location.href = '/energy-audit'}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Start New Audit
          </button>
        </div>
      );
      return;
    }
    
    setIsGenerating(true);
    try {
      // We already validated the audit ID is valid
      const validAuditId = auditId;
      
      // Use the full URL with the API_BASE_URL to ensure cookies are sent to the correct domain
      const { API_BASE_URL } = await import('@/config/api');
      const reportUrl = `${API_BASE_URL}${API_ENDPOINTS.ENERGY_AUDIT}/${validAuditId}/report`;
      
      console.log('Fetching report from:', reportUrl);
      
      const response = await fetch(reportUrl, {
        method: 'GET',
        credentials: 'include', // This ensures cookies are sent with the request
        headers: {
          'Content-Type': 'application/json'
          // Let the browser handle sending the cookies automatically
        }
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `energy-audit-report-${validAuditId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Report Generation Failed</h2>
          <p className="text-gray-600 mb-4">
            We were unable to generate your report. Please try again.
          </p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Dismiss
          </button>
        </div>
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error ? (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {error}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Energy Audit Reports</h2>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Generate and download comprehensive reports based on your energy audits. These reports include detailed analysis, 
              recommendations, and potential savings information.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 mb-6">
              <h3 className="font-medium mb-2">Report Contents</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Executive summary of energy usage</li>
                <li>Detailed analysis of current conditions</li>
                <li>Prioritized improvement recommendations</li>
                <li>Estimated cost savings and ROI calculations</li>
                <li>Product recommendations with efficiency ratings</li>
                <li>Implementation timeline suggestions</li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadReport}
                disabled={isGenerating || !auditId}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  !auditId 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Download PDF Report</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => isValidAuditId(auditId) && navigate(`/reports/${auditId}`)}
                disabled={!isValidAuditId(auditId)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  !isValidAuditId(auditId) 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <BarChart2 className="h-5 w-5" />
                <span>View Interactive Report</span>
              </button>
            </div>
            
            {!isValidAuditId(auditId) && (
              <p className="text-sm text-gray-500 mt-2">
                No energy audit available. Complete an audit to generate a report.
              </p>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium mb-3">Previous Reports</h3>
            
            {historyError ? (
              <div className="text-red-500 py-4">{historyError}</div>
            ) : (
              <>
                <AuditHistoryList audits={audits} isLoading={isLoadingHistory} />
                
                {!isLoadingHistory && audits.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
