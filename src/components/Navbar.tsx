import React from "react";
import { Menu, Plus, Home, Users, X, Building2, LogOut } from "lucide-react";
import { useStore } from "../store/store";
import { authUtils } from "../utils/auth";

const Navbar: React.FC = () => {
  const {
    logout,
    isSidebarOpen,
    toggleSidebar,
    isMobileView,
    togglePropertyForm,
    togglePersonForm,
    activeTab,
    setActiveTab,
  } = useStore();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };
  return (
    <header className="bg-white shadow-md fixed top-0 left-0 right-0 z-10 h-14">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          {isMobileView && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("properties")}
              className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "properties"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Home size={18} />
              <span className="ml-2"></span>
            </button>
            <button
              onClick={() => setActiveTab("persons")}
              className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "persons"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Users size={18} />
              <span className="ml-2"></span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              activeTab === "properties"
                ? togglePropertyForm()
                : togglePersonForm()
            }
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">
              Add {activeTab === "properties" ? "Property" : "Person"}
            </span>
          </button>
          
          {/* Session info and logout - only show on desktop */}
          {!isMobileView && (
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500 hidden lg:block">
                Session: {authUtils.formatRemainingTime()}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
