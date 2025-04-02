import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Alert } from '../ui/alert';

/**
 * Pilot Study Registration Component
 * Handles validation of pilot tokens and registration of pilot participants
 */
const PilotStudyRegistration: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const tokenFromUrl = queryParams.get('token') || '';
  
  // Form state
  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentChecked, setConsentChecked] = useState(true);
  
  // UI state
  const [isValidating, setIsValidating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'initial' | 'validating' | 'valid' | 'invalid'>('initial');
  const [participantType, setParticipantType] = useState<string | null>(null);
  
  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  
  // Validate token when provided in URL
  useEffect(() => {
    if (tokenFromUrl) {
      validateToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);
  
  // Validate token function
  const validateToken = async (tokenValue: string) => {
    setIsValidating(true);
    setValidationStatus('validating');
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/pilot/validate-token`, {
        params: { token: tokenValue }
      });
      
      if (response.data.valid) {
        setValidationStatus('valid');
        setParticipantType(response.data.participantType);
      } else {
        setValidationStatus('invalid');
        setError(response.data.message || 'Invalid invitation token');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setValidationStatus('invalid');
      setError('Error validating invitation token. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Handle token validation form submission
  const handleValidateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      validateToken(token);
    } else {
      setError('Please enter an invitation token');
    }
  };
  
  // Form validation
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError(null);
    }
    
    // Password validation
    if (!password || password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    } else {
      setPasswordError(null);
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError(null);
    }
    
    // Consent validation
    if (!consentChecked) {
      setError('You must agree to analytics data collection to participate in the pilot study');
      isValid = false;
    } else {
      setError(null);
    }
    
    return isValid;
  };
  
  // Handle registration form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsRegistering(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/analytics/pilot/register`, {
        email,
        password,
        token,
        participantType
      });
      
      if (response.data.success) {
        // Store token in local storage
        localStorage.setItem('authToken', response.data.token);
        
        // Show success message and redirect to dashboard
        alert('Registration successful! You are now part of the pilot study.');
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Error during registration. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Render token validation form
  const renderTokenValidationForm = () => (
    <form onSubmit={handleValidateToken} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="token">Invitation Token</Label>
        <Input 
          id="token"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter your invitation token"
          disabled={isValidating}
        />
      </div>
      
      {error && (
        <Alert className="bg-red-50 border-red-400 text-red-800">
          {error}
        </Alert>
      )}
      
      <Button 
        type="submit"
        disabled={!token || isValidating}
        className="w-full"
      >
        {isValidating ? 'Validating...' : 'Continue'}
      </Button>
    </form>
  );
  
  // Render registration form
  const renderRegistrationForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input 
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={isRegistering}
        />
        {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input 
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          disabled={isRegistering}
        />
        {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input 
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          disabled={isRegistering}
        />
        {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}
      </div>
      
      <div className="flex items-start space-x-2">
        <Checkbox 
          id="consent"
          checked={consentChecked}
          onCheckedChange={(checked) => setConsentChecked(checked === true)}
          disabled={isRegistering}
        />
        <Label htmlFor="consent" className="text-sm">
          I agree to allow the collection of anonymized usage data during the pilot study period.
          This data will help improve the platform and will not be shared with third parties.
        </Label>
      </div>
      
      {error && (
        <Alert className="bg-red-50 border-red-400 text-red-800">
          {error}
        </Alert>
      )}
      
      <Button 
        type="submit"
        disabled={isRegistering || !consentChecked}
        className="w-full"
      >
        {isRegistering ? 'Creating Account...' : 'Register for Pilot Study'}
      </Button>
    </form>
  );
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Energy Efficiency Platform
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Pilot Study Registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Participant type badge when valid */}
          {validationStatus === 'valid' && participantType && (
            <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-center">
              <p className="text-sm font-medium">
                Invitation valid for: {participantType.replace(/-/g, ' ')}
              </p>
            </div>
          )}
          
          {validationStatus === 'valid' 
            ? renderRegistrationForm() 
            : renderTokenValidationForm()
          }
        </Card>
      </div>
    </div>
  );
};

export default PilotStudyRegistration;
