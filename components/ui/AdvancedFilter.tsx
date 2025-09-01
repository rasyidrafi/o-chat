import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Filter } from "../Icons";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterOption {
  id: string;
  label: string;
  category?: string;
  icon?: React.ComponentType<any>;
  color?: string;
}

export interface FilterCategory {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  options: FilterOption[];
}

interface AdvancedFilterProps {
  categories: FilterCategory[];
  selectedFilters: string[];
  onFilterChange: (filterId: string) => void;
  onClearAll: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  categories,
  selectedFilters,
  onFilterChange,
  onClearAll,
  placeholder = "Filter options",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredCategories = categories.map(category => ({
    ...category,
    options: category.options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.options.length > 0);

  const selectedCount = selectedFilters.length;
  const totalOptions = categories.reduce((acc, cat) => acc + cat.options.length, 0);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Filter Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center justify-between w-full px-4 py-2.5 text-left
          bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg
          text-zinc-900 dark:text-zinc-100 text-sm
          hover:bg-zinc-200 dark:hover:bg-zinc-700
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500
          transition-colors duration-200 cursor-pointer 
          ${isOpen ? 'ring-1 ring-pink-500 border-pink-500' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm">
            {selectedCount > 0 ? (
              <span>
                <span className="font-medium text-pink-600 dark:text-pink-400">
                  {selectedCount}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {" "}/{totalOptions} filters
                </span>
              </span>
            ) : (
              placeholder
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded transition-colors"
              title="Clear all filters"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-700">
              <input
                type="text"
                placeholder="Search filters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Filter Options */}
            <div 
              className="max-h-80 overflow-y-auto thin-scrollbar"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0px, black 16px, black calc(100% - 16px), transparent 100%)'
              }}
            >
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category, categoryIndex) => (
                  <div key={category.id} className="p-2">
                    {/* Category Header */}
                    {categories.length > 1 && (
                      <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide sticky top-0 bg-white dark:bg-zinc-800">
                        {category.icon && <category.icon className="w-3 h-3" />}
                        {category.label}
                      </div>
                    )}

                    {/* Category Options */}
                    <div className="space-y-1">
                      {category.options.map((option) => {
                        const isSelected = selectedFilters.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => onFilterChange(option.id)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md
                              transition-colors duration-150 cursor-pointer
                              ${isSelected
                                ? `bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 ${option.color ? `bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-700 dark:text-${option.color}-300` : ''}`
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              }
                            `}
                          >
                            {/* Selection Indicator */}
                            <div className={`
                              w-4 h-4 rounded border-2 flex items-center justify-center
                              ${isSelected
                                ? "bg-pink-500 border-pink-500"
                                : "border-zinc-300 dark:border-zinc-600"
                              }
                            `}>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-white rounded-full"
                                />
                              )}
                            </div>

                            {/* Option Icon */}
                            {option.icon && (
                              <option.icon className="w-4 h-4 text-current" />
                            )}

                            {/* Option Label */}
                            <span className="flex-1 text-left">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Category Separator */}
                    {categoryIndex < filteredCategories.length - 1 && (
                      <div className="mt-3 border-t border-zinc-200 dark:border-zinc-600" />
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No filters found matching "{searchQuery}"
                </div>
              )}
            </div>

            {/* Footer with Clear All */}
            {selectedCount > 0 && (
              <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
                <button
                  onClick={() => {
                    onClearAll();
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Filters Pills (Optional - can be shown below the dropdown) */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedFilters.map((filterId) => {
            const option = categories
              .flatMap(cat => cat.options)
              .find(opt => opt.id === filterId);
            
            if (!option) return null;

            return (
              <motion.div
                key={filterId}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`
                  inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full
                  bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300
                  ${option.color ? `bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-700 dark:text-${option.color}-300` : ''}
                `}
              >
                {option.icon && <option.icon className="w-3 h-3" />}
                <span>{option.label}</span>
                <button
                  onClick={() => onFilterChange(filterId)}
                  className="p-0.5 hover:bg-pink-200 dark:hover:bg-pink-800/50 rounded-full transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilter;
