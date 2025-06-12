import React, { useEffect } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store/store';
import PropertyList from './PropertyList';
import PersonList from './PersonList';

const Sidebar: React.FC = () => {
  const { 
    isSidebarOpen, 
    toggleSidebar, 
    filters, 
    updateFilters,
    personFilters,
    updatePersonFilters,
    isMobileView,
    toggleFilterDrawer,
    activeTab,
    loadProperties,
    loadAllData
  } = useStore();

  // Load data when sidebar opens or tab changes
  useEffect(() => {
    if (isSidebarOpen) {
      if (activeTab === 'properties') {
        console.log('Loading properties for properties tab');
        loadProperties();
      } else if (activeTab === 'persons') {
        console.log('Loading all data for persons tab');
        loadAllData();
      }
    }
  }, [isSidebarOpen, activeTab, loadProperties, loadAllData]);

  // Calculate active filter count for properties
  const getPropertyFilterCount = () => {
    let count = 0;
    
    // Search query
    if (filters.searchQuery.trim()) count++;
    
    // Price range (if not default)
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000000) count++;
    
    // Size range (if not default)
    if (filters.sizeRange[0] > 0 || filters.sizeRange[1] < 10000) count++;
    
    // Property types
    if (filters.propertyTypes.length > 0) count++;
    
    // Rating
    if (filters.rating !== undefined) count++;
    
    // Include tags
    if (filters.tags.length > 0) count++;
    
    // Exclude tags
    if (filters.excludedTags.length > 0) count++;
    
    // Sort by (if not default)
    if (filters.sortBy !== 'newest') count++;
    
    // Location status
    if (filters.hasLocation !== null) count++;
    
    // Radius range (if not default)
    if (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000) count++;
    
    return count;
  };

  // Calculate active filter count for persons
  const getPersonFilterCount = () => {
    let count = 0;
    
    // Search query
    if (personFilters.searchQuery.trim()) count++;
    
    // Roles
    if (personFilters.roles.length > 0) count++;
    
    // Has properties
    if (personFilters.hasProperties !== null) count++;
    
    return count;
  };

  const activeFilterCount = activeTab === 'properties' 
    ? getPropertyFilterCount() 
    : getPersonFilterCount();

  if (!isSidebarOpen) return null;

  return (
    <aside className={`bg-white shadow-lg fixed z-10 transition-all duration-300 ${
      isMobileView 
        ? 'inset-0 top-14 overflow-y-auto' 
        : 'left-0 top-14 bottom-0 w-96 overflow-y-auto'
    }`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
         
        </div>
        
        {activeTab === 'properties' && (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Search properties, persons, connections..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.searchQuery}
                onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              />
              <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              onClick={toggleFilterDrawer}
              className={`mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors relative ${
                activeFilterCount > 0 
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </>
        )}

        {activeTab === 'persons' && (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Search persons, properties, connections..."
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={personFilters.searchQuery}
                onChange={(e) => updatePersonFilters({ searchQuery: e.target.value })}
              />
              <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <button
              onClick={toggleFilterDrawer}
              className={`mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors relative ${
                activeFilterCount > 0 
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </>
        )}
      </div>
      
      {activeTab === 'properties' ? <PropertyList /> : <PersonList />}
    </aside>
  );
};

export default Sidebar;