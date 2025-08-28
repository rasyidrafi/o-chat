import { useState, useCallback } from 'react';

interface UsePaginationProps {
  itemsPerPage: number;
  initialPage?: number;
}

interface PaginationResult<T> {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  getPaginatedItems: (items: T[]) => T[];
  getPaginationInfo: (totalItems: number) => {
    startIndex: number;
    endIndex: number;
    totalPages: number;
    totalItems: number;
  };
}

/**
 * Custom hook for pagination logic
 * Provides reusable pagination functionality with performance optimizations
 */
export const usePagination = <T>({ 
  itemsPerPage, 
  initialPage = 1 
}: UsePaginationProps): PaginationResult<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Memoized pagination handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  // Memoized pagination calculation
  const getPaginationInfo = useCallback((totalItems: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const safePage = Math.min(currentPage, totalPages || 1);
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      startIndex,
      endIndex,
      totalPages,
      totalItems,
    };
  }, [currentPage, itemsPerPage]);

  // Memoized item pagination
  const getPaginatedItems = useCallback((items: T[]) => {
    const { startIndex, endIndex } = getPaginationInfo(items.length);
    return items.slice(startIndex, endIndex);
  }, [getPaginationInfo]);

  return {
    currentPage,
    itemsPerPage,
    get totalPages() {
      return 0; // This will be calculated dynamically
    },
    get hasNextPage() {
      return false; // This will be calculated dynamically
    },
    get hasPreviousPage() {
      return currentPage > 1;
    },
    goToPage,
    nextPage,
    previousPage,
    getPaginatedItems,
    getPaginationInfo,
  };
};

/**
 * Custom hook for search and filtering functionality
 */
interface UseSearchAndFilterProps {
  initialSearchQuery?: string;
  initialSelectedFeatures?: string[];
}

export const useSearchAndFilter = ({ 
  initialSearchQuery = "", 
  initialSelectedFeatures = [] 
}: UseSearchAndFilterProps = {}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialSelectedFeatures);

  // Memoized search handler
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Memoized feature toggle handler
  const handleFeatureToggle = useCallback((feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedFeatures([]);
  }, []);

  // Generic filter function
  const filterItems = useCallback(<T extends Record<string, any>>(
    items: T[],
    searchFields: (keyof T)[],
    featureField?: keyof T
  ) => {
    return items.filter(item => {
      // Search filtering
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchFields.some(field => 
          String(item[field]).toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Feature filtering
      if (selectedFeatures.length > 0 && featureField) {
        const itemFeatures = item[featureField] as string[];
        if (!Array.isArray(itemFeatures)) return false;
        
        const matchesFeatures = selectedFeatures.every(feature =>
          itemFeatures.includes(feature)
        );
        if (!matchesFeatures) return false;
      }

      return true;
    });
  }, [searchQuery, selectedFeatures]);

  return {
    searchQuery,
    selectedFeatures,
    handleSearchChange,
    handleFeatureToggle,
    clearFilters,
    filterItems,
  };
};
