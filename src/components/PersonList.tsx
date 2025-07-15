import React, { useState, useEffect } from "react";
import { useStore } from "../store/store";
import {
  User,
  Phone,
  Edit,
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageCircle,
  Trash2,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import ConfirmationModal from "./ConfirmationModal";
import { ITEMS_PER_PAGE } from "../constants";

const PersonList: React.FC = () => {
  const {
    filteredPersons,
    setSelectedPerson,
    togglePersonDetail,
    togglePersonForm,
    deletePerson,
    loadingStates,
    loadPersons,
    refreshData,
    isLoading,
    persons,
    error,
    applyPersonFilters,
    resetPersonFilters,
  } = useStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Load persons when component mounts - but only if we don't have data
  useEffect(() => {
    console.log("PersonList mounted, checking data:", {
      personsCount: persons.length,
      filteredPersonsCount: filteredPersons.length,
    });

    // CRITICAL: Always reset filters when PersonList mounts to ensure clean state
    console.log("PersonList: Resetting filters to show ALL persons");
    resetPersonFilters();
    
    // Then load data if needed
    if (persons.length === 0) {
      console.log("PersonList: Loading persons data...");
      loadPersons()
        .then(() => {
          console.log("PersonList: Data loaded, applying clean filters");
          setTimeout(() => applyPersonFilters(), 50);
        })
        .catch((error) => {
          console.error("Failed to load persons:", error);
        });
    } else {
      // If we have data, just apply the clean filters
      console.log("PersonList: Data exists, applying clean filters");
      setTimeout(() => applyPersonFilters(), 50);
    }

  // FIXED: Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredPersons.length]);
  const totalPages = Math.ceil(filteredPersons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPersons = filteredPersons.slice(startIndex, endIndex);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://wa.me/91${cleanPhone}`;
    window.open(url, "_blank");
  };

  const makeCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleDeletePerson = (personId: number, personName: string) => {
    setConfirmDelete({ id: personId, name: personName });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      await deletePerson(confirmDelete.id);
    } catch (error) {
      console.error("Failed to delete person:", error);
    }

    setConfirmDelete(null);
  };

  const handlePersonClick = (person: any) => {
    setSelectedPerson(person);
    togglePersonDetail(true);
  };

  const handleRetry = () => {
    // Reset filters and reload data
    resetPersonFilters();
    refreshData();
  };

  const handleRefreshFilters = () => {
    console.log("PersonList: Refreshing filters...");
    resetPersonFilters();
    setTimeout(() => {
      applyPersonFilters();
    }, 50);
  };
  // Show loading state only when initially loading and no data
  if (isLoading && persons.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading persons...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state only if we have an error and no cached data
  if (error && persons.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load persons</p>
            <button
              onClick={handleRetry}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 mx-auto"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Background loading indicator */}
        {isLoading && persons.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-700 text-sm flex items-center space-x-2">
            <Loader2 size={14} className="animate-spin" />
            <span>Updating persons...</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y">
          {filteredPersons.length === 0 ? (
            <div className="p-6 text-center">
              {persons.length === 0 ? (
                <>
                  <User size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No persons available</p>
                  <p className="text-sm text-gray-400">
                    Add a new person to get started
                  </p>
                </>
              ) : (
                <>
                  <User size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">
                    No persons found matching your criteria.
                  </p>
                  <p className="text-sm text-gray-400">
                    Try adjusting your search or filters
                  </p>
                  <button
                    onClick={handleRefreshFilters}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Reset & Refresh Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            currentPersons.map((person) => {
              return (
                <div
                  key={person.id}
                  className="p-4 cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => handlePersonClick(person)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <User size={16} className="text-gray-500" />
                        <h3 className="font-medium">{person.name}</h3>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {person.role} {person.about && ` - ${person.about}`}
                      </div>

                      {/* Phone number with actions */}
                      {person.phone && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mt-2">
                          <span className="text-sm font-mono">
                            {person.phone}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(person.phone);
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy number"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(person.phone);
                              }}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                makeCall(person.phone);
                              }}
                              className="p-1 text-blue-500 hover:text-blue-700"
                              title="Call"
                            >
                              <Phone size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Alternative contact if available */}
                      {person.alternative_contact_details && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mt-1">
                          <div>
                            <span className="text-xs text-gray-500">Alt: </span>
                            <span className="text-sm font-mono">
                              {person.alternative_contact_details}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  person.alternative_contact_details
                                );
                              }}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy number"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(
                                  person.alternative_contact_details
                                );
                              }}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                makeCall(person.alternative_contact_details);
                              }}
                              className="p-1 text-blue-500 hover:text-blue-700"
                              title="Call"
                            >
                              <Phone size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePersonClick(person);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                        title="View details"
                      >
                        <ExternalLink size={12} />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePersonForm(person);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit person"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination with improved display */}
        {totalPages > 1 && (
          <div className="p-4 border-t bg-white">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="text-sm text-gray-600 text-center">
                <div>
                  Page {currentPage} of {totalPages}
                </div>
                <div className="text-xs text-gray-500">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredPersons.length)} of{" "}
                  {filteredPersons.length}
                </div>
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Delete Person"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will permanently remove the person and all their property connections. This action cannot be undone.`}
        confirmText="Delete Person"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
      />
    </>
  );

export default PersonList;
