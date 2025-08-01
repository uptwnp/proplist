import React, { useEffect, useRef } from "react";
import { Search, X, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useStore } from "../store/store";
import PropertyList from "./PropertyList";
import PersonList from "./PersonList";
import { handlePhonePaste } from "../utils/phoneUtils";

// Cache keys for search terms
const SEARCH_CACHE_KEYS = {
  propertySearch: "cached_property_search",
  personSearch: "cached_person_search",
};

// Load saved search term
const loadSavedSearchTerm = (key: string): string => {
  try {
    const saved = localStorage.getItem(key);
    return saved || "";
  } catch (error) {
    console.error("Error loading saved search term:", error);
    return "";
  }
};

// Save search term
const saveSearchTerm = (key: string, term: string) => {
  try {
    if (term.trim()) {
      localStorage.setItem(key, term);
    } else {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error("Error saving search term:", error);
  }
};
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
    loadPersons,
    refreshData,
    isLoading,
    lastSyncTime,
    properties,
    persons,
    applyPersonFilters,
  } = useStore();

  // Use ref to prevent duplicate loads
  const hasLoadedProperties = useRef(false);
  const hasLoadedPersons = useRef(false);
  const isInitialized = useRef(false);

  // Initialize search terms from localStorage only once
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;

      // Initialize property search if on properties tab
      if (activeTab === "properties") {
        const savedSearch = loadSavedSearchTerm(
          SEARCH_CACHE_KEYS.propertySearch
        );
        if (savedSearch && savedSearch !== filters.searchQuery) {
          updateFilters({ searchQuery: savedSearch });
        }
      }

      // Initialize person search if on persons tab
      if (activeTab === "persons") {
        const savedSearch = loadSavedSearchTerm(SEARCH_CACHE_KEYS.personSearch);
        if (savedSearch && savedSearch !== personFilters.searchQuery) {
          updatePersonFilters({ searchQuery: savedSearch });
        }
      }
    }
  }, []); // Empty dependency array - run only once

  // Save search terms when they change
  useEffect(() => {
    if (activeTab === "properties" && isInitialized.current) {
      saveSearchTerm(
        SEARCH_CACHE_KEYS.propertySearch,
        filters.searchQuery || ""
      );
    }
  }, [filters.searchQuery, activeTab]);

  useEffect(() => {
    if (activeTab === "persons" && isInitialized.current) {
      saveSearchTerm(
        SEARCH_CACHE_KEYS.personSearch,
        personFilters.searchQuery || ""
      );
    }
  }, [personFilters.searchQuery, activeTab]);

  // Load data when sidebar opens or tab changes - FIXED: Prevent duplicate loads
  useEffect(() => {
    if (isSidebarOpen) {
      if (activeTab === "properties" && !hasLoadedProperties.current) {
        console.log(
          "Sidebar: Loading properties for properties tab (first time)"
        );
        hasLoadedProperties.current = true;
        loadProperties(); // This now has built-in deduplication
      } else if (activeTab === "persons" && !hasLoadedPersons.current) {
        console.log("Sidebar: Loading persons for persons tab (first time)");
        hasLoadedPersons.current = true;
        // Load persons data and ensure filters are applied
        loadPersons()
          .then(() => {
            console.log("Sidebar: Persons loaded, applying filters...");
            // Small delay to ensure state is updated
            setTimeout(() => {
              applyPersonFilters();
            }, 100);
          })
          .catch((error) => {
            console.error("Failed to load persons:", error);
          });
      }
    }
  }, [
    isSidebarOpen,
    activeTab,
    loadProperties,
    loadPersons,
    applyPersonFilters,
  ]);

  // Reset load flags when data is refreshed
  useEffect(() => {
    if (lastSyncTime) {
      hasLoadedProperties.current = false;
      hasLoadedPersons.current = false;
    }
  }, [lastSyncTime]);

  // Calculate active filter count for properties
  const getPropertyFilterCount = () => {
    let count = 0;

    // Search query
    if (filters.searchQuery && filters.searchQuery.trim()) count++;

    // Zone filter - NEW: Count zone filter
    if (filters.zone && filters.zone.trim()) count++;

    // Area filter - NEW: Count area filter
    if (filters.area && filters.area.trim()) count++;

    // Price ranges (if any selected)
    if (filters.priceRanges && filters.priceRanges.length > 0) count++;

    // Size ranges (if any selected)
    if (filters.sizeRanges && filters.sizeRanges.length > 0) count++;

    // Property types
    if (filters.propertyTypes && filters.propertyTypes.length > 0) count++;

    // Rating
    if (filters.rating !== undefined) count++;

    // Include tags
    if (filters.tags && filters.tags.length > 0) count++;

    // Exclude tags
    if (filters.excludedTags && filters.excludedTags.length > 0) count++;

    // Sort by (if not default)
    if (filters.sortBy && filters.sortBy !== "newest") count++;

    // Location status
    if (filters.hasLocation !== null) count++;

    // Radius ranges (if not default range)
    if (
      filters.radiusRange &&
      (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000)
    )
      count++;

    return count;
  };

  // Calculate active filter count for persons
  const getPersonFilterCount = () => {
    let count = 0;

    // Search query
    if (personFilters.searchQuery && personFilters.searchQuery.trim()) count++;

    // Roles
    if (personFilters.roles && personFilters.roles.length > 0) count++;

    // Has properties
    if (personFilters.hasProperties !== null) count++;

    return count;
  };

  const activeFilterCount =
    activeTab === "properties"
      ? getPropertyFilterCount()
      : getPersonFilterCount();

  // Handle manual refresh
  const handleRefresh = () => {
    // Reset load flags to allow fresh loading
    hasLoadedProperties.current = false;
    hasLoadedPersons.current = false;
    refreshData();
  };

  // Format last sync time
  const formatLastSync = (timestamp: number) => {
    if (!timestamp) return "";

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  if (!isSidebarOpen) return null;

  return (
    <aside
      className={`bg-white shadow-lg fixed z-10 transition-all duration-300 ${
        isMobileView
          ? "inset-0 top-14 overflow-y-auto"
          : "left-0 top-14 bottom-0 w-96 overflow-y-auto"
      }`}
    >
      <div className="px-4 border-b">
        <div className="flex items-center justify-between mb-4"></div>

        {activeTab === "properties" && (
          <>
            <div className="flex items-center space-x-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search properties, persons, connections..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.searchQuery || ""}
                  onChange={(e) =>
                    updateFilters({ searchQuery: e.target.value })
                  }
                  title={
                    filters.searchQuery
                      ? `Current search: ${filters.searchQuery}`
                      : "Search properties, persons, connections..."
                  }
                />
                <Search
                  size={18}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>

              <button
                onClick={toggleFilterDrawer}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors relative flex-shrink-0 ${
                  activeFilterCount > 0
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <SlidersHorizontal size={16} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors flex-shrink-0 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title="Refresh data"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </>
        )}

        {activeTab === "persons" && (
          <>
            <div className="flex items-center space-x-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search persons by name, phone, role..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={personFilters.searchQuery || ""}
                  onChange={(e) =>
                    updatePersonFilters({ searchQuery: e.target.value })
                  }
                  onPaste={(e) =>
                    handlePhonePaste(e.nativeEvent, (value) =>
                      updatePersonFilters({ searchQuery: value })
                    )
                  }
                  title={
                    personFilters.searchQuery
                      ? `Current search: ${personFilters.searchQuery}`
                      : "Search persons by name, phone, role..."
                  }
                />
                <Search
                  size={18}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>

              <button
                onClick={toggleFilterDrawer}
                className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-md transition-colors relative flex-shrink-0 ${
                  activeFilterCount > 0
                    ? "bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <SlidersHorizontal size={16} />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className={`flex items-center justify-center px-3 py-2 rounded-md transition-colors flex-shrink-0 ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title="Refresh data"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </>
        )}
      </div>

      {activeTab === "properties" ? <PropertyList /> : <PersonList />}
    </aside>
  );
};

export default Sidebar;
