import React, { useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import PropertyDetail from './components/PropertyDetail';
import MobileFilterDrawer from './components/MobileFilterDrawer';
import FilterModal from './components/FilterModal';
import PropertyForm from './components/PropertyForm';
import PersonForm from './components/PersonForm';
import { useStore } from './store/store';

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
    loadProperties,
    isLoading,
    error,
    activeTab
  } = useStore();

  // Use ref to prevent duplicate initial loads
  const hasInitialized = useRef(false);

  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkMobileView = () => {
      setMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobileView();
    
    // Set up event listener for window resize
    window.addEventListener('resize', checkMobileView);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, [setMobileView]);
  
  // Initialize app with only properties (lazy load everything else)
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('App initializing - loading only properties initially');
      loadProperties();
    }
  }, [loadProperties]);

  // Show loading state only for initial properties load
  if (isLoading && !hasInitialized.current) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              hasInitialized.current = false;
              loadProperties();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
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
            isSidebarOpen && !isMobileView ? 'ml-96' : ''
          }`}
        >
          <MapView />
        </main>
        
        <PropertyDetail />
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