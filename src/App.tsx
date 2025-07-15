import React, { useEffect, useRef } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import PropertyDetail from "./components/PropertyDetail";
import PersonDetail from "./components/PersonDetail";
import MobileFilterDrawer from "./components/MobileFilterDrawer";
import FilterModal from "./components/FilterModal";
import PropertyForm from "./components/PropertyForm";
import PersonForm from "./components/PersonForm";
import { useStore } from "./store/store";
import { APP_VERSION } from "./constants";

function App() {
  const {
    isSidebarOpen,
    isMobileView,
    setMobileView,
    showPropertyForm,
    showPersonForm,
    togglePropertyForm,
    togglePersonForm,
    editingProperty,
    editingPerson,
    loadFromCache,
    loadAllData,
    refreshData,
    isLoading,
    isLoadingFromCache,
    error,
    activeTab,
    lastSyncTime,
  } = useStore();

  // Use ref to prevent duplicate initial loads
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);

  // Version management for cache clearing
  useEffect(() => {
    const storedVersion = localStorage.getItem("app_version");

    if (storedVersion !== APP_VERSION) {
      console.log(
        `App version updated from ${storedVersion} to ${APP_VERSION}, clearing cache...`
      );

      // Clear localStorage except for essential settings
      const essentialKeys = ["mapSatelliteView"];
      const keysToKeep: Record<string, string> = {};

      essentialKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          keysToKeep[key] = value;
        }
      });

      // Clear all localStorage
      localStorage.clear();

      // Restore essential keys
      Object.entries(keysToKeep).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });

      // Set new version
      localStorage.setItem("app_version", APP_VERSION);

      // Clear any cached data in memory by forcing a page reload
      if (storedVersion) {
        // Only reload if there was a previous version
        window.location.reload();
        return;
      }
    }
  }, []);

  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setMobileView(window.innerWidth < 768);
    };

    // Initial check
    checkMobileView();

    // Set up event listener for window resize
    window.addEventListener("resize", checkMobileView);

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", checkMobileView);
    };
  }, [setMobileView]);

  // Initialize app with cache-first approach - FIXED: Single initialization
  useEffect(() => {
    if (!hasInitialized.current && !isInitializing.current) {
      isInitializing.current = true;
      hasInitialized.current = true;
      
      console.log("App initializing with cache-first approach...");

      const initializeApp = async () => {
        try {
          // Set loading states at the very beginning
          console.log("Setting initial loading states...");
          
          // Load from cache immediately
          await loadFromCache();

          // Then load fresh data from API
          await loadAllData();
          
          console.log("App initialization completed successfully");
        } catch (error) {
          console.error("Failed to initialize app:", error);
          // Ensure loading states are cleared even on error
        } finally {
          isInitializing.current = false;
          console.log("App initialization process finished");
        }
      };

      initializeApp();
    }
  }, [loadFromCache, loadAllData]);

  // Auto-refresh data every 5 minutes if the app is active
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!document.hidden && lastSyncTime) {
        const timeSinceLastSync = Date.now() - lastSyncTime;
        const fiveMinutes = 5 * 60 * 1000;

        if (timeSinceLastSync > fiveMinutes) {
          console.log("Auto-refreshing data...");
          refreshData();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [lastSyncTime, refreshData]);

  // Show loading state for initial load - improved logic
  const shouldShowLoading = (isLoading || isLoadingFromCache) && 
    (!hasInitialized.current || isInitializing.current);
  
  if (shouldShowLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingFromCache ? "Loading from cache..." : "Loading data..."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isInitializing.current ? "Initializing application..." : "Please wait..."}
          </p>
          <p className="text-xs text-gray-500 mt-2">Version {APP_VERSION}</p>
        </div>
      </div>
    );
  }

  // Show error state only if we have an error and no cached data
  if (error && !hasInitialized.current && !shouldShowLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            The application failed to load properly. This might be due to network issues or server problems.
          </p>
          <button
            onClick={() => {
              hasInitialized.current = false;
              isInitializing.current = false;
              console.log("Retrying app initialization...");
              loadFromCache();
              loadAllData();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
          <p className="text-xs text-gray-500 mt-4">Version {APP_VERSION}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <Navbar />

      <div className="flex h-full pt-14">
        <Sidebar />

        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen && !isMobileView ? "ml-96" : ""
          }`}
        >
          <MapView />
        </main>

        <PropertyDetail />
        <PersonDetail />
        <MobileFilterDrawer />
        <FilterModal />

        {showPropertyForm && (
          <PropertyForm
            property={editingProperty}
            onClose={() => togglePropertyForm()}
          />
        )}

        {showPersonForm && (
          <PersonForm
            person={editingPerson}
            onClose={() => togglePersonForm()}
          />
        )}
      </div>
    </div>
  );
}

export default App;