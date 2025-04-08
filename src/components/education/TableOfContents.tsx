import React from 'react';

interface TableOfContentsItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: offsetTop - 100, // Account for header/margins
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Table of Contents</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => scrollToSection(item.id)}
              className="text-green-600 hover:text-green-800 hover:underline transition-colors text-left w-full"
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TableOfContents;