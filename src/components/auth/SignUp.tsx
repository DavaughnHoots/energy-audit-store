// src/components/auth/SignUp.tsx

import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SignUp = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    termsAccepted: false
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Load saved form data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('signupFormData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setFormData(prev => ({
        ...prev,
        ...parsedData
      }));
    }
  }, []);

  // Save form progress
  useEffect(() => {
    const dataToSave = { ...formData };
    delete dataToSave.password;
    delete dataToSave.confirmPassword;
    localStorage.setItem('signupFormData', JSON.stringify(dataToSave));
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (step === 1) {
      if (!formData.fullName || formData.fullName.length < 2) {
        setError('Full name is required and must be at least 2 characters');
        return false;
      }
      if (!formData.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        setError('Valid email is required');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }

    if (step === 2) {
      if (formData.phone && !formData.phone.match(/^\+?[\d\s-]+$/)) {
        setError('Invalid phone format');
        return false;
      }
      if (!formData.termsAccepted) {
        setError('You must accept the terms and conditions');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    if (step === 1) {
      setStep(2);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Clear saved form data
      localStorage.removeItem('signupFormData');

      // Redirect to verification page
      window.location.href = '/verify-email';
      
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={formData.fullName}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={formData.email}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={formData.password}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={formData.confirmPassword}
            onChange={handleInputChange}
          />
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address (optional)
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>

        <div className="flex items-center">
          <input
            id="termsAccepted"
            name="termsAccepted"
            type="checkbox"
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            checked={formData.termsAccepted}
            onChange={handleInputChange}
          />
          <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-900">
            I accept the <a href="/terms" className="text-green-600 hover:text-green-500">terms and conditions</a>
          </label>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto my-12">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>
          
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between">
              <span className={`text-sm ${step >= 1 ? 'text-green-600' : 'text-gray-500'}`}>
                Basic Info
              </span>
              <span className={`text-sm ${step >= 2 ? 'text-green-600' : 'text-gray-500'}`}>
                Additional Details
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-green-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? renderStep1() : renderStep2()}

            <div className="flex justify-between">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 ml-3 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : step === 1 ? 'Next' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/signin" className="text-green-600 hover:text-green-500 font-medium">
                Sign in
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;