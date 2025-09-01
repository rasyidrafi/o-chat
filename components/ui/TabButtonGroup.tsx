interface TabButtonGroupOption<T> {
    value: T;
    label: string;
}

interface TabButtonGroupProps<T> {
    options: TabButtonGroupOption<T>[];
    value: T;
    onChange: (value: T) => void;
    animationsDisabled?: boolean;
}

const TabButtonGroup = <T extends string | number | boolean>({ 
    options,
    value, 
    onChange, 
    animationsDisabled = false 
}: TabButtonGroupProps<T>) => {
    return (
        <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1">
            {options.map((option) => (
                <button
                    key={String(option.value)}
                    onClick={() => onChange(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-zinc-100 dark:focus:ring-offset-zinc-800 cursor-pointer ${
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

export default TabButtonGroup;
