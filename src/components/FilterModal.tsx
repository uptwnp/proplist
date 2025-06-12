import React from 'react';
import { useStore } from '../store/store';
import { X } from 'lucide-react';
import FilterPanel from './FilterPanel';
import PersonFilterPanel from './PersonFilterPanel';

const FilterModal: React.FC = () => {
  const { isFilterDrawerOpen, toggleFilterDrawer, activeTab, isMobileView } = useStore();
  
  // Only show on desktop (not mobile)
  if (!isFilterDrawerOpen || isMobileView) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold">
            {activeTab === 'properties' ? 'Property Filters' : 'Person Filters'}
          </h2>
          <button 
            onClick={toggleFilterDrawer}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close filters"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'properties' ? <FilterPanel /> : <PersonFilterPanel />}
        </div>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={toggleFilterDrawer}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;