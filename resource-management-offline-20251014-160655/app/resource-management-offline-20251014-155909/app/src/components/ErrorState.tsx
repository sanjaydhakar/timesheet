import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Unable to Connect
        </h2>
        <p className="text-gray-600 mb-6">
          {error || 'Failed to load data from the server. Please make sure the backend server is running.'}
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 font-semibold mb-2">Quick fixes:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Ensure PostgreSQL is running</li>
            <li>• Start the backend server: <code className="bg-gray-200 px-1 rounded">cd server && npm run dev</code></li>
            <li>• Check database connection in <code className="bg-gray-200 px-1 rounded">server/.env</code></li>
            <li>• Verify API URL in <code className="bg-gray-200 px-1 rounded">.env</code></li>
          </ul>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 w-full"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;

