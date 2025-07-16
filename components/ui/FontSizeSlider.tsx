import React from 'react';

interface FontSizeSliderProps {
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    animationsDisabled: boolean;
}

const FontSizeSlider: React.FC<FontSizeSliderProps> = ({ 
    label, 
    description, 
    value, 
    onChange, 
    animationsDisabled 
}) => {
    const fontSizeOptions = [
        { value: 1, label: 'Small' },
        { value: 2, label: 'Default' },
        { value: 3, label: 'Large' },
        { value: 4, label: 'Extra Large' }
    ];

    const currentOption = fontSizeOptions.find(option => option.value === value) || fontSizeOptions[1];

    return (
        <div>
            <h4 className="font-medium text-zinc-900 dark:text-white">{label}</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{description}</p>
            
            <div className="space-y-4">
                {/* Slider */}
                <div className="relative">
                    <input
                        type="range"
                        min="1"
                        max="4"
                        step="1"
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    
                    {/* Slider track marks */}
                    <div className="flex justify-between mt-2 px-1">
                        {fontSizeOptions.map((option) => (
                            <div key={option.value} className="flex flex-col items-center">
                                <div 
                                    className={`w-2 h-2 rounded-full ${
                                        value >= option.value 
                                            ? 'bg-pink-500' 
                                            : 'bg-zinc-300 dark:bg-zinc-600'
                                    } ${!animationsDisabled ? 'transition-colors duration-200' : ''}`}
                                />
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

                {/* Current selection display */}
                <div className="text-center">
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        Current: {currentOption.label}
                    </span>
                </div>
            </div>

            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #ec4899;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #ec4899;
                    cursor: pointer;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                .slider::-webkit-slider-track {
                    height: 8px;
                    border-radius: 4px;
                }

                .slider::-moz-range-track {
                    height: 8px;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default FontSizeSlider;