import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ icon, className, ...props }) => {
    return (
        <div className="relative">
            {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">{icon}</span>}
            <input
                {...props}
                className={`w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors ${icon ? 'pl-10' : ''} ${className}`}
            />
        </div>
    );
};

export default Input;
