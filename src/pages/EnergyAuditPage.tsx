import React from 'react';
import EnergyAuditForm from '../components/audit/EnergyAuditForm';
import useAuth from '@/context/AuthContext';

const EnergyAuditPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DIY Energy Audit</h1>
          <p className="mt-4 text-lg text-gray-600">
            Complete our comprehensive energy audit to receive personalized recommendations
            for improving your home's energy efficiency.
          </p>
          {!isAuthenticated && (
            <p className="mt-2 text-sm text-gray-500">
              Create an account to save your audit results and track your progress over time.
            </p>
          )}
        </div>
        <EnergyAuditForm />
      </div>
    </div>
  );
};

export default EnergyAuditPage;
