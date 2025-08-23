import React from 'react';

interface FontSizeOption {
    value: number;
    label: string;
}

interface FontSizeSelectorProps {
    options: FontSizeOption[];
    value: number;
    onChange: (value: number) => void;
    animationsDisabled: boolean;
}

const FontSizeSelector: React.FC<FontSizeSelectorProps> = ({ 
    options,
    value, 
    onChange, 
    animationsDisabled 
}) => {
    return (
        <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-zinc-100 dark:focus:ring-offset-zinc-800 ${
                        !animationsDisabled ? 'transition-all duration-200' : ''
                    } ${
                        value === option.value
                            ? 'bg-white dark:bg-zinc-700 text-pink-500 shadow-sm'
                            : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-zinc-700/50'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default FontSizeSelector;
