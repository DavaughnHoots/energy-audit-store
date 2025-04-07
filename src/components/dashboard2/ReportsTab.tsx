import React, { useState, useEffect } from 'react';
import { CalendarIcon, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { fetchAuditHistory } from '../../services/reportService';
import { PaginatedAuditHistory } from '../../types/report';

/**
 * Reports tab for the dashboard
 * Shows energy audit reports and allows downloading/viewing
 */
const ReportsTab: React.FC = () => {
  const navigate = useNavigate();
  const [auditHistory, setAuditHistory] = useState<PaginatedAuditHistory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Fetch audit history when component mounts or page changes
  useEffect(() => {
    const loadAuditHistory = async () => {
      try {
        setLoading(true);
        const data = await fetchAuditHistory(currentPage, 5); // 5 items per page
        setAuditHistory(data);
        setError(null);
      } catch (err) {
        console.error('Error loading audit history:', err);
        setError('Failed to load audit history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadAuditHistory();
  }, [currentPage]);

  // Handler for pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handlers for actions
  const handleDownloadPdf = (auditId: string) => {
    window.open(`/api/energy-audit/${auditId}/report`, '_blank');
  };

  const handleViewInteractiveReport = (auditId: string) => {
    navigate(`/reports/interactive/${auditId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Energy Audit Reports</h2>
        <p className="text-gray-600 mb-6">
          Generate and download comprehensive reports based on your energy audits.
          These reports include detailed analysis, recommendations, and potential
          savings information.
        </p>
      </div>

      {/* Report Contents card */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-blue-800 font-medium mb-3">Report Contents</h3>
        
        <ul className="space-y-2 text-blue-700">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Executive summary of energy usage
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Detailed analysis of current conditions
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Prioritized improvement recommendations
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Estimated cost savings and ROI calculations
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Product recommendations with efficiency ratings
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Implementation timeline suggestions
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {auditHistory?.audits && auditHistory.audits.length > 0 ? (
          <>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              onClick={() => auditHistory.audits[0]?.id && handleDownloadPdf(auditHistory.audits[0].id)}
            >
              <Download size={16} />
              Download Latest PDF Report
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() => auditHistory.audits[0]?.id && handleViewInteractiveReport(auditHistory.audits[0].id)}
            >
              <Eye size={16} />
              View Latest Interactive Report
            </Button>
          </>
        ) : !loading && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={() => navigate('/energy-audit')}
          >
            Create Energy Audit
          </Button>
        )}
      </div>

      {/* Previous Reports section */}
      <div className="mt-10">
        <h3 className="text-lg font-medium mb-4">Previous Reports</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-md">
            {error}
          </div>
        ) : auditHistory?.audits?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No audit reports found. Complete an energy audit to generate reports.
          </div>
        ) : (
          <div className="space-y-3">
            {auditHistory?.audits?.map(audit => (
              <div key={audit.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="flex items-center text-gray-500 mb-1">
                    <CalendarIcon size={16} className="mr-1" />
                    <span>{new Date(audit.date).toLocaleDateString()}</span>
                  </div>
                  <div className="font-medium">{audit.title || "Energy Audit"}</div>
                  <div className="text-gray-600 text-sm">{audit.address}</div>
                  <div className="text-gray-600 text-sm">
                    {audit.recommendations} Recommendations
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 flex items-center gap-1"
                    onClick={() => handleViewInteractiveReport(audit.id)}
                  >
                    View <span className="ml-1">→</span>
                  </Button>
                  <Button 
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleDownloadPdf(audit.id)}
                  >
                    <Download size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {auditHistory && auditHistory.pagination?.totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              <button 
                className={`p-2 rounded-md ${currentPage === 1 ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              
              {auditHistory.pagination?.totalPages && Array.from({ length: auditHistory.pagination.totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, current page, last page, and pages around current
                  return page === 1 ||
                         page === auditHistory.pagination?.totalPages ||
                         Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  // Add ellipsis when there are gaps
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-2">...</span>}
                      <button 
                        className={`p-2 rounded-md ${
                          currentPage === page 
                            ? 'bg-green-600 text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}
              <button 
                className={`p-2 rounded-md ${currentPage === auditHistory.pagination?.totalPages ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                onClick={() => auditHistory.pagination?.totalPages && currentPage < auditHistory.pagination.totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === auditHistory.pagination?.totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
