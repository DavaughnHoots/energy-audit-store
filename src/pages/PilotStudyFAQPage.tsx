import React from 'react';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const PilotStudyFAQPage: React.FC = () => {
  usePageTracking('education', { subPage: 'pilot-study-faq' });
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pilot Study FAQ</h1>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Objectives of the Pilot Study</h2>
          <p className="mb-4 text-gray-700">
            The primary objectives of this pilot study are to evaluate the functionality, usability, and effectiveness 
            of our "One-Stop Shop for Energy-Efficient Products" platform before its full release.
          </p>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Specifically, we aim to test:</h3>
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>The usability and intuitiveness of the user interface across different user types</li>
            <li>The effectiveness of the DIY energy audit tool in providing accurate and helpful recommendations</li>
            <li>The relevance and usefulness of product recommendations based on energy audit results</li>
            <li>The system's performance, reliability, and responsiveness under real-world usage conditions</li>
          </ul>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Expected outcomes include:</h3>
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>Identification of any usability issues or barriers that may impede user adoption</li>
            <li>Validation that the DIY energy audit tool provides actionable and personalized recommendations</li>
            <li>Verification that the platform performs reliably under typical usage patterns</li>
            <li>Collection of user feedback for further refinement before full launch</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Collection Methods</h2>
          <p className="mb-4 text-gray-700">
            We will employ multiple data collection methods to gather comprehensive feedback:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li><strong>System Usage Analytics:</strong> Tracking user interactions, feature usage patterns, time spent on various sections, and task completion rates</li>
            <li><strong>Post-usage Survey:</strong> Measuring user satisfaction, perceived usefulness, and likelihood to recommend using a 5-point Likert scale</li>
            <li><strong>Task Completion Metrics:</strong> Recording success rates, time taken, and error counts for specific predefined tasks (e.g., completing an energy audit, finding recommended products)</li>
            <li><strong>System Performance Logs:</strong> Monitoring technical performance indicators like response times and error rates</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Administration and Access</h2>
          <p className="mb-4 text-gray-700">
            The pilot study will be conducted as follows:
          </p>
          
          <p className="mb-4 text-gray-700">
            Participants will receive an email with:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>Clear instructions on expected participation and timeline</li>
            <li>A list of suggested tasks to complete during the testing period</li>
            <li>Contact email for technical support</li>
          </ul>
          
          <p className="text-gray-700">
            After the testing period, participants can take the survey on the website itself via the Survey tab on the user dashboard.
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Size and Target Audience</h2>
          <p className="mb-4 text-gray-700">
            The pilot study will include 30 participants, representing our key user segments:
          </p>
          
          <p className="mb-2 text-gray-700">
            <strong>20 Homeowners/Renters:</strong>
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>5 energy-conscious homeowners who have previously invested in energy efficiency</li>
            <li>5 homeowners who are considering energy efficiency upgrades but have limited knowledge</li>
            <li>5 homeowners with technical backgrounds</li>
            <li>5 homeowners with non-technical backgrounds</li>
          </ul>
          
          <p className="mb-2 text-gray-700">
            Participants will be recruited through:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>Montclair's Energy Department & any connections they have</li>
            <li>Professional or Personal networks of the team members</li>
            <li>Social media advertising</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Duration of the Pilot Study</h2>
          <p className="mb-4 text-gray-700">
            The pilot study will run for 2 weeks, structured as follows:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li><strong>Week 1:</strong> Initial access, platform exploration, and completion of the DIY energy audit</li>
            <li><strong>Week 2:</strong> Engagement with product recommendations, community features, and implementation of suggested energy-saving measures</li>
          </ul>
          
          <p className="text-gray-700">
            This timeframe provides sufficient opportunity for participants to explore all platform features while also allowing 
            users to return to the platform multiple times, simulating real-world usage patterns.
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Organization and Reporting of Findings</h2>
          
          <p className="mb-4 text-gray-700">
            The data collected will be organized and analyzed as follows:
          </p>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Quantitative Analysis:</h3>
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>Statistical analysis of survey responses</li>
            <li>Aggregation of system usage metrics and task completion rates</li>
            <li>Performance data analysis, including response times and error rates</li>
            <li>Generation of visual representations (graphs, charts) to illustrate key findings</li>
          </ul>
          
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">Qualitative Analysis:</h3>
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>Thematic analysis of interview responses and open-ended survey questions</li>
            <li>Identification of recurring patterns or issues in user feedback</li>
            <li>Documentation of specific user suggestions and feature requests</li>
          </ul>
          
          <p className="mb-2 text-gray-700">
            The final report will include:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>Executive summary highlighting key findings and recommendations</li>
            <li>Detailed analysis of quantitative and qualitative data</li>
            <li>Specific usability issues identified, categorized by severity and frequency</li>
            <li>Performance analysis and technical considerations</li>
            <li>User satisfaction metrics across different user segments</li>
            <li>Prioritized list of recommended improvements for implementation before full release</li>
            <li>Appendices containing raw data and complete survey responses</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">How to Participate</h2>
        <p className="text-blue-700 mb-4">
          If you're interested in participating in our pilot study, simply continue to use the site as normal. 
          Your usage will help us gather valuable data on how people interact with our platform.
        </p>
        <p className="text-blue-700">
          To provide feedback about your experience, please create an account and visit the 
          <span className="font-medium"> Survey tab </span> 
          on the user dashboard, where you can fill out our feedback survey.
        </p>
      </div>
    </div>
  );
};

export default PilotStudyFAQPage;
