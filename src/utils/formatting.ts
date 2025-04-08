/**
 * Utility functions for formatting values safely
 */

/**
 * Format a Date object to a human-readable string
 * @param date Date to format
 * @returns Formatted date string like "March 28, 2025"
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats a number as currency with dollar sign
 * Safely handles undefined or null values
 * @param value Number to format as currency
 * @param fallback Optional fallback value if input is undefined/null (defaults to "$0")
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | undefined | null, fallback: string = "$0"): string => {
  // Check if value is undefined, null, or NaN
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  
  // Format the number with dollar sign and commas
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Formats a number as percentage
 * Safely handles undefined or null values
 * @param value Number to format as percentage (e.g., 0.45 becomes "45%")
 * @param decimals Number of decimal places to display
 * @param fallback Optional fallback value if input is undefined/null (defaults to "0%")
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number | undefined | null,
  decimals: number = 1,
  fallback: string = "0%"
): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Formats a number with commas and optional decimal places
 * Safely handles undefined or null values
 * @param value Number to format
 * @param decimals Number of decimal places to display
 * @param fallback Optional fallback value if input is undefined/null (defaults to "0")
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number | undefined | null,
  decimals: number = 0,
  fallback: string = "0"
): string => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return fallback;
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};
