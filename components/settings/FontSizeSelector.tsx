import React from 'react';
import TabButtonGroup from '../ui/TabButtonGroup';

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
        <TabButtonGroup
            options={options}
            value={value}
            onChange={onChange}
            animationsDisabled={animationsDisabled}
        />
    );
};

export default FontSizeSelector;
