import React from 'react';
import AdvancedInsulationPage from './pages/AdvancedInsulationPage';
import ResidentialSolarPage from './pages/ResidentialSolarPage';
import PilotStudyFAQPage from './pages/PilotStudyFAQPage';
import PilotStudyBanner from './components/PilotStudyBanner';
import Products2Page from './pages/Products2Page';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import { usePageTracking } from './hooks/analytics/usePageTracking';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UserDashboardPage from './pages/UserDashboardPage';
import NewUserDashboardPage from './pages/NewUserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BadgesDiagnosticPage from './pages/BadgesDiagnosticPage';
import BadgeDiagnostics from './components/badges/BadgeDiagnostics';
import AdminBadgeDiagnosticsPage from './pages/AdminBadgeDiagnosticsPage';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ContentWrapper from './components/layout/ContentWrapper';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import EnergyAuditPage from './pages/EnergyAuditPage';
import InteractiveReportPage from './pages/InteractiveReportPage';
import EducationPage from './pages/EducationPage';
import ResourceContentPage from './pages/education-resources/ResourceContentPage';
import CommunityPage from './pages/CommunityPage';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import UserSettingsPage from './pages/UserSettingsPage';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { LineChart, Battery, Users } from 'lucide-react';

// Home component with all the landing page content
const Home: React.FC = () => {
  // Add page tracking
  usePageTracking('home');
  
  const features = [
    {
      title: 'Product Catalog',
      description: 'Browse our selection of energy-efficient products with detailed specifications and reviews.',
      icon: <LineChart className="h-6 w-6 text-green-600" />
    },
    {
      title: 'DIY Energy Audit',
      description: 'Get a personalized energy efficiency report and recommendations for your home.',
      icon: <Battery className="h-6 w-6 text-green-600" />
    },
    {
      title: 'Community',
      description: 'Connect with other homeowners and share experiences about energy-saving initiatives.',
      icon: <Users className="h-6 w-6 text-green-600" />
    }
  ];

  const stats = [
    { stat: '30%', label: 'Average Energy Savings' },
    { stat: '50k+', label: 'Products Available' },
    { stat: '10k+', label: 'Happy Customers' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <Alert className="mb-4 sm:mb-8 mx-2 sm:mx-0">
        <AlertTitle className="text-base sm:text-lg font-semibold">Welcome to Energy Efficient Shop!</AlertTitle>
        <AlertDescription className="text-sm sm:text-base">
          Where Efficiency meets Sustainability! It is your one-stop shop for energy-efficient products. Start with a DIY energy audit to get personalized recommendations.
        </AlertDescription>
      </Alert>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 mx-2 sm:mx-0">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.description}</p>
              <Link
                to={
                  feature.title === 'Product Catalog' ? '/products' :
                  feature.title === 'DIY Energy Audit' ? '/energy-audit' :
                  feature.title === 'Community' ? '/community' : '/'
                }
                className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium inline-block"
              >
                Learn more →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Energy Savings Stats */}
      <div className="bg-green-50 rounded-lg p-4 sm:p-8 mb-8 sm:mb-12 mx-2 sm:mx-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center">
          Make an Impact with Energy Efficiency
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-4xl font-bold text-green-600 mb-2">{item.stat}</p>
              <p className="text-sm text-gray-600">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600 rounded-lg p-4 sm:p-8 text-center mx-2 sm:mx-0">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
          Ready to Start Saving?
        </h2>
        <p className="text-sm sm:text-base text-green-100 mb-4 sm:mb-6 max-w-2xl mx-auto">
          Take our DIY energy audit today and discover personalized recommendations for your home's energy efficiency.
        </p>
        <Link to="/energy-audit">
          <button className="bg-white text-green-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-green-50 transition-colors duration-200">
            Start Energy Audit
          </button>
        </Link>
      </div>
    </div>
  );
};

// Main App component with routing
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AnalyticsProvider>
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-grow">
              <ContentWrapper>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products2" element={<Products2Page />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/energy-audit" element={<EnergyAuditPage />} />
                  <Route path="/energy-audit/:auditId/report" element={<InteractiveReportPage />} />
                  <Route path="/reports/:auditId" element={<InteractiveReportPage />} />
                  <Route path="/education" element={<EducationPage />} />
                  <Route path="/education/resources/advanced-insulation" element={<AdvancedInsulationPage />} />
                  {/* Special redirect for resource ID 2 to the advanced insulation page */}
                  <Route path="/education/2" element={<Navigate to="/education/resources/advanced-insulation" replace />} />
                  <Route path="/education/resources/residential-solar" element={<ResidentialSolarPage />} />
                  {/* Special redirect for residential solar to the dedicated path */}
                  <Route path="/education/residential-solar" element={<Navigate to="/education/resources/residential-solar" replace />} />
                  {/* Special redirect for resource ID 3 to the residential solar page */}
                  <Route path="/education/3" element={<Navigate to="/education/resources/residential-solar" replace />} />
                  <Route path="/education/:resourceId" element={<ResourceContentPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/sign-up" element={<SignUp />} />
                  {/* Auth reset helper redirect */}
                  <Route path="/auth-reset" element={<Navigate to="/auth-reset.html" replace />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Navigate to="/dashboard2" replace />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/dashboard2"
                    element={
                      <ProtectedRoute>
                        <NewUserDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <UserSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings/property"
                    element={
                      <ProtectedRoute>
                        <UserSettingsPage initialSection="general" />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/badges"
                    element={
                      <ProtectedRoute>
                        <AdminBadgeDiagnosticsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/badge-diagnostics"
                    element={
                      <ProtectedRoute>
                        <BadgesDiagnosticPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/badge-data-diagnostics"
                    element={
                      <ProtectedRoute>
                        <BadgeDiagnostics />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/pilot-study-faq" element={<PilotStudyFAQPage />} />
                </Routes>
              </ContentWrapper>
            </main>
            <Footer />
          </div>
          </AnalyticsProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;