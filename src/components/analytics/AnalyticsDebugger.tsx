import React, { useState, useEffect } from 'react';
import { usePageTracking } from '@/hooks/analytics/usePageTracking';
import { useComponentTracking } from '@/hooks/analytics/useComponentTracking';
import { useFormTracking } from '@/hooks/analytics/useFormTracking';
import { AnalyticsArea } from '@/context/AnalyticsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Debug component for testing analytics tracking functionality
 */
const AnalyticsDebugger: React.FC = () => {
  // Add page tracking
  usePageTracking('debug');
  
  // Add component tracking
  const trackComponentEvent = useComponentTracking('debug', 'AnalyticsDebugger');
  
  // Add form tracking
  const { trackFieldEvent, trackSubmit, trackValidationError } = useFormTracking('debug', 'DebugForm');
  
  // State
  const [activeTab, setActiveTab] = useState('page');
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [selectedArea, setSelectedArea] = useState<AnalyticsArea>('debug');
  const [eventName, setEventName] = useState('custom_event');
  const [eventData, setEventData] = useState('{}');
  
  // Areas for dropdown
  const areas: AnalyticsArea[] = [
    'products',
    'energy_audit',
    'dashboard',
    'reports',
    'settings',
    'education',
    'community',
    'auth',
    'debug'
  ];
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    trackComponentEvent('switch_tab', { tab });
  };
  
  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    trackFieldEvent(name, 'change', { length: value.length });
  };
  
  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.email.includes('@')) {
      trackValidationError('email', 'Invalid email format');
      alert('Invalid email format');
      return;
    }
    
    trackSubmit(true, { dataSize: JSON.stringify(formData).length });
    console.log('Form submitted:', formData);
  };
  
  // Trigger a manual component event
  const triggerComponentEvent = () => {
    trackComponentEvent('manual_trigger', { timestamp: new Date().toISOString() });
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Analytics Tracking Debugger</h1>
      
      <Tabs defaultValue="page" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="page">Page Tracking</TabsTrigger>
          <TabsTrigger value="component">Component Tracking</TabsTrigger>
          <TabsTrigger value="form">Form Tracking</TabsTrigger>
          <TabsTrigger value="custom">Custom Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="page">
          <Card>
            <CardHeader>
              <CardTitle>Page View Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">This page is being tracked with the following parameters:</p>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm mb-4">
                <pre>usePageTracking('debug');</pre>
              </div>
              <p>Open your browser's console to see the tracking events being fired.</p>
              <Button 
                className="mt-4"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Reload Page to Trigger Page View Again
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="component">
          <Card>
            <CardHeader>
              <CardTitle>Component Interaction Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Test component tracking by clicking the button below:</p>
              <Button 
                onClick={triggerComponentEvent}
                className="mb-4"
              >
                Trigger Component Event
              </Button>
              <div className="bg-gray-100 p-4 rounded font-mono text-sm">
                <pre>{
`// Event that will be tracked:
trackComponentEvent('manual_trigger', { 
  timestamp: new Date().toISOString() 
});`
                }</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Form Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onFocus={() => trackFieldEvent('name', 'focus')}
                    onBlur={() => trackFieldEvent('name', 'blur')}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email (enter invalid email to test validation)
                  </label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => trackFieldEvent('email', 'focus')}
                    onBlur={() => trackFieldEvent('email', 'blur')}
                  />
                </div>
                
                <Button type="submit">Submit Form</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Custom Event Testing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <select
                    id="area"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value as AnalyticsArea)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Name
                  </label>
                  <Input
                    id="eventName"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="eventData" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Data (JSON)
                  </label>
                  <textarea
                    id="eventData"
                    value={eventData}
                    onChange={(e) => setEventData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md h-32 font-mono"
                  />
                </div>
                
                <Button
                  onClick={() => {
                    try {
                      const parsedData = JSON.parse(eventData);
                      trackComponentEvent(eventName, parsedData);
                    } catch (error) {
                      alert('Invalid JSON for event data');
                    }
                  }}
                >
                  Trigger Custom Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Console Instructions</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p className="mb-2">Open your browser's console to see the tracking events:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Right-click and select "Inspect" or press F12</li>
            <li>Go to the "Console" tab</li>
            <li>Look for messages with the "[ANALYTICS DEBUG]" prefix</li>
            <li>Colored logs indicate different types of events:
              <ul className="list-disc list-inside ml-4 mt-1">
                <li><span className="text-green-600">Green</span>: Event tracking attempts</li>
                <li><span className="text-red-500">Red</span>: Duplicate events skipped</li>
                <li><span className="text-blue-500">Blue</span>: Events sent to server</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDebugger;
