import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const PilotStudyBanner: React.FC = () => {
  return (
    <div className="bg-blue-100 py-3 px-4 w-full">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Pilot Study in Progress: We're running a site-wide pilot study to improve our energy efficiency platform.
          </p>
        </div>
        <Link 
          to="/pilot-study-faq" 
          className="text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
        >
          Learn more about participating
        </Link>
      </div>
    </div>
  );
};

export default PilotStudyBanner;
