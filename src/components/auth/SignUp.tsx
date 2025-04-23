// src/components/auth/SignUp.tsx

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  termsAccepted: boolean;
}

const SignUp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const auditId = searchParams.get('auditId');
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: '',
    termsAccepted: false
  });
  
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);

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
    const { password, confirmPassword, ...dataToSave } = formData;
    localStorage.setItem('signupFormData', JSON.stringify(dataToSave));
  }, [formData]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      // Password validation with the same requirements as backend
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|])[A-Za-z\d!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError('Password must be at least 8 characters long and contain uppercase, lowercase, number, and a special character (!@#$%^&*()_+-=[]{};\'",./<>?\\|)');
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          auditId: auditId || undefined
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Clear saved form data
      localStorage.removeItem('signupFormData');

      // Redirect to energy audit page
      if (auditId) {
        window.location.href = `/energy-audit/${auditId}/report`;
      } else {
        window.location.href = '/energy-audit';
      }
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
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
            I accept the <Link to="/terms" className="text-green-600 hover:text-green-500">terms and conditions</Link>
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
              <Link to="/sign-in" className="text-green-600 hover:text-green-500 font-medium">
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
