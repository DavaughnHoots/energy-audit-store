import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import UserFlowDiagram from './UserFlowDiagram'; // Import the new component

// Interface definitions
interface NavigationFlow {
  fromPage: string;
  toPage: string;
  total_transitions: number;
  date_range_start: string;
  date_range_end: string;
}

interface UserJourney {
  sequence: string[];
  frequency: number;
  conversionRate: number;
}

interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation_score: number;
  confidence: number;
}

interface SessionTimelinePoint {
  page: string;
  session_position: number;
  percentage_of_sessions: number;
  bounce_rate: number;
}

interface MostVisitedPage {
  area: string;
  page_path: string;
  title: string;
  visit_count: number;
  avg_time_spent: number;
}

interface MostUsedFeature {
  feature_name: string;
  component: string;
  usage_count: number;
  usage_trend: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component for tab content
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`nav-analytics-tabpanel-${index}`}
      aria-labelledby={`nav-analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// The main NavigationAnalytics component
const NavigationAnalytics: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // State for each data type
  const [navigationFlows, setNavigationFlows] = useState<NavigationFlow[]>([]);
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [featureCorrelations, setFeatureCorrelations] = useState<FeatureCorrelation[]>([]);
  const [sessionTimeline, setSessionTimeline] = useState<SessionTimelinePoint[]>([]);
  const [mostVisitedPages, setMostVisitedPages] = useState<MostVisitedPage[]>([]);
  const [mostUsedFeatures, setMostUsedFeatures] = useState<MostUsedFeature[]>([]);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tab switching handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    loadDataForTab(newValue);
  };
  
  // Function to load data based on active tab
  const loadDataForTab = async (tabIndex: number) => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '';
      
      switch(tabIndex) {
        case 0: // Most Visited Pages
          endpoint = '/admin/analytics/most-visited';
          break;
        case 1: // Most Used Features
          endpoint = '/admin/analytics/most-used-features';
          break;
        case 2: // User Journeys
          endpoint = '/admin/analytics/user-journeys';
          break;
        case 3: // Feature Correlations
          endpoint = '/admin/analytics/feature-correlations';
          break;
        case 4: // Navigation Flows
          endpoint = `/admin/analytics/navigation-flows?startDate=${startDate}&endDate=${endDate}`;
          break;
        case 5: // Session Timeline
          endpoint = '/admin/analytics/session-timeline';
          break;
        case 6: // User Flow Diagram - Handled by its own component
          setLoading(false); // No separate loading needed here
          return; // Data fetching is inside UserFlowDiagram component
        default:
          throw new Error('Invalid tab index');
      }
      
      const response = await apiClient.get(endpoint);
      
      if (response.data) {
        switch(tabIndex) {
          case 0:
            setMostVisitedPages(response.data.data);
            break;
          case 1:
            setMostUsedFeatures(response.data.data);
            break;
          case 2:
            setUserJourneys(response.data.data);
            break;
          case 3:
            setFeatureCorrelations(response.data.data);
            break;
          case 4:
            setNavigationFlows(response.data.data);
            break;
          case 5:
            setSessionTimeline(response.data.data);
            break;
          // Case 6 (User Flow Diagram) data is handled within its component
        }
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load data for the initial tab on component mount
  useEffect(() => {
    loadDataForTab(activeTab);
  }, []);
  
  // Generate chart colors
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
  
  return (
    <Paper elevation={2} sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Navigation Analytics & Website Roadmap
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Use these analytics to identify most used features, common navigation flows, and user journey patterns.
        This data can inform your website roadmap based on actual user behavior.
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="navigation analytics tabs"
        >
          <Tab label="Most Visited Pages" />
          <Tab label="Most Used Features" />
          <Tab label="User Journeys" />
          <Tab label="Feature Correlations" />
          <Tab label="Navigation Flows" />
          <Tab label="Session Timeline" />
          <Tab label="User Flow Diagram" /> {/* Add new tab */}
        </Tabs>
      </Box>
      
      {/* Loading and error states */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      
      {/* Most Visited Pages Tab */}
      <TabPanel value={activeTab} index={0}>
        {!loading && !error && mostVisitedPages.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Top Pages by Visit Count</Typography>
            <Typography variant="body2" paragraph>
              These are your most visited pages, which should be prioritized in your website roadmap.
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostVisitedPages.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <XAxis 
                    dataKey="title" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="visit_count" fill={colors[0]} name="Visit Count" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </TabPanel>
      
      {/* Most Used Features Tab */}
      <TabPanel value={activeTab} index={1}>
        {!loading && !error && mostUsedFeatures.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Top Features by Usage</Typography>
            <Typography variant="body2" paragraph>
              These features get the most engagement and should be enhanced in your roadmap.
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostUsedFeatures.slice(0, 10)}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <XAxis 
                    dataKey="feature_name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="usage_count" fill={colors[1]} name="Usage Count" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </TabPanel>
      
      {/* User Journeys Tab */}
      <TabPanel value={activeTab} index={2}>
        {!loading && !error && userJourneys.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Common User Journeys</Typography>
            <Typography variant="body2" paragraph>
              These are the most common paths users take through your site, showing natural navigation patterns.
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Journey Path</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Frequency</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Conversion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {userJourneys.map((journey, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        {journey.sequence.join(' → ')}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {journey.frequency}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {(journey.conversionRate * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </>
        )}
      </TabPanel>
      
      {/* Feature Correlations Tab */}
      <TabPanel value={activeTab} index={3}>
        {!loading && !error && featureCorrelations.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Feature Correlation Analysis</Typography>
            <Typography variant="body2" paragraph>
              These feature pairs are often used together and could be bundled or improved as a unit.
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Feature 1</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Feature 2</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Correlation Score</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {featureCorrelations.map((correlation, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        {correlation.feature1}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        {correlation.feature2}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {correlation.correlation_score.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {(correlation.confidence * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </>
        )}
      </TabPanel>
      
      {/* Navigation Flows Tab */}
      <TabPanel value={activeTab} index={4}>
        {!loading && !error && navigationFlows.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Page Transition Flows</Typography>
            <Typography variant="body2" paragraph>
              These transitions show how users navigate between pages, revealing key pathways through your site.
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>From Page</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>To Page</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Transitions</th>
                  </tr>
                </thead>
                <tbody>
                  {navigationFlows.map((flow, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        {flow.fromPage}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        {flow.toPage}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                        {flow.total_transitions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </>
        )}
      </TabPanel>
      
      {/* Session Timeline Tab */}
      <TabPanel value={activeTab} index={5}>
        {!loading && !error && sessionTimeline.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>Session Timeline Analysis</Typography>
            <Typography variant="body2" paragraph>
              This shows which pages users view at different points in their sessions.
            </Typography>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sessionTimeline}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <XAxis 
                    dataKey="session_position" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Position in Session', position: 'bottom', dy: 15 }}
                  />
                  <YAxis 
                    label={{ value: 'Percentage of Sessions', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip />
                  <Bar dataKey="percentage_of_sessions" fill={colors[5]} name="% of Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </TabPanel>

      {/* User Flow Diagram Tab */}
      <TabPanel value={activeTab} index={6}>
        {!loading && !error && (
          <UserFlowDiagram />
        )}
      </TabPanel>

    </Paper>
  );
};

export default NavigationAnalytics;
