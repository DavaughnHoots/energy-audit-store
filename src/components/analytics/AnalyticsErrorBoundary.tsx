import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary specifically for analytics components
 * Prevents analytics errors from affecting the main application
 */
class AnalyticsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Analytics Error:', error, errorInfo);
    
    // In production, we could use a dedicated error tracking system
    // sendToErrorTracking(error, errorInfo);
  }

  // Reset error state when trying to recover
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    // If there's an error, just render the children without analytics
    // This way the main app functionality continues to work
    if (this.state.hasError) {
      // Log that analytics failed but app continues
      console.warn('Analytics disabled due to errors');
      
      // In the context of analytics, we just return the children
      // without the analytics wrapper, rather than showing an error UI
      return this.props.children;
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default AnalyticsErrorBoundary;
