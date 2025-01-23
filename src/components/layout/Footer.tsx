// src/components/layout/Footer.tsx

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Energy Efficient Store</h3>
            <p className="text-sm text-gray-600">
              Making energy efficiency accessible and affordable for everyone.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {['Products', 'Energy Audit', 'Community', 'About Us'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-2">
              {['Blog', 'Guides', 'FAQ', 'Support'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Contact</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="mailto:support@ees.com" className="text-sm text-gray-600 hover:text-gray-900">
                  support@ees.com
                </a>
              </li>
              <li className="text-sm text-gray-600">
                1234 Green Street
                <br />
                Eco City, EC 12345
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400 text-center">
            © {new Date().getFullYear()} Energy Efficient Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;