import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  fetchReportData, 
  updateRecommendationStatus, 
  updateRecommendationPriority, 
  updateImplementationDetails 
} from '../services/reportService';
import { ReportData } from '../types/report';
import { RecommendationStatus, RecommendationPriority } from '../types/energyAudit';

// Import all report section components
import ReportExecutiveSummary from '../components/reports/ReportExecutiveSummary';
import ReportPropertyInfo from '../components/reports/ReportPropertyInfo';
import ReportCurrentConditions from '../components/reports/ReportCurrentConditions';
import ReportEnergyConsumption from '../components/reports/ReportEnergyConsumption';
import ReportLighting from '../components/reports/ReportLighting';
import EnhancedReportRecommendations from '../components/reports/EnhancedReportRecommendations';
import ReportCharts from '../components/reports/ReportCharts';
import ReportSummary from '../components/reports/ReportSummary';

const InteractiveReportPage: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('summary');

  // Helper function to validate audit ID
  const isValidAuditId = (id: string | null | undefined): boolean => {
    return id !== null && id !== "null" && id !== undefined && id !== "";
  };

  useEffect(() => {
    const loadReportData = async () => {
      if (!isValidAuditId(auditId)) {
        setError('No valid audit ID provided. Please complete an energy audit first.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // TypeScript safety: Make sure we have a valid string before making the API call
        if (typeof auditId === 'string') {
          const data = await fetchReportData(auditId);
          setReportData(data);
          setError(null);
        } else {
          throw new Error('Invalid audit ID format');
        }
      } catch (err) {
        console.error('Error loading report data:', err);
        setError('Failed to load report data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [auditId]);

  const handleUpdateStatus = async (recommendationId: string, status: 'active' | 'implemented', actualSavings?: number) => {
    if (!reportData) return;
    
    try {
      await updateRecommendationStatus(recommendationId, status, actualSavings);
      
      // Update local state
      const updatedRecommendations = reportData.recommendations.map(rec => {
        if (rec.id === recommendationId) {
          return {
            ...rec,
            status: status as RecommendationStatus,
            ...(actualSavings !== undefined ? { actualSavings } : {})
          };
        }
        return rec;
      });
      
      setReportData({
        ...reportData,
        recommendations: updatedRecommendations
      });
    } catch (err) {
      console.error('Error updating recommendation status:', err);
      // Show error notification or handle gracefully
    }
  };
  
  const handleUpdatePriority = async (recommendationId: string, priority: RecommendationPriority) => {
    if (!reportData) return;
    
    try {
      await updateRecommendationPriority(recommendationId, priority);
      
      // Update local state
      const updatedRecommendations = reportData.recommendations.map(rec => {
        if (rec.id === recommendationId) {
          return {
            ...rec,
            priority
          };
        }
        return rec;
      });
      
      setReportData({
        ...reportData,
        recommendations: updatedRecommendations
      });
    } catch (err) {
      console.error('Error updating recommendation priority:', err);
      // Show error notification or handle gracefully
    }
  };
  
  const handleUpdateImplementationDetails = async (
    recommendationId: string, 
    implementationDate: string,
    implementationCost: number
  ) => {
    if (!reportData) return;
    
    try {
      await updateImplementationDetails(recommendationId, implementationDate, implementationCost);
      
      // Update local state
      const updatedRecommendations = reportData.recommendations.map(rec => {
        if (rec.id === recommendationId) {
          return {
            ...rec,
            implementationDate,
            implementationCost
          };
        }
        return rec;
      });
      
      setReportData({
        ...reportData,
        recommendations: updatedRecommendations
      });
    } catch (err) {
      console.error('Error updating implementation details:', err);
      // Show error notification or handle gracefully
    }
  };

  const handleDownloadPdf = () => {
    if (!isValidAuditId(auditId)) return;
    window.open(`/api/energy-audit/${auditId}/report`, '_blank');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error || 'Failed to load report data'}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'summary', label: 'Executive Summary' },
    { id: 'property', label: 'Property Information' },
    { id: 'conditions', label: 'Current Conditions' },
    { id: 'energy', label: 'Energy Consumption' },
    { id: 'lighting', label: 'Lighting Assessment' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'charts', label: 'Energy Analysis' },
    { id: 'overview', label: 'Summary' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Energy Audit Report</h1>
        <button
          onClick={handleDownloadPdf}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Download PDF
        </button>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`px-4 py-2 whitespace-nowrap text-sm font-medium ${
                activeSection === section.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeSection === 'summary' && (
          <ReportExecutiveSummary data={reportData.executiveSummary} />
        )}
        
        {activeSection === 'property' && (
          <ReportPropertyInfo data={reportData.propertyInfo} />
        )}
        
        {activeSection === 'conditions' && (
          <ReportCurrentConditions data={reportData.currentConditions} />
        )}
        
        {activeSection === 'energy' && (
          <ReportEnergyConsumption data={reportData.energyConsumption} />
        )}
        
        {activeSection === 'lighting' && (
          <ReportLighting data={reportData.lighting} />
        )}
        
        {activeSection === 'recommendations' && (
          <EnhancedReportRecommendations 
            recommendations={reportData.recommendations}
            userCategories={reportData.productPreferences?.categories || []}
            budgetConstraint={reportData.productPreferences?.budgetConstraint}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePriority={handleUpdatePriority}
            onUpdateImplementationDetails={handleUpdateImplementationDetails}
          />
        )}
        
        {activeSection === 'charts' && (
          <ReportCharts data={reportData.charts} />
        )}
        
        {activeSection === 'overview' && (
          <ReportSummary data={reportData.summary} />
        )}
      </div>
    </div>
  );
};

export default InteractiveReportPage;
