// src/components/layout/Header.tsx

import React from 'react';
import { Menu, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuth from '@/context/AuthContext';
import logo from '../../assets/website logo.png';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <img src={logo} alt="Energy Efficient Shop Logo" className="h-8 w-auto" />
              <h1 className="text-2xl font-bold text-green-600">Energy Efficient Shop</h1>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {['Products', 'Energy Audit', 'Community', 'Education'].map((item) => (
            <a
              key={item}
              href={`/${item.toLowerCase().replace(' ', '-')}`}
              className="border-transparent text-gray-500 hover:border-green-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
            >
              {item}
            </a>
          ))}
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  <User className="h-5 w-5" />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/sign-in"
                  className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600"
                >
                  Get Started
                </Link>
              </>
            )}
            
            {/* Mobile menu button */}
            <button className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
