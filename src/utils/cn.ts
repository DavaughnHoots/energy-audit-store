import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to conditionally join class names together.
 * Uses clsx for conditional logic and tailwind-merge to handle class conflicts.
 * 
 * @example
 * cn('text-red-500', true && 'bg-blue-500', false && 'bg-green-500')
 * // => 'text-red-500 bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
