import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Page that provides information about the ongoing pilot study
 */
const AboutPilotStudyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-blue-50">
          <h1 className="text-2xl font-bold text-gray-900">About Our Pilot Study</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Information about the Energy Efficiency Platform pilot study
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">What is this pilot study?</h2>
          
          <p className="mb-4 text-gray-700">
            Welcome to the "One-Stop Shop for Energy-Efficient Products" platform pilot study. 
            For a period of 2 weeks, we are gathering feedback and usage data to improve our platform 
            before its full release.
          </p>
          
          <h2 className="text-lg font-medium text-gray-900 mb-4 mt-6">What data are we collecting?</h2>
          
          <p className="mb-2 text-gray-700">
            During the pilot study, we collect anonymous usage data including:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
            <li>Pages visited and features used</li>
            <li>Time spent on different sections of the website</li>
            <li>Task completion rates for energy audits and other features</li>
            <li>System performance metrics</li>
          </ul>
          
          <p className="mb-4 text-gray-700">
            <strong>We do not collect any personally identifiable information</strong> unless you 
            explicitly create an account, in which case we maintain standard account information like email.
          </p>
          
          <h2 className="text-lg font-medium text-gray-900 mb-4 mt-6">How will the data be used?</h2>
          
          <p className="mb-4 text-gray-700">
            The data collected will help us:
          </p>
          
          <ul className="list-disc pl-5 mb-4 text-gray-700 space-y-1">
            <li>Identify usability issues and user interface improvements</li>
            <li>Refine the accuracy and helpfulness of our DIY energy audit tool</li>
            <li>Improve product recommendations based on energy audit results</li>
            <li>Ensure the system performs reliably under typical usage conditions</li>
          </ul>
          
          <h2 className="text-lg font-medium text-gray-900 mb-4 mt-6">Duration of the study</h2>
          
          <p className="mb-4 text-gray-700">
            The pilot study will run for 2 weeks, after which we will analyze the results and implement 
            improvements before the full platform launch.
          </p>
          
          <h2 className="text-lg font-medium text-gray-900 mb-4 mt-6">Opting out</h2>
          
          <p className="mb-4 text-gray-700">
            Participation in the pilot study is completely voluntary. If you prefer not to participate, 
            you can still use the platform, but we encourage your participation to help us create 
            the best possible energy efficiency platform.
          </p>
          
          <div className="mt-8 flex justify-center">
            <Link 
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPilotStudyPage;
