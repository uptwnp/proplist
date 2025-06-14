import React, { useState, useEffect } from 'react';
import { useStore } from '../store/store';
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
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import SelectPersonModal from './SelectPersonModal';
import ConfirmationModal from './ConfirmationModal';
import LocationUpdateModal from './LocationUpdateModal';
import TagManagementModal from './TagManagementModal';
import LinkModal from './LinkModal';
import { DEFAULT_COORDINATES } from '../constants';

const PropertyDetail: React.FC = () => {
  const {
    selectedProperty,
    setSelectedProperty,
    isPropertyDetailOpen,
    togglePropertyDetail,
    getPropertyPersons,
    getPropertyLinks,
    isMobileView,
    togglePropertyForm,
    connections,
    deleteConnection,
    deleteProperty,
    deleteLink,
    properties,
    updateProperty,
    loadPropertyDetails,
    loadingStates,
    setSelectedPerson,
    togglePersonDetail,
    isPersonDetailOpen,
  } = useStore();

  const [showSelectPerson, setShowSelectPerson] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'connection' | 'property' | 'link';
    id: number;
    name: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Load detailed property data when property is selected
  useEffect(() => {
    if (selectedProperty && isPropertyDetailOpen) {
      const loadDetails = async () => {
        setIsLoadingDetails(true);
        try {
          await loadPropertyDetails(selectedProperty.id);
        } catch (error) {
          console.error('Failed to load property details:', error);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      
      loadDetails();
    }
  }, [selectedProperty?.id, isPropertyDetailOpen, loadPropertyDetails]);

  if (!selectedProperty || !isPropertyDetailOpen) return null;

  const persons = getPropertyPersons(selectedProperty.id);
  const links = getPropertyLinks(selectedProperty.id);

  // Get connection details for each person
  const getPersonConnection = (personId: number) => {
    return connections.find(
      (conn) =>
        conn.property_id === selectedProperty.id && conn.person_id === personId
    );
  };

  // Get all existing tags from properties for suggestions
  const allExistingTags = Array.from(
    new Set(properties.flatMap((prop) => prop.tags || []))
  );

  // Check if property has valid location (not default coordinates)
  const hasValidLocation = () => {
    if (!selectedProperty.location) return false;
    
    const { latitude, longitude } = selectedProperty.location;
    return (
      latitude !== DEFAULT_COORDINATES.latitude ||
      longitude !== DEFAULT_COORDINATES.longitude
    );
  };

  const openInGoogleMaps = () => {
    const { latitude, longitude } = selectedProperty.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}`;
    window.open(url, '_blank');
  };

  const makeCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Share property details on WhatsApp
  const sharePropertyDetails = () => {
    const sizeText = selectedProperty.size_min === selectedProperty.size_max
      ? `${Math.round(selectedProperty.size_min)} sq.yd`
      : `${Math.round(selectedProperty.size_min)} - ${Math.round(selectedProperty.size_max)} sq.yd`;

    const priceText = selectedProperty.price_min === selectedProperty.price_max
      ? formatCurrency(selectedProperty.price_min)
      : `${formatCurrency(selectedProperty.price_min)} - ${formatCurrency(selectedProperty.price_max)}`;

    const message = `*Property Details*
---
${selectedProperty.id}. ${selectedProperty.type || 'Property'} in ${selectedProperty.area || 'Unknown Area'}

*Size:* ${sizeText}
*Demand:* ₹${priceText}
*Zone:* ${selectedProperty.zone || 'Not specified'}
*Description:* ${selectedProperty.description || 'No description available'}
---

Contact for more details.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Share location on WhatsApp
  const shareLocation = () => {
    if (!hasValidLocation()) {
      alert('Location not available for this property');
      return;
    }

    const { latitude, longitude } = selectedProperty.location;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    
    const sizeText = selectedProperty.size_min === selectedProperty.size_max
      ? `${Math.round(selectedProperty.size_min)} sq.yd`
      : `${Math.round(selectedProperty.size_min)} - ${Math.round(selectedProperty.size_max)} sq.yd`;

    const radiusText = selectedProperty.radius && selectedProperty.radius > 0
      ? selectedProperty.radius >= 1000
        ? `${(selectedProperty.radius / 1000).toFixed(1)} km`
        : `${selectedProperty.radius} meters`
      : '20 meters';

    const message = `*Property Location*
---
${selectedProperty.id}. ${selectedProperty.type || 'Property'} in ${selectedProperty.area || 'Unknown Area'} is Below

*Size:* ${sizeText}
*Open in Maps:* ${googleMapsUrl}

Location is accurate up to *${radiusText}*
---`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRemovePersonFromProperty = (
    personId: number,
    personName: string
  ) => {
    setConfirmDelete({
      type: 'connection',
      id: personId,
      name: personName,
    });
  };

  const handleDeleteProperty = () => {
    setConfirmDelete({
      type: 'property',
      id: selectedProperty.id,
      name: selectedProperty.area || 'this property',
    });
  };

  const handleDeleteLink = (linkId: number, linkAnchor: string) => {
    setConfirmDelete({
      type: 'link',
      id: linkId,
      name: linkAnchor || 'this link',
    });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      if (confirmDelete.type === 'connection') {
        // Find the connection to delete
        const connectionToDelete = connections.find(
          (conn) =>
            conn.property_id === selectedProperty.id &&
            conn.person_id === confirmDelete.id
        );
        if (connectionToDelete) {
          await deleteConnection(connectionToDelete.id);
        }
      } else if (confirmDelete.type === 'property') {
        await deleteProperty(confirmDelete.id);
      } else if (confirmDelete.type === 'link') {
        await deleteLink(confirmDelete.id);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }

    setConfirmDelete(null);
  };

  // Helper function to format radius display
  const formatLocationText = () => {
    if (!selectedProperty.radius || selectedProperty.radius === 0) {
      return 'Add';
    }
    return `Edit`;
  };

  const renderRating = (rating?: number) => {
    // Only show rating if it exists and is greater than 0
    if (!rating || rating === 0) return null;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium">{rating}/5</span>
        </div>
      </div>
    );
  };

  const handleTagsChange = async (tags: string[]) => {
    try {
      const updatedProperty = {
        ...selectedProperty,
        tags,
      };
      await updateProperty(updatedProperty);
      // The store will automatically update the selectedProperty
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getLinkIcon = (type?: string) => {
    switch (type) {
      case 'Website':
        return <ExternalLink size={16} />;
      case 'Social Media':
        return <MessageCircle size={16} />;
      case 'Document':
        return <FileText size={16} />;
      case 'Image':
        return <Tag size={16} />;
      case 'Video':
        return <Tag size={16} />;
      case 'Map':
        return <MapPin size={16} />;
      default:
        return <LinkIcon size={16} />;
    }
  };

  // Handle person click - navigate to person detail and close property detail if needed
  const handlePersonClick = (person: any) => {
    // Close property detail if on mobile to make room for person detail
    if (isMobileView) {
      togglePropertyDetail(false);
    }
    
    setSelectedPerson(person);
    togglePersonDetail(true);
  };

  return (
    <>
      <div
        className={`bg-white shadow-xl z-30 flex flex-col ${
          isMobileView
            ? 'fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh]'
            : 'fixed top-14 right-0 bottom-0 w-1/3 border-l'
        }`}
      >
        {/* Header with gradient background - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate flex items-center gap-1">
                               {selectedProperty.id}. 
  {selectedProperty.type || 'Property'}
                {Number(selectedProperty.rating) > 0 &&
                  ` - ${selectedProperty.rating}/5`}
              </h2>

              <p className="text-blue-100 text-sm truncate">
                {selectedProperty.area || 'Property'}
              </p>
            </div>
            <button
              onClick={() => togglePropertyDetail()}
              className="p-2 rounded-full hover:bg-blue-600 transition-colors ml-2 flex-shrink-0"
              aria-label="Close details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center space-x-2">
            {/* Only show Navigate button if property has valid location */}
            {hasValidLocation() && (
              <button
                onClick={openInGoogleMaps}
                className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
                title="Navigate with Google Maps"
              >
                <Navigation size={16} />
              </button>
            )}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              title="Update location"
            >
              <MapPin size={16} />
              <span className="hidden sm:inline">{formatLocationText()}</span>
            </button>

            <button
              onClick={() => togglePropertyForm(selectedProperty)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              title="Edit property"
            >
              <Edit size={16} />
              <span className="hidden sm:inline"></span>
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
            {/* Price and Basic Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-start justify-between mb-3 gap-4">
                <div className="flex-1 bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Size
                  </div>
                  <div className="font-semibold text-gray-900">
                    {selectedProperty.size_min === selectedProperty.size_max
                      ? `${Math.round(selectedProperty.size_min)} sq.yd`
                      : `${Math.round(
                          selectedProperty.size_min
                        )} - ${Math.round(
                          selectedProperty.size_max
                        )} sq.yd`}
                  </div>
                </div>
                <div className="flex-1 bg-white p-3 rounded-lg border">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    Price
                  </div>
                  <div className="font-semibold text-gray-900">
                    {selectedProperty.price_min === selectedProperty.price_max
                      ? `${formatCurrency(selectedProperty.price_min)}`
                      : `${formatCurrency(
                          selectedProperty.price_min
                        )} to ${formatCurrency(selectedProperty.price_max)}`}
                  </div>
                </div>
              </div>

              {/* Property Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {selectedProperty.zone && (
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Zone
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {selectedProperty.zone}
                    </div>
                  </div>
                )}
                {selectedProperty.radius > 0 && (
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      Radius
                    </div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {selectedProperty.radius >= 1000
                        ? `${(selectedProperty.radius / 1000).toFixed(1)} km`
                        : `${selectedProperty.radius} m`}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description Card */}
            {selectedProperty.description && (
              <div className="bg-white border rounded-xl p-4">
                <h4 className="text-sm font-light mb-2 flex items-center text-gray-900">
                  <Info size={14} className="mr-2 text-gray-500" />
                  Description
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {selectedProperty.description}
                </p>
              </div>
            )}

            {/* Tags Card */}
            <div className="">
              {selectedProperty.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProperty.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200"
                    >
                      {tag}
                    </span>
                  ))}
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-600 border border-gray-200 gap-2"
                  >
                    <Settings size={14} />
                    <span>Edit Tags</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-2 py-1 text-gray-500">
                  <p className="text-sm">No tags added yet</p>
                  <button
                    onClick={() => setShowTagModal(true)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition gap-2"
                  >
                    <Settings size={14} />
                    <span>Add Tags</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notes Card */}
            {selectedProperty.note && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="text-sm font-light mb-1 text-amber-800">
                  Notes
                </h4>
                <p className="text-amber-700">{selectedProperty.note}</p>
              </div>
            )}

            {/* Resource Links Card */}
            <div className="bg-white border rounded-xl p-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-light flex items-center text-gray-900">
                  <LinkIcon size={14} className="mr-2 text-gray-600" />
                  Resource Links
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {links.length}
                  </span>
                </h4>
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                >
                  <Plus size={14} />
                  <span>Add Link</span>
                </button>
              </div>

              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="bg-gray-50 border rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="text-blue-600">
                              {getLinkIcon(link.type)}
                            </div>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                              {link.type || 'Link'}
                            </span>
                          </div>
                          <button
                            onClick={() => openLink(link.link)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm truncate block w-full text-left"
                            title={link.link}
                          >
                            {link.anchor || link.link}
                          </button>
                          {link.anchor && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {link.link}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingLink(link);
                              setShowLinkModal(true);
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-200 transition-colors"
                            title="Edit link"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteLink(
                                link.id,
                                link.anchor || link.link
                              )
                            }
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-100 transition-colors"
                            title="Delete link"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span></span>
              )}
            </div>

            {/* Contact Persons Card */}
            <div className="bg-white border rounded-xl p-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-light flex items-center text-gray-900">
                  <User size={14} className="mr-2 text-gray-600" />
                  Connected Persons
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {persons.length}
                  </span>
                </h4>
                <button
                  onClick={() => setShowSelectPerson(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              {persons.length > 0 ? (
                <div className="space-y-4">
                  {persons.map((person) => {
                    const connection = getPersonConnection(person.id);

                    return (
                      <div
                        key={person.id}
                        className="bg-gray-50 border rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handlePersonClick(person)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center">
                                {person.name ?? 'Unknown'}
                                <ExternalLink size={14} className="ml-2 text-blue-500" />
                              </div>
                              {person.role && (
                                <div className="text-sm text-gray-500">
                                  Person Role: {person.role}
                                </div>
                              )}
                              {connection?.role && (
                                <div className="text-sm text-blue-600 font-medium">
                                  Property Role: {connection.role}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePersonFromProperty(
                                person.id,
                                person.name
                              );
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Remove person from property"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Connection Remark */}
                        {connection?.remark && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-3">
                            <div className="text-xs text-blue-600 uppercase tracking-wide mb-1">
                              Connection Notes
                            </div>
                            <div className="text-sm text-blue-800">
                              {connection.remark}
                            </div>
                          </div>
                        )}

                        {/* Person About */}
                        {person.about && (
                          <div className="bg-white p-3 rounded-lg border mb-3">
                            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                              About Person
                            </div>
                            <div className="text-sm text-gray-700">
                              {person.about}
                            </div>
                          </div>
                        )}

                        {/* Phone number with actions */}
                        {person.phone && (
                          <div className="flex items-center justify-between bg-white p-3 rounded-lg border mb-2">
                            <span className="text-sm font-mono text-gray-900">
                              {person.phone}
                            </span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(person.phone);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                title="Copy number"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsApp(person.phone);
                                }}
                                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  makeCall(person.phone);
                                }}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                title="Call"
                              >
                                <Phone size={14} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Alternative contact if available */}
                        {person.alternative_contact && (
                          <div className="flex items-center justify-between bg-white p-3 rounded-lg border mb-2">
                            <div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                Alt:{' '}
                              </span>
                              <span className="text-sm font-mono text-gray-900">
                                {person.alternative_contact}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(person.alternative_contact);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                title="Copy number"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openWhatsApp(person.alternative_contact);
                                }}
                                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  makeCall(person.alternative_contact);
                                }}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                title="Call"
                              >
                                <Phone size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>No contact persons available</p>
                  <p className="text-sm">Add someone to get started</p>
                </div>
              )}
            </div>

            {/* Location & Coverage Card */}
            <div className="bg-white border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-light flex items-center text-gray-900">
                  <Navigation size={14} className="mr-2 text-gray-600" />
                  Location & Coverage
                </h4>
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                >
                  <Edit size={14} />
                  <span>{formatLocationText()}</span>
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Coordinates</div>
                  <div className="font-mono text-sm text-gray-900">
                    {selectedProperty.location.latitude.toFixed(6)}°N,{' '}
                    {selectedProperty.location.longitude.toFixed(6)}°E
                  </div>
                </div>
              </div>
            </div>

            {/* Sharing Options */}
            <div className="bg-white border rounded-xl p-4">
              <h4 className="text-sm font-light mb-3 flex items-center text-gray-900">
                <Share2 size={14} className="mr-2 text-gray-600" />
                Share Property
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={sharePropertyDetails}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200"
                >
                  <MessageCircle size={16} />
                  <span className="text-sm font-medium">Share Details</span>
                </button>
                {hasValidLocation() && (
                  <button
                    onClick={shareLocation}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                  >
                    <MapPin size={16} />
                    <span className="text-sm font-medium">Share Location</span>
                  </button>
                )}
              </div>
              {!hasValidLocation() && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Add location to enable location sharing
                </p>
              )}
            </div>

            <button
              onClick={handleDeleteProperty}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              <Trash2 size={18} />
              <span>Delete Property</span>
            </button>

            {/* Bottom padding for mobile */}
            <div className="pb-20"></div>
          </div>
        </div>
      </div>

      {showSelectPerson && selectedProperty && (
        <SelectPersonModal
          propertyId={selectedProperty.id}
          onClose={() => setShowSelectPerson(false)}
        />
      )}

      {showLocationModal && selectedProperty && (
        <LocationUpdateModal
          property={selectedProperty}
          onClose={() => setShowLocationModal(false)}
        />
      )}

      {showTagModal && selectedProperty && (
        <TagManagementModal
          isOpen={showTagModal}
          onClose={() => setShowTagModal(false)}
          selectedTags={selectedProperty.tags || []}
          onTagsChange={handleTagsChange}
          allTags={allExistingTags}
        />
      )}

      {showLinkModal && (
        <LinkModal
          propertyId={selectedProperty.id}
          link={editingLink}
          onClose={() => {
            setShowLinkModal(false);
            setEditingLink(null);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title={
          confirmDelete?.type === 'connection'
            ? 'Remove Person Connection'
            : confirmDelete?.type === 'property'
            ? 'Delete Property'
            : 'Delete Link'
        }
        message={
          confirmDelete?.type === 'connection'
            ? `Are you sure you want to remove ${confirmDelete.name} from this property? This action cannot be undone.`
            : confirmDelete?.type === 'property'
            ? `Are you sure you want to delete "${confirmDelete?.name}"? This will permanently remove the property and all its connections. This action cannot be undone.`
            : `Are you sure you want to delete the link "${confirmDelete?.name}"? This action cannot be undone.`
        }
        confirmText={
          confirmDelete?.type === 'connection'
            ? 'Remove'
            : confirmDelete?.type === 'property'
            ? 'Delete Property'
            : 'Delete Link'
        }
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
      />
    </>
  );
};

export default PropertyDetail;