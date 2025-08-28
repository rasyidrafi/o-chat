import React, { useState } from "react";
import AdvancedFilter from "./AdvancedFilter";
import { MODEL_FILTER_CATEGORIES } from "../../constants/modelFilters";

interface FilterDemoProps {
  className?: string;
}

const FilterDemo: React.FC<FilterDemoProps> = ({ className = "" }) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleFilterChange = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId)
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const handleClearAll = () => {
    setSelectedFilters([]);
  };

  return (
    <div className={`p-6 bg-white dark:bg-zinc-900 ${className}`}>
      <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
        Model Capability Filter Demo
      </h2>
      
      <div className="space-y-6">
        {/* Desktop Version */}
        <div>
          <h3 className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Desktop Filter (Full Width)
          </h3>
          <AdvancedFilter
            categories={MODEL_FILTER_CATEGORIES}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            placeholder="Select model capabilities"
          />
        </div>

        {/* Compact Version */}
        <div className="max-w-xs">
          <h3 className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            Mobile Filter (Compact)
          </h3>
          <AdvancedFilter
            categories={MODEL_FILTER_CATEGORIES}
            selectedFilters={selectedFilters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            placeholder="Filter capabilities"
            className="w-full"
          />
        </div>

        {/* Selected Filters Display */}
        {selectedFilters.length > 0 && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <h4 className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              Selected Filters:
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedFilters.map(filterId => {
                const option = MODEL_FILTER_CATEGORIES
                  .flatMap(cat => cat.options)
                  .find(opt => opt.id === filterId);
                
                return (
                  <span
                    key={filterId}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                  >
                    {option?.label || filterId}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Future Capabilities Preview */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium mb-2 text-purple-700 dark:text-purple-300">
            🔮 Coming Soon: Future Capabilities
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded opacity-60">
              Video Generation ✨
            </span>
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded opacity-60">
              Audio Generation 🎵
            </span>
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded opacity-60">
              3D Generation 🧊
            </span>
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded opacity-60">
              Code Generation 💻
            </span>
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded opacity-60">
              Document Analysis 📄
            </span>
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
            The new filter system is designed to scale gracefully as we add more AI capabilities!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FilterDemo;
