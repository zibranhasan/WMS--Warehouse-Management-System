import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function PageErrorAlert({
  title = "Error loading data",
  message,
  onRetry,
}: PageErrorAlertProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-red-600/80 dark:text-red-400/80">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-200 text-red-700 hover:bg-red-100 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
