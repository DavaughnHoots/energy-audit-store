import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import useAuth from '@/context/AuthContext';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ 
  isOpen, 
  onClose,
  isAuthenticated,
  onLogout
}) => {

  const navigationItems = [
    { name: 'Products', path: '/products' },
    { name: 'Energy Audit', path: '/energy-audit' },
    { name: 'Community', path: '/community' },
    { name: 'Education', path: '/education' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25" onClick={onClose} />
      
      {/* Menu panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="px-4 py-6">
          <ul className="space-y-4">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className="block py-2 text-base font-medium text-gray-900 hover:text-green-600"
                  onClick={onClose}
                >
                  {item.name}
                </Link>
              </li>
            ))}

            {isAuthenticated ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="block py-2 text-base font-medium text-gray-900 hover:text-green-600"
                    onClick={onClose}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                    className="block w-full text-left py-2 text-base font-medium text-gray-900 hover:text-green-600"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link
                    to="/sign-in"
                    className="block py-2 text-base font-medium text-gray-900 hover:text-green-600"
                    onClick={onClose}
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/sign-up"
                    className="block py-2 text-base font-medium text-green-600 hover:text-green-700"
                    onClick={onClose}
                  >
                    Get Started
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
