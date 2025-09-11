import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '../Icons';
import Button from '../ui/Button';
import { ConflictData } from '../../services/cloudStorageService';

interface CloudConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictData: ConflictData;
  onResolve: (resolution: 'local' | 'cloud' | 'merge') => void;
  animationsDisabled?: boolean;
}

const CloudConflictModal: React.FC<CloudConflictModalProps> = ({
  isOpen,
  onClose,
  conflictData,
  onResolve,
  animationsDisabled = false,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<'local' | 'cloud' | 'merge' | null>(null);

  const handleResolve = () => {
    if (selectedResolution) {
      onResolve(selectedResolution);
      onClose();
    }
  };

  const getConflictDescription = () => {
    switch (conflictData.conflictType) {
      case 'providers':
        return 'Your API providers (keys and endpoints) differ between this device and the cloud.';
      case 'models':
        return 'Your selected models differ between this device and the cloud.';
      case 'all':
        return 'Both your API providers and selected models differ between this device and the cloud.';
      default:
        return 'Your data differs between this device and the cloud.';
    }
  };

  const getDataSummary = (data: any) => {
    const providers = data.customProviders?.length || 0;
    const serverModels = data.selectedServerModels?.length || 0;
    const providerModelsCount = Object.keys(data.selectedProviderModels || {}).reduce((acc, key) => {
      return acc + (data.selectedProviderModels[key]?.length || 0);
    }, 0);

    return {
      providers,
      serverModels,
      providerModels: providerModelsCount,
      lastUpdated: data.lastUpdated,
      deviceId: data.deviceId,
    };
  };

  const localSummary = getDataSummary(conflictData.localData);
  const cloudSummary = getDataSummary(conflictData.cloudData);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={animationsDisabled ? {} : { opacity: 0, scale: 0.95 }}
          animate={animationsDisabled ? {} : { opacity: 1, scale: 1 }}
          exit={animationsDisabled ? {} : { opacity: 0, scale: 0.95 }}
          transition={animationsDisabled ? {} : { duration: 0.2 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-zinc-900 rounded-t-2xl border-b border-zinc-200 dark:border-zinc-700 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <div className="w-6 h-6 text-amber-600 dark:text-amber-400">📊</div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Data Sync Conflict
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Choose which version to keep
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Conflict Description */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                {getConflictDescription()}
              </p>
            </div>

            {/* Data Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Local Data */}
              <div className={`border rounded-lg p-4 ${
                selectedResolution === 'local' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 text-zinc-600 dark:text-zinc-400">💻</div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">This Device</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">API Providers:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{localSummary.providers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">System Models:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{localSummary.serverModels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Provider Models:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{localSummary.providerModels}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-600">
                    <span className="text-zinc-600 dark:text-zinc-400">Last Updated:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {formatDate(localSummary.lastUpdated)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedResolution('local')}
                  className={`w-full mt-4 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedResolution === 'local'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  Use This Device's Data
                </button>
              </div>

              {/* Cloud Data */}
              <div className={`border rounded-lg p-4 ${
                selectedResolution === 'cloud' 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 text-zinc-600 dark:text-zinc-400">☁️</div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Cloud</h3>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">API Providers:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{cloudSummary.providers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">System Models:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{cloudSummary.serverModels}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Provider Models:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">{cloudSummary.providerModels}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-600">
                    <span className="text-zinc-600 dark:text-zinc-400">Last Updated:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {formatDate(cloudSummary.lastUpdated)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedResolution('cloud')}
                  className={`w-full mt-4 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedResolution === 'cloud'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                  }`}
                >
                  Use Cloud Data
                </button>
              </div>
            </div>

            {/* Merge Option */}
            <div className={`border rounded-lg p-4 ${
              selectedResolution === 'merge' 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-zinc-200 dark:border-zinc-700'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 text-zinc-600 dark:text-zinc-400">🔀</div>
                <h3 className="font-semibold text-zinc-900 dark:text-white">Smart Merge</h3>
              </div>
              
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Intelligently combine both versions, keeping the most recent data and avoiding duplicates. 
                This is the safest option if you're unsure.
              </p>

              <button
                onClick={() => setSelectedResolution('merge')}
                className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  selectedResolution === 'merge'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600'
                }`}
              >
                Merge Both Versions
              </button>
            </div>

            {/* Warning */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 text-red-600 dark:text-red-400">⚠️</div>
                <h4 className="font-medium text-red-800 dark:text-red-200">Important</h4>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300">
                This choice will overwrite the non-selected version. The action cannot be undone, 
                but you can always reconfigure your settings later.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-zinc-900 rounded-b-2xl border-t border-zinc-200 dark:border-zinc-700 p-6 flex justify-end gap-3">
            <Button
              onClick={onClose}
              className="bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!selectedResolution}
              className={`${
                selectedResolution
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              Apply Choice
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CloudConflictModal;
