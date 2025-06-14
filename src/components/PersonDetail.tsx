import React, { useState, useEffect } from "react";
import { useStore } from "../store/store";
import {
  X,
  MapPin,
  Phone,
  User,
  IndianRupee,
  Tag,
  Info,
  FileText,
  Plus,
  Edit,
  ExternalLink,
  Copy,
  MessageCircle,
  Trash2,
  Navigation,
  Home,
  Settings,
  Building,
  Link as LinkIcon,
  Share2,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import ConfirmationModal from "./ConfirmationModal";
import { DEFAULT_COORDINATES } from "../constants";

const PersonDetail: React.FC = () => {
  const {
    selectedPerson,
    setSelectedPerson,
    isPersonDetailOpen,
    togglePersonDetail,
    getPersonProperties,
    getPersonConnections,
    isMobileView,
    togglePersonForm,
    connections,
    deleteConnection,
    deletePerson,
    properties,
    setSelectedProperty,
    togglePropertyDetail,
    setMapViewport,
    loadPersonDetails,
    loadingStates,
    isPropertyDetailOpen,
  } = useStore();

  const [confirmDelete, setConfirmDelete] = useState<{
    type: "connection" | "person";
    id: number;
    name: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load detailed person data when person is selected
  useEffect(() => {
    if (selectedPerson && isPersonDetailOpen) {
      const loadDetails = async () => {
        setIsLoadingDetails(true);
        try {
          await loadPersonDetails(selectedPerson.id);
        } catch (error) {
          console.error("Failed to load person details:", error);
        } finally {
          setIsLoadingDetails(false);
        }
      };

      loadDetails();
    }
  }, [selectedPerson?.id, isPersonDetailOpen, loadPersonDetails]);

  if (!selectedPerson || !isPersonDetailOpen) return null;

  const personProperties = getPersonProperties(selectedPerson.id);
  const personConnections = getPersonConnections(selectedPerson.id);

  // Get connection details for each property
  const getPropertyConnection = (propertyId: number) => {
    return connections.find(
      (conn) =>
        conn.person_id === selectedPerson.id && conn.property_id === propertyId
    );
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

  // Share person details on WhatsApp
  const sharePersonDetails = () => {
    const message = `*Contact Details*
---
*Name:* ${selectedPerson.name}
*Phone:* ${selectedPerson.phone}
${
  selectedPerson.alternative_contact_details
    ? `*Alt Contact:* ${selectedPerson.alternative_contact_details}`
    : ""
}
*Role:* ${selectedPerson.role || "Not specified"}
${selectedPerson.about ? `*About:* ${selectedPerson.about}` : ""}

*Connected Properties:* ${personProperties.length}
---

Contact for more details.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleRemovePropertyFromPerson = (
    propertyId: number,
    propertyName: string
  ) => {
    setConfirmDelete({
      type: "connection",
      id: propertyId,
      name: propertyName,
    });
  };

  const handleDeletePerson = () => {
    setConfirmDelete({
      type: "person",
      id: selectedPerson.id,
      name: selectedPerson.name,
    });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      if (confirmDelete.type === "connection") {
        // Find the connection to delete
        const connectionToDelete = connections.find(
          (conn) =>
            conn.person_id === selectedPerson.id &&
            conn.property_id === confirmDelete.id
        );
        if (connectionToDelete) {
          await deleteConnection(connectionToDelete.id);
        }
      } else if (confirmDelete.type === "person") {
        await deletePerson(confirmDelete.id);
        togglePersonDetail(false);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }

    setConfirmDelete(null);
  };

  // Handle property click - navigate to property detail and close person detail if needed
  const handlePropertyClick = (property: any) => {
    // Close person detail if on mobile to make room for property detail
    if (isMobileView) {
      togglePersonDetail(false);
    }

    setSelectedProperty(property);
    setMapViewport({
      latitude: property.location.latitude,
      longitude: property.location.longitude,
      zoom: 15,
    });
    togglePropertyDetail(true);
  };

  // Check if property has location set (not default coordinates)
  const hasLocation = (property: any) => {
    return (
      property.location.latitude !== DEFAULT_COORDINATES.latitude ||
      property.location.longitude !== DEFAULT_COORDINATES.longitude
    );
  };

  const renderRating = (rating?: number) => {
    if (!rating || rating === 0) return null;

    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-xs font-medium">{rating}/5</span>
      </div>
    );
  };

  return (
    <>
      <div
        className={`bg-white shadow-xl z-30 flex flex-col ${
          isMobileView
            ? "fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]"
            : "fixed top-14 right-0 bottom-0 w-1/3 border-l"
        }`}
      >
        {/* Header with gradient background - Fixed */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate flex items-center gap-1">
                <User size={20} />
                {selectedPerson.name}
              </h2>
              <p className="text-green-100 text-sm truncate">
                {selectedPerson.role || "Contact Person"}
              </p>
            </div>
            <button
              onClick={() => togglePersonDetail()}
              className="p-2 rounded-full hover:bg-green-600 transition-colors ml-2 flex-shrink-0"
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => togglePersonForm(selectedPerson)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              title="Edit person"
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={sharePersonDetails}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              title="Share details"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingDetails && (
          <div className="p-4 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading details...</span>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
              <h4 className="text-sm font-medium mb-3 flex items-center text-gray-900">
                <Phone size={14} className="mr-2 text-green-600" />
                Contact Information
              </h4>

              {/* Primary Phone */}
              {selectedPerson.phone && (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border mb-3">
                  <span className="text-sm font-mono text-gray-900">
                    {selectedPerson.phone}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => copyToClipboard(selectedPerson.phone)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Copy number"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => openWhatsApp(selectedPerson.phone)}
                      className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={() => makeCall(selectedPerson.phone)}
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      title="Call"
                    >
                      <Phone size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Alternative Contact */}
              {selectedPerson.alternative_contact_details && (
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      Alternative:{" "}
                    </span>
                    <span className="text-sm font-mono text-gray-900">
                      {selectedPerson.alternative_contact_details}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          selectedPerson.alternative_contact_details!
                        )
                      }
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Copy number"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() =>
                        openWhatsApp(
                          selectedPerson.alternative_contact_details!
                        )
                      }
                      className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                    <button
                      onClick={() =>
                        makeCall(selectedPerson.alternative_contact_details!)
                      }
                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      title="Call"
                    >
                      <Phone size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* About Card */}
            {selectedPerson.about && (
              <div className="bg-white border rounded-xl p-4">
                <h4 className="text-sm font-medium mb-2 flex items-center text-gray-900">
                  <Info size={14} className="mr-2 text-gray-500" />
                  About
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {selectedPerson.about}
                </p>
              </div>
            )}

            {/* Connected Properties Card */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium flex items-center text-gray-900">
                  <Building size={14} className="mr-2 text-gray-600" />
                  Connected Properties
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {personProperties.length}
                  </span>
                </h4>
              </div>

              {personProperties.length > 0 ? (
                <div className="space-y-4">
                  {personProperties.map((property) => {
                    const connection = getPropertyConnection(property.id);

                    return (
                      <div
                        key={property.id}
                        className="bg-gray-50 border rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handlePropertyClick(property)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {property.type || "Property"}
                              </span>
                              {property.rating > 0 &&
                                renderRating(property.rating)}
                              <ExternalLink
                                size={14}
                                className="text-blue-500"
                              />
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {property.area || "Property Area"}
                            </h3>
                            {property.zone && (
                              <div className="text-sm text-gray-600 mb-2">
                                Zone: {property.zone}
                              </div>
                            )}
                            {connection?.role && (
                              <div className="text-sm text-green-600 font-medium mb-2">
                                Role: {connection.role}
                              </div>
                            )}
                            {connection?.remark && (
                              <div className="text-sm text-gray-500 italic mb-2">
                                Note: {connection.remark}
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-sm font-semibold text-blue-600 flex items-center">
                              <IndianRupee size={14} />
                              <span>{formatCurrency(property.price_min)}</span>
                            </div>
                            {property.price_min !== property.price_max && (
                              <div className="text-xs text-gray-500">
                                to {formatCurrency(property.price_max)}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {Math.round(property.size_min)} sq.yd
                            </div>
                          </div>
                        </div>

                        {/* Property Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            {hasLocation(property) && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <MapPin size={10} className="mr-1" />
                                Located
                              </span>
                            )}
                            {property.tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                <Tag size={10} className="mr-1" />
                                {tag}
                              </span>
                            ))}
                            {property.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{property.tags.length - 2} more
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePropertyFromPerson(
                                property.id,
                                property.area || "this property"
                              );
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Remove connection"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Building size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No connected properties</p>
                  <p className="text-sm">
                    Properties will appear here when connected
                  </p>
                </div>
              )}
            </div>

            {/* Statistics Card */}
            <div className="bg-white border rounded-xl p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center text-gray-900">
                <FileText size={14} className="mr-2 text-gray-600" />
                Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-xs text-blue-600 uppercase tracking-wide">
                    Total Properties
                  </div>
                  <div className="text-lg font-semibold text-blue-900">
                    {personProperties.length}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-xs text-green-600 uppercase tracking-wide">
                    Total Value
                  </div>
                  <div className="text-lg font-semibold text-green-900">
                    ₹
                    {formatCurrency(
                      personProperties.reduce(
                        (sum, prop) => sum + prop.price_min,
                        0
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Person Button */}
            <button
              onClick={handleDeletePerson}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Trash2 size={18} />
              <span>Delete Person</span>
            </button>

            {/* Bottom padding for mobile */}
            <div className="pb-20"></div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title={
          confirmDelete?.type === "connection"
            ? "Remove Property Connection"
            : "Delete Person"
        }
        message={
          confirmDelete?.type === "connection"
            ? `Are you sure you want to remove the connection to "${confirmDelete.name}"? This action cannot be undone.`
            : `Are you sure you want to delete "${confirmDelete?.name}"? This will permanently remove the person and all their property connections. This action cannot be undone.`
        }
        confirmText={
          confirmDelete?.type === "connection"
            ? "Remove Connection"
            : "Delete Person"
        }
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
      />
    </>
  );
};

export default PersonDetail;
