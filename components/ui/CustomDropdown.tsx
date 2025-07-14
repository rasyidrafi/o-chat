import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from '../Icons';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomDropdownProps {
    label: string;
    description: string;
    options: string[];
    selected: string;
    onSelect: (option: string) => void;
    animationsDisabled: boolean;
    disabledOptions?: string[];
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, description, options, selected, onSelect, animationsDisabled, disabledOptions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (option: string) => {
        onSelect(option);
        setIsOpen(false);
    };

    const animationVariants = {
        enter: {
            opacity: 1,
            y: 0,
            transition: {
                duration: animationsDisabled ? 0 : 0.2,
            },
        },
        exit: {
            opacity: 0,
            y: -5,
            transition: {
                duration: animationsDisabled ? 0 : 0.15,
            },
        },
    };

    return (
        <div ref={dropdownRef}>
            <h4 className="font-medium text-zinc-900 dark:text-white">{label}</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{description}</p>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between text-left bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                >
                    <span>{selected}</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            variants={animationVariants}
                            initial="exit"
                            animate="enter"
                            exit="exit"
                            className="absolute z-10 mt-1 w-full bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                        >
                            <ul className="py-1 max-h-60 overflow-y-auto thin-scrollbar">
                                {options.map(option => {
                                    const isDisabled = disabledOptions?.includes(option) || false;
                                    return (
                                        <li key={option}>
                                            <button
                                                onClick={() => !isDisabled && handleSelect(option)}
                                                disabled={isDisabled}
                                                className={`w-full text-left flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                    isDisabled
                                                        ? 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                                                        : 'text-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer'
                                                }`}
                                            >
                                                <span>{option}</span>
                                                {selected === option && <Check className="w-4 h-4 text-pink-500" />}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default CustomDropdown;
