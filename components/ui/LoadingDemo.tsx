import React, { useState } from "react";
import { LoadingOverlay, LoadingSpinner } from "./LoadingOverlay";
import { motion } from "framer-motion";

const LoadingDemo: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);

  const simulateLoading = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Loading Overlay Improvements</h2>
        
        {/* Demo area */}
        <div className="relative bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6 min-h-[300px] border">
          <LoadingOverlay
            isVisible={showOverlay}
            title="Loading server models..."
            subtitle="We're fetching the latest AI models from our servers. This may take a moment."
          />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Model Cards</h3>
              <button
                onClick={simulateLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Simulate Loading
              </button>
            </div>
            
            {/* Mock model cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  className={`p-4 bg-white dark:bg-zinc-700 rounded-lg border transition-opacity ${
                    showOverlay ? 'opacity-30' : 'opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      M{i}
                    </div>
                    <h4 className="font-medium">Model {i}</h4>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    A powerful AI model for various tasks.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                      Text
                    </span>
                    <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                      Vision
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Loading spinner examples */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Loading Spinner Sizes</h3>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Small</span>
            </div>
            <div className="flex items-center gap-2">
              <LoadingSpinner size="md" />
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <LoadingSpinner size="lg" />
              <span className="text-sm">Large</span>
            </div>
          </div>
        </div>
        
        {/* Improvements list */}
        <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="text-green-800 dark:text-green-200 font-medium mb-2">
            ✨ Loading UI Improvements
          </h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Semi-transparent overlay with backdrop blur</li>
            <li>• Enhanced loading spinner with multiple rings</li>
            <li>• Smooth animations and transitions</li>
            <li>• Better loading messages and descriptions</li>
            <li>• Models fade to 30% opacity during loading</li>
            <li>• Models are disabled during loading to prevent interaction</li>
            <li>• Consistent loading state across both server and BYOK models</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemo;
