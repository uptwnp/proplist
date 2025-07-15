import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Plus,
  User,
  Copy,
  MessageCircle,
  Phone,
  Building,
  MapPin,
  Loader2,
} from "lucide-react";
import { Person } from "../types";
import { useStore } from "../store/store";
import PersonForm from "./PersonForm";
import ConnectPersonModal from "./ConnectPersonModal";
import { formatCurrency } from "../utils/formatters";
import { personAPI } from "../utils/api";
import { handlePhonePaste } from "../utils/phoneUtils";

interface SelectPersonModalProps {
  propertyId: number;
  onClose: () => void;
}

const SelectPersonModal: React.FC<SelectPersonModalProps> = ({
  propertyId,
  onClose,
}) => {
  const { persons, setPersons, connections, properties, isMobileView } =
    useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIXED: Load persons directly from API when modal opens - prevent duplicate calls
  useEffect(() => {
    let isMounted = true;

    const loadPersonsFromAPI = async () => {
      // Only load if we don't have persons data or if it's stale
      if (persons.length > 0) {
        console.log("SelectPersonModal: Using existing persons data");
        // Even with existing data, ensure we're not filtering by property context
        console.log("SelectPersonModal: Resetting person filters to show all persons");
        resetPersonFilters();
        setTimeout(() => applyPersonFilters(), 50);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("SelectPersonModal: Requesting persons from API...");

        // Make direct API call to get all persons
        const personsFromAPI = await personAPI.getAll();

        console.log("SelectPersonModal: API response received:", {
          count: personsFromAPI.length,
          persons: personsFromAPI,
        });

        // Only update if component is still mounted
        if (isMounted) {
          // Update the store with the fetched persons
          setPersons(personsFromAPI);
          
          // Reset filters to ensure clean state
          resetPersonFilters();
          setTimeout(() => applyPersonFilters(), 50);

          console.log(
            "SelectPersonModal: Persons loaded successfully, count:",
            personsFromAPI.length
          );
        }
      } catch (error) {
        console.error(
          "SelectPersonModal: Failed to load persons from API:",
          error
        );
        if (isMounted) {
          setError("Failed to load persons. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPersonsFromAPI();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array to run only once when modal opens

  // Sort persons by most recently added (assuming newer IDs are more recent)
  const sortedPersons = [...persons].sort(
    (a, b) => Number(b.id) - Number(a.id)
  );

  const filteredPersons = sortedPersons.filter(
    (person) =>
      (person.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.phone ?? "").includes(searchQuery) ||
      (person.alternative_contact_details ?? "").includes(searchQuery) ||
      (person.about ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (person.role ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // FIXED: Get person's connected properties with proper connection matching
  const getPersonProperties = (personId: number) => {
    const personConnections = connections.filter(
      (conn) => conn.person_id === personId
    );
    
    return personConnections
      .map((conn) => {
        const property = properties.find(
          (prop) => prop.id === conn.property_id
        );
        return property ? { property, connection: conn } : null;
      })
      .filter((item): item is { property: any; connection: any } => item !== null);
  };

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

  // Handle retry when there's an error
  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const personsFromAPI = await personAPI.getAll();
      setPersons(personsFromAPI);
    } catch (error) {
      console.error("Retry failed:", error);
      setError("Failed to load persons. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`fixed bg-black bg-opacity-50 z-[50] flex items-center justify-center ${
          isMobileView ? "inset-0" : "inset-0"
        }`}
      >
        <div
          className={`bg-white w-full flex flex-col ${
            isMobileView
              ? "h-full max-w-none rounded-none"
              : "rounded-lg max-w-2xl max-h-[90vh]"
          }`}
        >
          <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-semibold">Select Person</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b flex-shrink-0">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by name, phone, role, or about..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPaste={(e) =>
                  handlePhonePaste(e.nativeEvent, (value) =>
                    setSearchQuery(value)
                  )
                }
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Search
                size={18}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>

            <button
              onClick={() => setShowAddPerson(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              disabled={isLoading}
            >
              <Plus size={18} />
              <span>Add New Person</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                  <span className="text-gray-600">
                    Loading persons from API...
                  </span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
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
                    onClick={handleRetry}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredPersons.length > 0 ? (
              <div className="divide-y">
                {filteredPersons.map((person) => {
                  const connectedProperties = getPersonProperties(person.id);

                  return (
                    <div key={person.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                            <User size={20} className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">
                              {person.name ?? "Unknown"}
                            </div>
                            {person.role && (
                              <div className="text-sm text-gray-500 mb-1">
                                {person.role}
                              </div>
                            )}
                            {person.about && (
                              <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {person.about}
                              </div>
                            )}

                            {/* Connected Properties Count */}
                            {connectedProperties.length > 0 && (
                              <div className="flex items-center text-xs text-blue-600 mb-2">
                                <Building size={12} className="mr-1" />
                                <span>
                                  {connectedProperties.length} connected propert
                                  {connectedProperties.length === 1
                                    ? "y"
                                    : "ies"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPerson(person)}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex-shrink-0 ml-2"
                        >
                          Select
                        </button>
                      </div>

                      {/* Phone number with actions */}
                      {person.phone && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mb-2">
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
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mb-2">
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

                      {/* Connected Properties Preview */}
                      {connectedProperties.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-gray-600 mb-2">
                            Connected Properties:
                          </h4>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {connectedProperties.slice(0, 2).map(
                              ({ property, connection }) => (
                                <div
                                  key={property.id}
                                  className="bg-blue-50 p-2 rounded text-xs"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 truncate">
                                        {property.area}
                                      </div>
                                      <div className="flex items-center text-gray-600 mt-1">
                                        <MapPin
                                          size={10}
                                          className="mr-1 flex-shrink-0"
                                        />
                                        <span className="truncate">
                                          {property.zone || "Unknown Zone"}
                                        </span>
                                      </div>
                                      {connection.role && (
                                        <div className="text-blue-600 font-medium">
                                          Role: {connection.role}
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-blue-600 font-medium ml-2 flex-shrink-0">
                                      ₹{formatCurrency(property.price_min)}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                            {connectedProperties.length > 2 && (
                              <div className="text-xs text-gray-500 text-center py-1">
                                +{connectedProperties.length - 2} more
                                properties
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? (
                  <>
                    <User size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No persons found matching your search</p>
                    <p className="text-sm">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <User size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No persons available</p>
                    <p className="text-sm">Add a new person to get started</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Debug info for development */}
          {process.env.NODE_ENV === "development" && (
            <div className="p-2 bg-gray-100 text-xs text-gray-600 border-t">
              Debug: {persons.length} total persons, {filteredPersons.length}{" "}
              filtered, Loading: {isLoading ? "Yes" : "No"}, Error:{" "}
              {error || "None"}
            </div>
          )}
        </div>
      </div>

      {showAddPerson && <PersonForm onClose={() => setShowAddPerson(false)} />}

      {selectedPerson && (
        <ConnectPersonModal
          propertyId={propertyId}
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </>
  );
};

export default SelectPersonModal;