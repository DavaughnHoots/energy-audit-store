// src/App.tsx
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-green-600">EcoSmart Market</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#" className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Products
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Energy Audit
                </a>
                <a href="#" className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Community
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <button className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium">
                Sign In
              </button>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Alert className="mb-6">
          <AlertTitle className="text-lg font-semibold">Welcome to Energy Efficient Shop!</AlertTitle>
          <AlertDescription>
            Your one-stop shop for energy-efficient products. Start with a DIY energy audit to get personalized recommendations.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Product Catalog</h3>
              <p className="mt-1 text-sm text-gray-500">Browse our selection of energy-efficient products.</p>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">DIY Energy Audit</h3>
              <p className="mt-1 text-sm text-gray-500">Get personalized recommendations for your home.</p>
            </div>
          </div>
          
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900">Community</h3>
              <p className="mt-1 text-sm text-gray-500">Connect with other energy-conscious homeowners.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
