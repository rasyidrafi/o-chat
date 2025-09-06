import React from "react";
import { motion } from "framer-motion";
import LoadingState from "../../ui/LoadingState";
import { Info } from "../../Icons";
import { 
  LOADING_ANIMATION_DURATION,
  BAR_ANIMATION_DURATION,
  calculateBarWidth 
} from "../../../constants/settingsPageConstants";

interface UsageData {
  backedByServerCount: number;
  byokCount: number;
  totalConversations: number;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

interface UsageTabProps {
  usageData: UsageData;
  loadingState: LoadingState;
  onRetry: () => void;
  animationsDisabled: boolean;
}

const UsageTab: React.FC<UsageTabProps> = ({
  usageData,
  loadingState,
  onRetry,
  animationsDisabled,
}) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-foreground">
        Usage
      </h2>
      <p className="opacity-70 mb-6">
        Track your message usage across different sources
      </p>
      
      <div className="p-6 bg-muted rounded-lg">
        {loadingState.isLoading ? (
          <div className="h-50 flex items-center justify-center py-8">
            <LoadingState 
              message="Loading usage data..." 
              size="sm" 
              centerContent={true}
            />
          </div>
        ) : loadingState.error ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 text-sm mb-2">{loadingState.error}</div>
            <button 
              onClick={onRetry}
              className="text-xs text-blue-500 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={
              animationsDisabled ? {} : { opacity: 0, y: 10 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: animationsDisabled ? 0 : LOADING_ANIMATION_DURATION,
            }}
          >
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="opacity-80">
                  Conversations
                </span>
                <span className="opacity-60">
                  {usageData.totalConversations}
                </span>
              </div>
              <div className="w-full rounded-full h-2 bg-border">
                <motion.div
                  className="bg-gradient-to-r from-blue-400 to-blue-500 h-2 rounded-full"
                  initial={
                    animationsDisabled ? {} : { width: 0 }
                  }
                  animate={{
                    width: `${calculateBarWidth(usageData.totalConversations)}%`,
                  }}
                  transition={{
                    duration: animationsDisabled ? 0 : BAR_ANIMATION_DURATION,
                    ease: "easeOut",
                  }}
                />
              </div>
              <p className="text-sm opacity-60 mt-2">
                {usageData.totalConversations} total conversations
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                  Backed by Us
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                    Unlimited
                  </span>
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {usageData.backedByServerCount}
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full"
                  initial={
                    animationsDisabled ? {} : { width: 0 }
                  }
                  animate={{
                    width: `${calculateBarWidth(usageData.backedByServerCount)}%`,
                  }}
                  transition={{
                    duration: animationsDisabled ? 0 : BAR_ANIMATION_DURATION,
                    ease: "easeOut",
                    delay: animationsDisabled ? 0 : 0.1,
                  }}
                />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {usageData.backedByServerCount} messages sent
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                  Your Own API
                  <Info className="w-4 h-4 text-pink-500" />
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {usageData.byokCount}
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full"
                  initial={
                    animationsDisabled ? {} : { width: 0 }
                  }
                  animate={{
                    width: `${calculateBarWidth(usageData.byokCount)}%`,
                  }}
                  transition={{
                    duration: animationsDisabled ? 0 : BAR_ANIMATION_DURATION,
                    ease: "easeOut",
                    delay: animationsDisabled ? 0 : 0.2,
                  }}
                />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {usageData.byokCount} messages sent
              </p>
            </div>
            
            <div className="bg-zinc-200/50 dark:bg-zinc-900/50 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Server-backed messages are unlimited and free.
                Messages using your own API key are billed directly to
                you - please monitor your API usage and costs.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UsageTab;
