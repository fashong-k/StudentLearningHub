import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DataFallbackState {
  isUsingFallback: boolean;
  failedEndpoints: string[];
  showAlert: boolean;
}

export function useDataFallback() {
  const [state, setState] = useState<DataFallbackState>({
    isUsingFallback: false,
    failedEndpoints: [],
    showAlert: false
  });
  const { toast } = useToast();

  const reportFailure = (endpoint: string, error: any) => {
    const isDemoMode = import.meta.env.VITE_RUN_MODE === 'demo';
    
    setState(prev => ({
      ...prev,
      isUsingFallback: isDemoMode,
      failedEndpoints: [...prev.failedEndpoints.filter(e => e !== endpoint), endpoint],
      showAlert: isDemoMode
    }));

    if (isDemoMode) {
      console.warn(`Database retrieval failed for ${endpoint}, using sample data:`, error);
      
      // Show toast notification
      toast({
        title: "Using Demo Data",
        description: `Database connection failed for ${endpoint}. Displaying sample data instead.`,
        variant: "destructive",
      });
    } else {
      console.error(`Database retrieval failed for ${endpoint}:`, error);
      toast({
        title: "Data Load Error",
        description: `Failed to load data from ${endpoint}. Please refresh the page.`,
        variant: "destructive",
      });
    }
  };

  const clearFailures = () => {
    setState({
      isUsingFallback: false,
      failedEndpoints: [],
      showAlert: false
    });
  };

  return {
    ...state,
    reportFailure,
    clearFailures
  };
}