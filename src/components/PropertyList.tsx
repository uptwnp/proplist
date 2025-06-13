import React, { useState } from 'react';
import { useStore } from '../store/store';
import {
  Building,
  MapPin,
  Tag,
  IndianRupee,
  ExternalLink,
  Edit,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Navigation,
  Plus,
  Loader2,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModal';
import LocationUpdateModal from './LocationUpdateModal';
import { DEFAULT_COORDINATES } from '../constants';

const ITEMS_PER_PAGE = 10;

const PropertyList: React.FC = () => {
  const {
    filteredProperties,
    selectedProperty,
    setSelectedProperty,
    setMapViewport,
    togglePropertyDetail,
    togglePropertyForm,
    properties,
    setProperties,
    connections,
    setConnections,
    loadingStates,
  } = useStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [locationModalProperty, setLocationModalProperty] = useState<
    (typeof filteredProperties)[0] | null
  >(null);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProperties = filteredProperties.slice(startIndex, endIndex);

  const handlePropertyClick = (property: (typeof filteredProperties)[0]) => {
    // Update selected property and focus map
    setSelectedProperty(property);
    setMapViewport({
      latitude: property.location.latitude,
      longitude: property.location.longitude,
      zoom: 15,
    });

    // If property detail is already open, it will automatically update to show the new property
    // If not open, user needs to click "View Details" to open it
  };

  const confirmDeleteAction = () => {
    if (!confirmDelete) return;

    // Remove the property from the properties list
    const updatedProperties = properties.filter(
      (p) => p.id !== confirmDelete.id
    );
    setProperties(updatedProperties);

    // Remove any connections associated with this property
    const updatedConnections = connections.filter(
      (c) => c.property_id !== confirmDelete.id
    );
    setConnections(updatedConnections);

    // Clear selected property if it was the one being deleted
    if (selectedProperty?.id === confirmDelete.id) {
      setSelectedProperty(null);
    }

    // Reset confirmation state
    setConfirmDelete(null);
  };

  // Check if property has location set (not default coordinates)
  const hasLocation = (property: (typeof filteredProperties)[0]) => {
    return (
      property.location.latitude !== DEFAULT_COORDINATES.latitude ||
      property.location.longitude !== DEFAULT_COORDINATES.longitude
    );
  };

  const renderRating = (rating?: number) => {
    // Only show rating if it exists and is greater than 0
    if (!rating || rating === 0) return 0;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex items-center bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          <span>{rating}/5</span>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loadingStates.properties) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 divide-y overflow-y-auto">
          {filteredProperties.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                No properties found matching your criteria.
              </p>
            </div>
          ) : (
            currentProperties.map((property) => (
              <div
                key={property.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                  selectedProperty?.id === property.id
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : ''
                }`}
                onClick={() => handlePropertyClick(property)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-1">
                        <Building size={14} />
                        <span className="truncate max-w-[120px]">
                          {property.type || 'Property'}
                        </span>
                        {property.zone && (
                          <span className="truncate max-w-[120px]">
                            ({property.zone})
                          </span>
                        )}
                      </div>

                      <h3 className="font-medium text-gray-900 truncate">
                        {property.area || 'Property Area'}
                      </h3>
                      <p
                        className="font-light text-gray-900 text-sm my-1 max-w-64"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {property.description || 'Property Area'}
                      </p>

                      {/* Location Status */}
                      {!hasLocation(property) && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocationModalProperty(property);
                            }}
                            className="flex items-center space-x-1 px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md text-xs transition-colors"
                          >
                            <Plus size={12} />
                            <span>Add Location</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-2">
                      <div className="text-sm font-semibold text-blue-600 flex items-center justify-end">
                        <IndianRupee size={14} />
                        <span>{formatCurrency(property.price_min)}</span>
                      </div>
                      {property.price_min !== property.price_max && (
                        <div className="text-xs text-gray-500">
                          to {formatCurrency(property.price_max)}
                        </div>
                      )}

                      <div className="text-right ml-2">
                        <div className="text-sm font-semibold text-gray-600 flex items-center justify-end">
                          <span>{property.size_min} Sqyd</span>
                        </div>
                        {property.size_min !== property.size_max && (
                          <div className="text-xs text-gray-500">
                            to {property.size_max} Sqyard
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {Number(property.rating) > 0 && (
                      <div className="mt-1">
                        {renderRating(property.rating)}
                      </div>
                    )}
                    {property.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        <Tag size={12} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                    {property.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        +{property.tags.length - 3} more
                      </span>
                    )}
                    <div className="ml-auto flex items-center space-x-2">
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProperty(property);
                          togglePropertyDetail(true);
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>Details ({property.id || ''}) </span>
                      </button>
                      <button
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePropertyForm(property);
                        }}
                      >
                        <Edit size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

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
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
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
        title="Delete Property"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will permanently remove the property and all its connections. This action cannot be undone.`}
        confirmText="Delete Property"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
      />

      {locationModalProperty && (
        <LocationUpdateModal
          property={locationModalProperty}
          onClose={() => setLocationModalProperty(null)}
        />
      )}
    </>
  );
};

export default PropertyList;