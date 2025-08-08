import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Property } from '../types';
import { X, ChevronDown, ChevronUp, Loader2, MapPin } from 'lucide-react';
import { useStore } from '../store/store';
import {
  PROPERTY_TYPES,
  PROPERTY_ZONES,
  DEFAULT_COORDINATES,
  UI_TEXT,
  RATING_OPTIONS,
} from '../constants';

interface PropertyFormProps {
  property?: Property;
  onClose: () => void;
}

const LOCAL_STORAGE_KEY = 'propertyFormData';
const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

const PropertyForm: React.FC<PropertyFormProps> = ({ property, onClose }) => {
  const { createProperty, updateProperty, loadingStates, properties, isMobileView } = useStore();

  // Helper function to ensure valid location
  const ensureValidLocation = (location: any) => {
    if (
      !location ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number' ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
      return DEFAULT_COORDINATES;
    }
    return location;
  };

  const [formData, setFormData] = useState<Partial<Property>>(() => {
    if (property) {
      // If editing, use property data
      return {
        ...property,
        location: ensureValidLocation(property.location),
      };
    }

    // If creating, check for saved data in localStorage
    const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedDataJSON) {
      try {
        const { data, timestamp } = JSON.parse(savedDataJSON);
        const isExpired = (new Date().getTime() - timestamp) > EXPIRATION_TIME;

        if (!isExpired) {
          return data;
        } else {
          // Clear expired data
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } catch (error) {
        console.error("Error parsing saved form data:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    // Default state for a new property
    const initialData = {
      size_min: 0,
      size_max: 0,
      price_min: 0,
      price_max: 0,
      tags: [],
      rating: undefined,
      location: DEFAULT_COORDINATES,
      radius: 0,
      area: '',
      zone: '',
      type: 'Plot Residential',
      description: '',
      note: '',
    };
    return {
      ...initialData,
      location: ensureValidLocation(initialData.location),
    };
  });

  const [showRanges, setShowRanges] = useState({
    price: false,
    size: false,
  });

  // Area suggestions state
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const areaInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const isLoading = loadingStates.creating || loadingStates.updating;

  // Save form data to localStorage on change, only for new properties
  useEffect(() => {
    if (!property) {
      const dataToStore = {
        data: formData,
        timestamp: new Date().getTime(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToStore));
    }
  }, [formData, property]);

  // Get unique area values from all properties
  const getUniqueAreas = useCallback(() => {
    const areas = properties
      .map(p => p.area)
      .filter(area => area && area.trim() !== '')
      .map(area => area!.trim());
    
    return Array.from(new Set(areas)).sort();
  }, [properties]);

  // Filter suggestions based on input
  const filterSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      return [];
    }

    const uniqueAreas = getUniqueAreas();
    const filtered = uniqueAreas.filter(area =>
      area.toLowerCase().includes(input.toLowerCase())
    );

    return filtered.slice(0, 10); // Limit to 10 suggestions
  }, [getUniqueAreas]);

  // Handle area input change
  const handleAreaChange = (value: string) => {
    setFormData({ ...formData, area: value });
    
    if (value.trim()) {
      const suggestions = filterSuggestions(value);
      setAreaSuggestions(suggestions);
      setShowAreaSuggestions(suggestions.length > 0);
    } else {
      setAreaSuggestions([]);
      setShowAreaSuggestions(false);
    }
    setSelectedSuggestionIndex(-1);
  };

  // Handle area input focus
  const handleAreaFocus = () => {
    const currentValue = formData.area || '';
    if (currentValue.trim()) {
      const suggestions = filterSuggestions(currentValue);
      setAreaSuggestions(suggestions);
      setShowAreaSuggestions(suggestions.length > 0);
    } else {
      // Show all unique areas when focused with empty input
      const allAreas = getUniqueAreas().slice(0, 10);
      setAreaSuggestions(allAreas);
      setShowAreaSuggestions(allAreas.length > 0);
    }
    setSelectedSuggestionIndex(-1);
  };

  // Handle area input blur
  const handleAreaBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowAreaSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 150);
  };

  // Handle keyboard navigation in suggestions
  const handleAreaKeyDown = (e: React.KeyboardEvent) => {
    if (!showAreaSuggestions || areaSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < areaSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : areaSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedArea = areaSuggestions[selectedSuggestionIndex];
          setFormData({ ...formData, area: selectedArea });
          setShowAreaSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
        break;
      case 'Escape':
        setShowAreaSuggestions(false);
        setSelectedSuggestionIndex(-1);
        areaInputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setFormData({ ...formData, area: suggestion });
    setShowAreaSuggestions(false);
    setSelectedSuggestionIndex(-1);
    areaInputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;

    const priceMin = formData.price_min || 0;
    const priceMax = showRanges.price ? formData.price_max || 0 : priceMin;

    const sizeMin = formData.size_min || 0;
    const sizeMax = showRanges.size ? formData.size_max || 0 : sizeMin;

    // Ensure location is always valid before saving
    const validLocation = ensureValidLocation(formData.location);

    const propertyData = {
      ...formData,
      price_min: priceMin,
      price_max: priceMax,
      size_min: sizeMin,
      size_max: sizeMax,
      radius: formData.radius || 0,
      location: validLocation,
      rating: formData.rating || 0, // Default to 0 if not set
    } as Property;

    try {
      if (property) {
        await updateProperty(propertyData);
      } else {
        const { id, created_on, updated_on, ...newPropertyData } = propertyData;
        await createProperty(newPropertyData);
      }
      // Clear saved data on successful submission
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      onClose();
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  };

  const handleClose = () => {
    // Clear saved data on manual close
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onClose();
  };

  const renderRatingSelector = () => {
    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setFormData({ ...formData, rating: undefined })}
          className={`px-3 py-2 text-sm rounded-md border transition-colors ${
            formData.rating === undefined
              ? 'bg-gray-100 border-gray-300 text-gray-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
          disabled={isLoading}
        >
          None
        </button>
        {RATING_OPTIONS.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setFormData({ ...formData, rating })}
            className={`px-3 py-2 text-sm rounded-md border transition-colors ${
              formData.rating === rating
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            disabled={isLoading}
          >
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{rating}/5</span>
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`fixed bg-black bg-opacity-50 z-[60] flex items-center justify-center ${
      isMobileView ? 'inset-0' : 'inset-0'
    }`}>
      <div className={`bg-white w-full flex flex-col overflow-y-auto ${
        isMobileView 
          ? 'h-full max-w-none rounded-none' 
          : 'rounded-lg max-w-2xl max-h-[90vh]'
      }`}>
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">
            {property
              ? UI_TEXT.buttons.editProperty
              : UI_TEXT.buttons.addProperty}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Property Type - Single Selection Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {UI_TEXT.labels.propertyType}
            </label>
            <select
              value={formData.type || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as (typeof PROPERTY_TYPES)[number],
                })
              }
              className="w-full border rounded-md p-2"
              required
              disabled={isLoading}
            >
              <option value="">Select property type</option>
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Area/Address with Dynamic Suggestions */}
          <div className="relative">
            <label className="block text-sm font-medium mb-1">
              {UI_TEXT.labels.area}
            </label>
            <div className="relative">
              <input
                ref={areaInputRef}
                type="text"
                value={formData.area || ''}
                onChange={(e) => handleAreaChange(e.target.value)}
                onFocus={handleAreaFocus}
                onBlur={handleAreaBlur}
                onKeyDown={handleAreaKeyDown}
                className="w-full border rounded-md p-2 pr-8"
                placeholder={UI_TEXT.placeholders.property.area}
                required
                disabled={isLoading}
                autoComplete="off"
              />
              <MapPin size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Suggestions Dropdown */}
            {showAreaSuggestions && areaSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {areaSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                      index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Zone */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {UI_TEXT.labels.zone}
            </label>
            <select
              value={formData.zone || ''}
              onChange={(e) =>
                setFormData({ ...formData, zone: e.target.value })
              }
              className="w-full border rounded-md p-2"
              disabled={isLoading}
            >
              <option value="">Select zone</option>
              {PROPERTY_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">
                {UI_TEXT.labels.size} (in Sq. Yards)
              </label>
              <button
                type="button"
                onClick={() =>
                  setShowRanges((prev) => ({ ...prev, size: !prev.size }))
                }
                className="text-blue-600 text-sm flex items-center"
                disabled={isLoading}
              >
                {showRanges.size ? (
                  <>
                    <ChevronUp size={16} />
                    <span>{UI_TEXT.buttons.hideRange}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>{UI_TEXT.buttons.showRange}</span>
                  </>
                )}
              </button>
            </div>
            <div
              className={`grid ${
                showRanges.size ? 'grid-cols-2 gap-4' : 'grid-cols-1'
              }`}
            >
              <input
                type="number"
                value={formData.size_min ? formData.size_min : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size_min: Number(e.target.value),
                  })
                }
                className="w-full border rounded-md p-2"
                placeholder={showRanges.size ? 'Min Size' : 'Size'}
                required
                disabled={isLoading}
              />
              {showRanges.size && (
                <input
                  type="number"
                  value={formData.size_max ? formData.size_max : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      size_max: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-md p-2"
                  placeholder="Max Size"
                  required
                  disabled={isLoading}
                />
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">
                {UI_TEXT.labels.price} (in Lakhs)
              </label>
              <button
                type="button"
                onClick={() =>
                  setShowRanges((prev) => ({ ...prev, price: !prev.price }))
                }
                className="text-blue-600 text-sm flex items-center"
                disabled={isLoading}
              >
                {showRanges.price ? (
                  <>
                    <ChevronUp size={16} />
                    <span>{UI_TEXT.buttons.hideRange}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>{UI_TEXT.buttons.showRange}</span>
                  </>
                )}
              </button>
            </div>
            <div
              className={`grid ${
                showRanges.price ? 'grid-cols-2 gap-4' : 'grid-cols-1'
              }`}
            >
              <input
                type="number"
                value={formData.price_min ? formData.price_min : ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price_min: Number(e.target.value),
                  })
                }
                className="w-full border rounded-md p-2"
                placeholder={showRanges.price ? 'Min Price' : 'Price'}
                required
                disabled={isLoading}
              />
              {showRanges.price && (
                <input
                  type="number"
                  value={formData.price_max ? formData.price_max : ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_max: Number(e.target.value),
                    })
                  }
                  className="w-full border rounded-md p-2"
                  placeholder="Max Price"
                  required
                  disabled={isLoading}
                />
              )}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {UI_TEXT.labels.rating}
            </label>
            {renderRatingSelector()}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {UI_TEXT.labels.description}
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder={UI_TEXT.placeholders.property.description}
              disabled={isLoading}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {UI_TEXT.labels.notes}
            </label>
            <textarea
              value={formData.note || ''}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="w-full border rounded-md p-2"
              rows={2}
              placeholder={UI_TEXT.placeholders.property.notes}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              {UI_TEXT.buttons.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              <span>
                {property
                  ? UI_TEXT.buttons.updateProperty
                  : UI_TEXT.buttons.addProperty}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyForm;