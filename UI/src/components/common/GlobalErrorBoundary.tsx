import React from 'react';
import { Alert, Button } from '@mantine/core';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface GlobalErrorBoundaryProps {
  error: Error;
  resetErrorBoundary: (...args: any[]) => void;
}

export function GlobalErrorBoundary({ error, resetErrorBoundary }: GlobalErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[50vh] p-6">
      <div className="max-w-md w-full">
        <Alert
          icon={<AlertCircle size={16} />}
          title="Something went wrong"
          color="red"
          variant="filled"
          className="mb-4"
        >
          {error?.message || 'An unexpected error occurred.'}
        </Alert>
        <div className="flex justify-center">
          <Button
            leftSection={<RefreshCw size={16} />}
            onClick={resetErrorBoundary}
            variant="light"
            color="red"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
