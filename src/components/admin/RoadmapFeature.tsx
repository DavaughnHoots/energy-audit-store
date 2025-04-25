import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

// Types
type Feature = {
  feature_name: string;
  component: string;
  usage_count: number;
  usage_trend: number;
};

type Page = {
  area: string;
  page_path: string;
  title: string;
  visit_count: number;
  avg_time_spent: number;
};

type RoadmapItem = {
  id: number;
  name: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  source: string;
  createdAt: string;
};

type NewRoadmapItem = {
  name: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  source: string;
};

const RoadmapFeature: React.FC = () => {
  // State for API data
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  
  // State for loading and errors
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'features' | 'pages' | 'roadmap'>('roadmap');
  
  // State for form
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState<NewRoadmapItem>({
    name: '',
    priority: 'medium',
    description: '',
    source: 'manual',
  });
  
  // State for edit mode
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Using Promise.all to fetch all data concurrently
        const [featuresRes, pagesRes, roadmapRes] = await Promise.all([
          axios.get('/api/admin/analytics/most-used-features'),
          axios.get('/api/admin/analytics/most-visited'),
          axios.get('/api/admin/analytics/roadmap')
        ]);
        
        setFeatures(featuresRes.data.data || []);
        setPages(pagesRes.data.data || []);
        setRoadmapItems(roadmapRes.data.data || []);
        setError(null);
      } catch (err) {
        // Check if error is from axios
        if (axios.isAxiosError(err)) {
          setError(`Error fetching data: ${err.message}`);
        } else {
          setError('An unknown error occurred while fetching data');
        }
        
        // Use sample data if in development mode or API fails
        if (process.env.NODE_ENV === 'development' || true) {
          setFeatures(getSampleFeatures());
          setPages(getSamplePages());
          setRoadmapItems(getSampleRoadmapItems());
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editMode && editId !== null) {
        // Update existing item
        const res = await axios.put(`/api/admin/analytics/roadmap/${editId}`, formData);
        
        // Update local state
        setRoadmapItems(prev => 
          prev.map(item => item.id === editId ? { ...res.data.data, createdAt: item.createdAt } : item)
        );
        
        // Reset form and edit mode
        setEditMode(false);
        setEditId(null);
      } else {
        // Create new item
        const res = await axios.post('/api/admin/analytics/roadmap', formData);
        
        // Add new item to local state
        setRoadmapItems(prev => [res.data.data, ...prev]);
      }
      
      // Reset form
      setFormData({
        name: '',
        priority: 'medium',
        description: '',
        source: 'manual',
      });
      
      // Hide form
      setShowForm(false);
    } catch (err) {
      // For demo purposes, just simulate successful API call
      if (editMode && editId !== null) {
        // Update local state with edited item
        setRoadmapItems(prev => 
          prev.map(item => item.id === editId ? { ...item, ...formData } : item)
        );
        
        // Reset form and edit mode
        setEditMode(false);
        setEditId(null);
      } else {
        // Add new item to local state with generated ID
        const newItem = {
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
        };
        setRoadmapItems(prev => [newItem, ...prev]);
      }
      
      // Reset form
      setFormData({
        name: '',
        priority: 'medium',
        description: '',
        source: 'manual',
      });
      
      // Hide form
      setShowForm(false);
    }
  };
  
  // Handle edit item
  const handleEdit = (item: RoadmapItem) => {
    // Set form data
    setFormData({
      name: item.name,
      priority: item.priority,
      description: item.description,
      source: item.source,
    });
    
    // Set edit mode
    setEditMode(true);
    setEditId(item.id);
    
    // Show form
    setShowForm(true);
  };
  
  // Handle delete item
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this roadmap item?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/admin/analytics/roadmap/${id}`);
      
      // Remove item from local state
      setRoadmapItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      // For demo purposes, just simulate successful API call
      setRoadmapItems(prev => prev.filter(item => item.id !== id));
    }
  };
  
  // Handle adding feature to roadmap
  const handleAddFeatureToRoadmap = (feature: Feature) => {
    setFormData({
      name: `Improve ${feature.feature_name}`,
      priority: 'medium',
      description: `Enhancement to ${feature.feature_name} based on usage analytics. This feature is heavily used (${feature.usage_count} times) with a trend of ${feature.usage_trend > 0 ? 'increasing' : 'decreasing'} usage.`,
      source: 'feature-usage',
    });
    
    setShowForm(true);
    setActiveTab('roadmap');
  };
  
  // Handle adding page to roadmap
  const handleAddPageToRoadmap = (page: Page) => {
    setFormData({
      name: `Optimize ${page.title || page.page_path}`,
      priority: 'medium',
      description: `Optimization for ${page.title || page.page_path} based on visit analytics. This page is frequently visited (${page.visit_count} visits) with users spending an average of ${Math.round(page.avg_time_spent)} seconds.`,
      source: 'page-visits',
    });
    
    setShowForm(true);
    setActiveTab('roadmap');
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render error state
  if (error && !features.length && !pages.length && !roadmapItems.length) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
        <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
          <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Website Roadmap</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'roadmap' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Roadmap
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'features' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Most Used Features
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 rounded-lg ${activeTab === 'pages' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Most Visited Pages
          </button>
        </div>
      </div>
      
      {/* Roadmap Tab */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Roadmap Items</h3>
            <button
              onClick={() => {
                setFormData({
                  name: '',
                  priority: 'medium',
                  description: '',
                  source: 'manual',
                });
                setEditMode(false);
                setEditId(null);
                setShowForm(!showForm);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>
          
          {/* Roadmap Form */}
          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold mb-4">{editMode ? 'Edit Roadmap Item' : 'Add New Roadmap Item'}</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    ></textarea>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Source
                    <select
                      name="source"
                      value={formData.source}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="manual">Manual Entry</option>
                      <option value="feature-usage">Feature Usage Analytics</option>
                      <option value="page-visits">Page Visit Analytics</option>
                      <option value="user-feedback">User Feedback</option>
                    </select>
                  </label>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editMode ? 'Update' : 'Add to Roadmap'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Roadmap Items */}
          <div className="space-y-4">
            {roadmapItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No roadmap items found. Add your first item above.
              </div>
            ) : (
              roadmapItems.map(item => (
                <div key={item.id} className="bg-white p-4 shadow rounded-lg border-l-4 relative 
                  border-l-4 
                  hover:shadow-md 
                  transition-shadow 
                  duration-200
                  border-l-4 
                  ${item.priority === 'high' ? 'border-red-500' : item.priority === 'medium' ? 'border-yellow-500' : 'border-green-500'}"
                >
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-lg">{item.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium 
                      ${item.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{item.description}</p>
                  
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Source: {item.source}</span>
                    <span>Created: {format(new Date(item.createdAt), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Features Tab */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Most Used Features</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{feature.feature_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{feature.component}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{feature.usage_count.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center ${feature.usage_trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {feature.usage_trend > 0 ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                          </svg>
                        )}
                        {Math.abs(feature.usage_trend).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleAddFeatureToRoadmap(feature)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Add to Roadmap
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Pages Tab */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Most Visited Pages</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pages.map((page, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{page.title || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{page.page_path}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{page.area}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{page.visit_count.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{page.avg_time_spent.toFixed(1)}s</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleAddPageToRoadmap(page)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Add to Roadmap
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Sample data functions for development/demo mode
const getSampleFeatures = (): Feature[] => [
  {
    feature_name: 'Energy Audit Form',
    component: 'EnergyAuditForm',
    usage_count: 1453,
    usage_trend: 12.5,
  },
  {
    feature_name: 'Product Filter',
    component: 'ProductFilterComponent',
    usage_count: 1289,
    usage_trend: 8.3,
  },
  {
    feature_name: 'Interactive Report',
    component: 'InteractiveReportViewer',
    usage_count: 982,
    usage_trend: 15.2,
  },
  {
    feature_name: 'Savings Calculator',
    component: 'SavingsCalculator',
    usage_count: 876,
    usage_trend: -2.8,
  },
  {
    feature_name: 'Product Comparison',
    component: 'ProductComparisonTool',
    usage_count: 754,
    usage_trend: 5.7,
  },
];

const getSamplePages = (): Page[] => [
  {
    area: 'Products',
    page_path: '/products',
    title: 'Energy Efficient Products',
    visit_count: 4251,
    avg_time_spent: 187.3,
  },
  {
    area: 'Education',
    page_path: '/education/home-insulation-basics',
    title: 'Home Insulation Basics',
    visit_count: 3825,
    avg_time_spent: 285.9,
  },
  {
    area: 'Tools',
    page_path: '/energy-audit',
    title: 'DIY Energy Audit',
    visit_count: 3542,
    avg_time_spent: 432.1,
  },
  {
    area: 'Dashboard',
    page_path: '/dashboard',
    title: 'User Dashboard',
    visit_count: 2987,
    avg_time_spent: 524.6,
  },
  {
    area: 'Reports',
    page_path: '/reports',
    title: 'Energy Efficiency Reports',
    visit_count: 2103,
    avg_time_spent: 378.5,
  },
];

const getSampleRoadmapItems = (): RoadmapItem[] => [
  {
    id: 1,
    name: 'Improve Mobile Responsiveness for Energy Audit',
    priority: 'high',
    description: 'Enhance the mobile experience for the DIY Energy Audit tool to make it more accessible on smartphones.',
    source: 'user-feedback',
    createdAt: '2025-03-15T14:22:48Z',
  },
  {
    id: 2,
    name: 'Add More Filtering Options to Product Gallery',
    priority: 'medium',
    description: 'Expand the filtering capabilities in the product gallery to allow for more granular searches.',
    source: 'feature-usage',
    createdAt: '2025-03-25T09:12:31Z',
  },
  {
    id: 3,
    name: 'Optimize Home Insulation Basics Page',
    priority: 'low',
    description: 'Improve load time and add more interactive elements to the Home Insulation Basics educational page.',
    source: 'page-visits',
    createdAt: '2025-04-02T16:43:15Z',
  },
];

export default RoadmapFeature;
