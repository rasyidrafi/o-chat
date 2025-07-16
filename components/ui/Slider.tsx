import React from 'react';

interface SliderOption {
    value: number;
    label: string;
}

interface SliderProps {
    options: SliderOption[];
    value: number;
    onChange: (value: number) => void;
    animationsDisabled: boolean;
}

const Slider: React.FC<SliderProps> = ({ 
    options,
    value, 
    onChange, 
    animationsDisabled 
}) => {
    const minValue = Math.min(...options.map(opt => opt.value));
    const maxValue = Math.max(...options.map(opt => opt.value));
    const step = options.length > 1 ? (maxValue - minValue) / (options.length - 1) : 0.1;

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value);
        
        // Find the closest option value
        let closestOption = options[0];
        let minDistance = Math.abs(newValue - options[0].value);
        
        for (const option of options) {
            const distance = Math.abs(newValue - option.value);
            if (distance < minDistance) {
                minDistance = distance;
                closestOption = option;
            }
        }
        
        onChange(closestOption.value);
    };

    const currentOption = options.find(option => option.value === value) || options[0];

    return (
        <div className="space-y-4">
            {/* Slider */}
            <div className="relative">
                <input
                    type="range"
                    min={minValue}
                    max={maxValue}
                    step={step}
                    value={value}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                />
                
                {/* Slider track marks */}
                <div className="flex justify-between mt-2">
                    {options.map((option) => (
                        <div key={option.value} className="flex flex-col items-center flex-1">
                            <span className={`text-xs mt-1 text-center ${
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

export default Slider;