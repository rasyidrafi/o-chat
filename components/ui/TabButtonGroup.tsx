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
        <div className="inline-flex rounded-lg bg-muted p-1">
            {options.map((option) => (
                <button
                    key={String(option.value)}
                    onClick={() => onChange(option.value)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-muted cursor-pointer ${
                        !animationsDisabled ? 'transition-all duration-200' : ''
                    } ${
                        value === option.value
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-foreground/60 hover:text-foreground hover:bg-card/50'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default TabButtonGroup;
