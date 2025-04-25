import { useState, useEffect } from 'react';

/**
 * Hook for managing a persistent checklist in localStorage
 * 
 * @param key - The localStorage key to use for storage
 * @param initialItems - Initial list of checklist items
 * @returns Object with checklist state and functions to manipulate it
 */
export default function useLocalStorageChecklist(
  key: string,
  initialItems: string[]
) {
  // Setup checked items state with data from localStorage or empty array
  const [checkedItems, setCheckedItems] = useState<string[]>(() => {
    // Try to get stored values first
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  });

  // Save checked items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(checkedItems));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [checkedItems, key]);

  // Function to toggle item checked state
  const toggleItem = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item) 
        : [...prev, item]
    );
  };

  // Function to check if an item is checked
  const isChecked = (item: string): boolean => {
    return checkedItems.includes(item);
  };

  // Function to reset all items
  const resetItems = () => {
    setCheckedItems([]);
  };

  // Return the current state and functions to manipulate it
  return {
    checkedItems,
    toggleItem,
    isChecked,
    resetItems
  };
}
