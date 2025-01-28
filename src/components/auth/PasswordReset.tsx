// src/components/auth/PasswordReset.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

const PasswordReset: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/password-reset/validate-token/${token}`);
      const data = await response.json();
      setIsValid(data.isValid);
      
      if (!data.isValid) {
        setError('This password reset link has expired or is invalid.');
      }
    } catch (error) {
      setError('Failed to validate reset token.');
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    const validationErrors = validatePassword(password);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset password');
      }

      // Show success and redirect
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successful. Please login with your new password.' }
        });
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    if (!password) return null;

    const errors = validatePassword(password);
    const strength = Math.max(0, 4 - errors.length);
    const strengthText = ['Weak', 'Fair', 'Good', 'Strong'];
    const strengthColor = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
      <div className="mt-2">
        <div className="h-2 w-full bg-gray-200 rounded-full">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${strengthColor[strength - 1]}`}
            style={{ width: `${(strength / 4) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Password Strength: {strengthText[strength - 1]}
        </p>
      </div>
    );
  };

  if (!isValid) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <div className="text-center mb-8">
        <Lock className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Reset Your Password</h1>
        <p className="mt-2 text-gray-600">Enter your new password below</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {renderPasswordStrength()}
        </div>

        <div>
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-gray-700"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              Resetting Password...
              <ArrowRight className="ml-2 h-4 w-4 animate-pulse" />
            </span>
          ) : (
            <span className="flex items-center">
              Reset Password
              <CheckCircle className="ml-2 h-4 w-4" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default PasswordReset;