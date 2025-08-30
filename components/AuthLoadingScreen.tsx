import React from 'react';

interface AuthLoadingScreenProps {
  className?: string;
}

const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-white dark:bg-[#1c1c1c] ${className}`}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Initializing...
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Setting up your chat environment
        </div>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
