import React from 'react';
import { useStore } from '../store/store';
import { X } from 'lucide-react';
import FilterPanel from './FilterPanel';
import PersonFilterPanel from './PersonFilterPanel';

const MobileFilterDrawer: React.FC = () => {
  const { isFilterDrawerOpen, toggleFilterDrawer, isMobileView, activeTab } = useStore();
  
  // Only show for mobile devices
  if (!isFilterDrawerOpen || !isMobileView) return null;
  
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-50">
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {activeTab === 'properties' ? 'Property Filters' : 'Person Filters'}
          </h2>
          <button 
            onClick={toggleFilterDrawer}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 pb-20">
          {activeTab === 'properties' ? <FilterPanel /> : <PersonFilterPanel />}
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button 
            onClick={toggleFilterDrawer}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileFilterDrawer;