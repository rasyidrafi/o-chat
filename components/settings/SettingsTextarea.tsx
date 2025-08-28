import React from 'react';

interface SettingsTextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    placeholder: string;
}

const SettingsTextarea: React.FC<SettingsTextareaProps> = ({ label, value, onChange, maxLength, placeholder }) => {
    return (
        <div>
            <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-300 mb-2">{label}</label>
            <div className="relative">
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    placeholder={placeholder}
                    className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 min-h-[120px] resize-y thin-scrollbar"
                />
                <span className="absolute right-3 bottom-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {value.length}/{maxLength}
                </span>
            </div>
        </div>
    );
};

export default SettingsTextarea;
