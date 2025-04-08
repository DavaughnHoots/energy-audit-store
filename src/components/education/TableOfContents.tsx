import React from 'react';

interface TableOfContentsItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ items }) => {
  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Table of Contents</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="hover:bg-gray-100 rounded transition-colors">
            <button
              onClick={() => handleClick(item.id)}
              className="w-full text-left px-3 py-2 text-gray-700 hover:text-green-600 focus:outline-none focus:ring-1 focus:ring-green-500 rounded"
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