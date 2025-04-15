import React from 'react';
import { usePageTracking } from '../hooks/analytics/usePageTracking';

const PilotStudyFAQPage: React.FC = () => {
  usePageTracking('education', { subPage: 'pilot-study-faq' });
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Pilot Study FAQ</h1>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">What is the Pilot Study?</h3>
          <p className="mb-4 text-gray-700">
            Our pilot study is a short-term test of our Energy-Efficient Products Platform. We're looking for real-user feedback to fine-tune the features, usability, and overall experience before we launch the full version.
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Why Participate?</h3>
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li><strong>Direct Impact:</strong> Your insights will guide our improvements.</li>
            <li><strong>Early Access:</strong> Enjoy a first look at our innovative tools, including the DIY Energy Audit, Product Recommendations, Community Forum, and Educational Resources.</li>
            <li><strong>Quick & Easy:</strong> The study runs for just 2 weeks with a simple survey at the end, taking only about 5 minutes.</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Who Can Join?</h3>
          <p className="mb-4 text-gray-700">
            We welcome everyone interested in energy efficiency—homeowners, renters, or professionals. We particularly appreciate diverse perspectives, from energy novices to experts.
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">How Do I Get Started?</h3>
          <ol className="list-decimal pl-5 mb-4 text-gray-700 space-y-2">
            <li>
              <strong>Sign Up:</strong><br/>
              Create your account via our <a href="https://energy-audit-store-e66479ed4f2b.herokuapp.com/sign-up" className="text-blue-600 hover:underline">Sign-Up Page</a>.
            </li>
            <li>
              <strong>Explore the Platform:</strong><br/>
              Navigate through the Products, Energy Audit, Community, and Education sections.
            </li>
          </ol>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">What Will I Be Doing?</h3>
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-2">
            <li>
              <strong>Test Key Features:</strong><br/>
              Use our DIY Energy Audit tool, browse our Product Recommendations, participate in the Community Forum, and review our Educational Resources.
            </li>
            <li>
              <strong>Share Your Feedback:</strong><br/>
              Complete a short survey to tell us about your experience with the platform.
            </li>
          </ul>
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Is My Feedback Confidential?</h3>
          <p className="mb-4 text-gray-700">
            Yes. Your responses are completely anonymous unless you choose to provide your email for follow-up. All data collected is solely for improving the platform.
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Need Help?</h2>
        <p className="text-blue-700">
          If you have any questions or need assistance during the study, please reach out to our support team at <a href="mailto:Hootsd1@montclair.edu" className="text-blue-700 font-medium hover:underline">Hootsd1@montclair.edu</a>.
        </p>
      </div>
    </div>
  );
};

export default PilotStudyFAQPage;
