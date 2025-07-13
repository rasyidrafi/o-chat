import React from 'react';

interface SettingsToggleProps {
    label: string;
    description: string;
    isOn: boolean;
    onToggle: () => void;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ label, description, isOn, onToggle }) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h4 className="font-medium text-zinc-900 dark:text-white">{label}</h4>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={isOn}
                onClick={onToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:ring-offset-zinc-800 ${
                    isOn ? 'bg-pink-500' : 'bg-zinc-300 dark:bg-zinc-700'
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isOn ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );
};

export default SettingsToggle;