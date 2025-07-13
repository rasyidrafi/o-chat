import React from 'react';

interface SettingsInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    placeholder: string;
    description?: string;
}

const SettingsInput: React.FC<SettingsInputProps> = ({ label, value, onChange, maxLength, placeholder, description }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-300 mb-1">{label}</label>
            {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">{description}</p>}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 dark:text-zinc-400">
                    {value.length}/{maxLength}
                </span>
            </div>
        </div>
    );
};

export default SettingsInput;
