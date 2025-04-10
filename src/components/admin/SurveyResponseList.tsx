import React, { useEffect, useState } from 'react';
import SurveyApiService from '../../services/surveyApiService';
import SurveyResponseModal from './SurveyResponseModal';

interface SurveyResponse {
  id: number;
  user_id: string | null;
  submission_date: Date;
  completion_time_seconds: number | null;
  sections: string[];
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SurveyResponseList: React.FC = () => {
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchResponses = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await SurveyApiService.getPaginatedResponses(page, pagination.limit);
      setResponses(data.responses);
      setPagination({
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages
      });
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to fetch survey responses');
      console.error('Error fetching survey responses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchResponses(newPage);
    }
  };

  const handleViewResponse = (id: number) => {
    setSelectedResponseId(id);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Function to render section names more readable
  const formatSections = (sections: string[]) => {
    if (!sections || sections.length === 0) return 'No sections';
    
    return sections
      .map(section => section.charAt(0).toUpperCase() + section.slice(1))
      .join(', ');
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
        <p className="font-medium">Error loading survey responses</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Pilot Study Responses</h2>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading survey responses...</p>
        </div>
      ) : responses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No survey responses available yet.</p>
        </div>
      ) : (
        <>
          {/* Survey response list */}
          <div className="space-y-4">
            {responses.map(response => (
              <div 
                key={response.id} 
                className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <div className="flex items-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 text-gray-400 mr-2" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          />
                        </svg>
                        <span className="text-gray-600">{formatDate(response.submission_date)}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mt-1">
                        Survey Response #{response.id}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {response.user_id ? `User ID: ${response.user_id}` : 'Anonymous User'}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Sections: {formatSections(response.sections)}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <button
                        onClick={() => handleViewResponse(response.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="ml-2 -mr-1 h-4 w-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={2}
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M14 5l7 7m0 0l-7 7m7-7H3" 
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 rounded ${
                    pagination.page === 1 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  &lt;
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  // Only show a few page numbers around the current page
                  if (
                    pageNum === 1 || 
                    pageNum === pagination.totalPages || 
                    (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded ${
                          pagination.page === pageNum
                            ? 'bg-green-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    (pageNum === pagination.page - 2 && pagination.page > 3) || 
                    (pageNum === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
                  ) {
                    return <span key={pageNum} className="px-1">...</span>;
                  }
                  return null;
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-1 rounded ${
                    pagination.page === pagination.totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  &gt;
                </button>
              </nav>
            </div>
          )}
        </>
      )}
      
      {/* Modal for viewing response details */}
      <SurveyResponseModal
        responseId={selectedResponseId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default SurveyResponseList;
