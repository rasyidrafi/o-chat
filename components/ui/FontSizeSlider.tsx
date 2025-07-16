import React from 'react';

interface FontSizeSliderProps {
    value: number;
    onChange: (value: number) => void;
    animationsDisabled: boolean;
}

const FontSizeSlider: React.FC<FontSizeSliderProps> = ({ 
    value, 
    onChange, 
    animationsDisabled 
}) => {
    const fontSizeOptions = [
        { value: 1, label: 'Default' },
        { value: 2, label: 'Big' },
        { value: 3, label: 'Large' }
    ];

    const currentOption = fontSizeOptions.find(option => option.value === value) || fontSizeOptions[0];

    return (
        <div className="space-y-4">
            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min="1"
                    max="3"
                    step="1"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                />
                
                {/* Slider track marks */}
                <div className="flex justify-between mt-2 px-1">
                    {fontSizeOptions.map((option) => (
                        <div key={option.value} className="flex flex-col items-center">
                            <span className={`text-xs mt-1 ${
                                value === option.value 
                                    ? 'text-pink-500 font-medium' 
                                    : 'text-zinc-500 dark:text-zinc-400'
                            } ${!animationsDisabled ? 'transition-colors duration-200' : ''}`}>
                                {option.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FontSizeSlider;