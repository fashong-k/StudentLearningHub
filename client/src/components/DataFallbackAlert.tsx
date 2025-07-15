import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataFallbackAlertProps {
  isVisible: boolean;
  failedEndpoints: string[];
  onDismiss: () => void;
}

export function DataFallbackAlert({ isVisible, failedEndpoints, onDismiss }: DataFallbackAlertProps) {
  if (!isVisible || failedEndpoints.length === 0) return null;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>Demo Mode Active:</strong> Database connection failed for {failedEndpoints.join(', ')}. 
          Displaying sample data instead.
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss}
          className="h-auto p-1 hover:bg-orange-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
}