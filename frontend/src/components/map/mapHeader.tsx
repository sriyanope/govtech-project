import React, { useState } from 'react';
import { Menu, X, Search, Filter, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityCategories } from '@/utils/facilityCategories';

interface MapHeaderProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showOnlyAvailable: boolean;
  onShowOnlyAvailableChange: (show: boolean) => void;
  visibleCategories: Set<string>;
  onVisibleCategoriesChange: (categories: Set<string>) => void;
}

const MapHeader: React.FC<MapHeaderProps> = ({
  isMenuOpen,
  onMenuToggle,
  searchQuery,
  onSearchChange,
  showOnlyAvailable,
  onShowOnlyAvailableChange,
  visibleCategories,
  onVisibleCategoriesChange
}) => {
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);

  const handleCategoryToggle = (categoryKey: string) => {
    const newCategories = new Set(visibleCategories);
    if (newCategories.has(categoryKey)) {
      newCategories.delete(categoryKey);
    } else {
      newCategories.add(categoryKey);
    }
    onVisibleCategoriesChange(newCategories);
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-[1000] bg-white shadow-md">
      <div className="px-4 py-3">
        {/* Search Row */}
        <div className="flex items-center gap-3">
          {/* Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Where to?"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Only Show Available Checkbox */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => onShowOnlyAvailableChange(e.target.checked)}
              className="rounded text-blue-600"
            />
            Only show available
          </label>

          {/* Filters Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
              className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              <span className="text-sm">Filters</span>
              <ChevronDown size={16} className={`transform transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showFiltersDropdown && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowFiltersDropdown(false)}
                  />
                  
                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-20"
                  >
                    <div className="p-3">
                      <h4 className="font-medium text-gray-800 mb-3">Facility Types</h4>
                      <div className="space-y-2">
                        {Object.entries(facilityCategories).map(([key, category]) => {
                          const Icon = category.icon;
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={visibleCategories.has(key)}
                                onChange={() => handleCategoryToggle(key)}
                                className="rounded text-blue-600"
                              />
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${category.color}20` }}
                              >
                                <Icon size={14} style={{ color: category.color }} />
                              </div>
                              <span className="text-sm text-gray-700">{category.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapHeader;