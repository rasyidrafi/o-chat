import React from 'react';
import { motion } from 'framer-motion';

interface TabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
    animationsDisabled: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, animationsDisabled }) => {
    return (
        <button
            onClick={onClick}
            className={`relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none cursor-pointer 
                ${isActive 
                    ? 'text-pink-500' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
        >
            {label}
            {isActive && (
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                    layoutId="active-settings-tab-indicator"
                    transition={{ duration: animationsDisabled ? 0 : 0.2 }}
                />
            )}
        </button>
    );
};

export default TabButton;