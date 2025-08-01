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
import LoginScreen from "./components/LoginScreen";
import { useStore } from "./store/store";
import { APP_VERSION } from "./constants";

function App() {
  const {
    isAuthenticated,
    checkAuth,
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

  // Check authentication on app start and periodically
  useEffect(() => {
    // Initial auth check
    checkAuth();
    
    // Check auth every minute to handle session expiration
    const authCheckInterval = setInterval(() => {
      checkAuth();
    }, 60000); // Check every minute
    
    return () => clearInterval(authCheckInterval);
  }, [checkAuth]);
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
          // Load from cache immediately
          await loadFromCache();

          // Then load fresh data from API
          await loadAllData();
        } catch (error) {
          console.error("Failed to initialize app:", error);
        } finally {
          isInitializing.current = false;
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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  // Show loading state only for initial load when no cache is available
  if ((isLoading || isLoadingFromCache) && !hasInitialized.current) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isLoadingFromCache ? "Loading from cache..." : "Loading data..."}
          </p>
          <p className="text-xs text-gray-500 mt-2">Version {APP_VERSION}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !hasInitialized.current) {
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
          <button
            onClick={() => {
              hasInitialized.current = false;
              isInitializing.current = false;
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