import React, { useState, useEffect } from 'react';
import RoadmapBuilder from '../components/admin/RoadmapBuilder';

const AdminDashboardPage: React.FC = () => {
  // Navigation state for different dashboard sections
  const [activeSection, setActiveSection] = useState<string>('roadmap');

  // Dashboard sections
  const sections = [
    { id: 'roadmap', name: 'Website Roadmap' },
    { id: 'analytics', name: 'User Analytics' },
    { id: 'users', name: 'User Management' },
    { id: 'products', name: 'Product Management' },
    { id: 'content', name: 'Content Management' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Welcome, Admin</span>
            <button className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md">Logout</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-medium text-gray-800">Dashboard</h2>
              </div>
              <nav className="p-2">
                <ul className="space-y-1">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-4 py-2 rounded-md transition-colors ${activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {section.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white shadow rounded-lg p-6">
              {activeSection === 'roadmap' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Analytics-Based Website Roadmap</h2>
                    <a 
                      href="/admin/roadmap" 
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Open in Full Page
                    </a>
                  </div>
                  <RoadmapBuilder />
                </div>
              )}
              {activeSection === 'analytics' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">User Analytics</h2>
                  <p className="text-gray-500">Analytics dashboard is under development.</p>
                </div>
              )}
              {activeSection === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">User Management</h2>
                  <p className="text-gray-500">User management dashboard is under development.</p>
                </div>
              )}
              {activeSection === 'products' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Product Management</h2>
                  <p className="text-gray-500">Product management dashboard is under development.</p>
                </div>
              )}
              {activeSection === 'content' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Content Management</h2>
                  <p className="text-gray-500">Content management dashboard is under development.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
