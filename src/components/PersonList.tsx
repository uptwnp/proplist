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
  } = useStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  // Load persons when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Only load persons - connections and properties will be loaded on-demand in detail view
        await loadPersons();
      } catch (error) {
        console.error("Failed to load persons:", error);
      }
    };

    loadData();
  }, [loadPersons]);

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

  // Show loading state
  if (loadingStates.persons) {
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

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto divide-y">
          {filteredPersons.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                No persons found matching your criteria.
              </p>
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
};

export default PersonList;
