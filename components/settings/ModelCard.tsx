import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Google } from '../Icons';

interface ModelCardProps {
    name: string;
    description: string;
    features: string[];
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
    animationsDisabled?: boolean;
    showMoreInitially?: boolean;
    logo?: string;
    disabled?: boolean;
}

const ModelCard: React.FC<ModelCardProps> = ({
    name,
    description,
    features,
    isEnabled,
    onToggle,
    animationsDisabled = false,
    showMoreInitially = false,
    logo,
    disabled = false
}) => {
    const [showMore, setShowMore] = useState(showMoreInitially);
    const [isMultiLine, setIsMultiLine] = useState(false);
    const descriptionRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (descriptionRef.current) {
            const lineHeight = parseInt(window.getComputedStyle(descriptionRef.current).lineHeight);
            const height = descriptionRef.current.offsetHeight;
            setIsMultiLine(height > lineHeight * 1.5);
        }
    }, [description]);

    const getFeatureColor = (feature: string) => {
        switch (feature.toLowerCase()) {
            case 'tool calling':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400';
            case 'reasoning':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400';
            case 'vision':
                return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
            case 'search url':
                return 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400';
            default:
                return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
        }
    };

    const renderLogo = () => {
        if (logo === 'google') {
            return (
                <div className="w-10 h-10 bg-white dark:bg-zinc-700 rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-600">
                    <Google className="w-6 h-6 text-blue-500" />
                </div>
            );
        }
        
        return (
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">{name.charAt(0)}</span>
            </div>
        );
    };

    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-6 border border-zinc-200 dark:border-zinc-700 h-full flex flex-col">
            <div className="flex items-start justify-between">
                <div className="flex-1 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                        {renderLogo()}
                        <div>
                            <h3 className="font-semibold text-zinc-900 dark:text-white">{name}</h3>
                        </div>
                    </div>
                    
                    <motion.div
                        initial={false}
                        animate={animationsDisabled ? false : { height: "auto" }}
                        transition={animationsDisabled ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden flex-1"
                    >
                        <p 
                            ref={descriptionRef}
                            className={`text-left text-sm text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed ${!showMore && isMultiLine ? 'line-clamp-2' : ''}`}
                        >
                            {description}
                        </p>
                    </motion.div>

                    {/* Show more/less button only for multi-line descriptions - above features */}
                    {isMultiLine && (
                        <motion.button
                            onClick={() => setShowMore(!showMore)}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 font-medium px-2 py-1 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm z-10"
                            whileHover={animationsDisabled ? {} : { scale: 1.02 }}
                            whileTap={animationsDisabled ? {} : { scale: 0.98 }}
                            transition={animationsDisabled ? { duration: 0 } : { duration: 0.1 }}
                        >
                            {showMore ? 'Show less' : 'Show more'}
                        </motion.button>
                    )}

                    {/* Always show features - pushed to bottom */}
                    <div className="flex flex-wrap gap-2 mb-3 mt-auto">
                        {features.map((feature) => (
                            <span
                                key={feature}
                                className={`text-xs font-medium px-2 py-1 rounded-full ${getFeatureColor(feature)}`}
                            >
                                {feature}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="ml-4">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={() => !disabled && onToggle(!isEnabled)}
                        disabled={disabled}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:ring-offset-zinc-800 ${
                            disabled 
                                ? `cursor-not-allowed ${isEnabled ? 'bg-purple-300 dark:bg-purple-600/50' : 'bg-zinc-300 dark:bg-zinc-600'}`
                                : `cursor-pointer ${isEnabled ? 'bg-pink-500' : 'bg-zinc-300 dark:bg-zinc-600'}`
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelCard;