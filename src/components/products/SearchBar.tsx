import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  onSearch,
  placeholder = 'Search products...'
}) => {
  const [searchInput, setSearchInput] = useState(initialValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearch(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          value={searchInput}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 text-white py-1 px-3 rounded-md text-sm"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
