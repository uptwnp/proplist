import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '../store/store';
import {
  X,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  Minus,
  MapPin,
  Target,
} from 'lucide-react';
import { formatCurrency, formatSquareYards } from '../utils/formatters';
import {
  PROPERTY_TYPES,
  PROPERTY_ZONES,
  PRICE_RANGES,
  SIZE_RANGES,
  RADIUS_RANGES,
  UI_TEXT,
  RATING_OPTIONS,
  SORT_OPTIONS,
  DEFAULT_COORDINATES,
} from '../constants';

const FilterPanel: React.FC = () => {
  const { filters, updateFilters, resetFilters, getAllTags, properties } = useStore();
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [excludeTagSearchQuery, setExcludeTagSearchQuery] = useState('');
  const [showIncludeTags, setShowIncludeTags] = useState(false);
  const [showExcludeTags, setShowExcludeTags] = useState(false);
  const [showSizeRange, setShowSizeRange] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showRadiusRange, setShowRadiusRange] = useState(false);

  // Area filter states
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [selectedAreaSuggestionIndex, setSelectedAreaSuggestionIndex] = useState(-1);
  const areaInputRef = useRef<HTMLInputElement>(null);

  const allTags = getAllTags();

  // Get unique areas from all properties
  const getUniqueAreas = useCallback(() => {
    const areas = properties
      .map(p => p.area)
      .filter(area => area && area.trim() !== '')
      .map(area => area!.trim());
    
    return Array.from(new Set(areas)).sort();
  }, [properties]);

  // Filter area suggestions based on input
  const filterAreaSuggestions = useCallback((input: string) => {
    if (!input.trim()) {
      return getUniqueAreas().slice(0, 10);
    }

    const uniqueAreas = getUniqueAreas();
    const filtered = uniqueAreas.filter(area =>
      area.toLowerCase().includes(input.toLowerCase())
    );

    return filtered.slice(0, 10);
  }, [getUniqueAreas]);

  const handlePropertyTypeToggle = (type: (typeof PROPERTY_TYPES)[number]) => {
    const currentTypes = [...filters.propertyTypes];
    const index = currentTypes.indexOf(type);

    if (index === -1) {
      currentTypes.push(type);
    } else {
      currentTypes.splice(index, 1);
    }

    updateFilters({ propertyTypes: currentTypes });
  };

  // Handle zone selection
  const handleZoneChange = (zone: string) => {
    updateFilters({ zone: zone || undefined });
  };

  // Handle area filter change
  const handleAreaFilterChange = (area: string) => {
    updateFilters({ area: area.trim() || undefined });
  };

  // Handle area input change
  const handleAreaSearchChange = (value: string) => {
    setAreaSearchQuery(value);
    
    if (value.trim()) {
      const suggestions = filterAreaSuggestions(value);
      setShowAreaSuggestions(suggestions.length > 0);
    } else {
      setShowAreaSuggestions(false);
    }
    setSelectedAreaSuggestionIndex(-1);
  };

  // Handle area input focus
  const handleAreaFocus = () => {
    const suggestions = filterAreaSuggestions(areaSearchQuery);
    setShowAreaSuggestions(suggestions.length > 0);
    setSelectedAreaSuggestionIndex(-1);
  };

  // Handle area input blur
  const handleAreaBlur = () => {
    setTimeout(() => {
      setShowAreaSuggestions(false);
      setSelectedAreaSuggestionIndex(-1);
    }, 150);
  };

  // Handle area keyboard navigation
  const handleAreaKeyDown = (e: React.KeyboardEvent) => {
    const suggestions = filterAreaSuggestions(areaSearchQuery);
    
    if (!showAreaSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAreaFilterChange(areaSearchQuery);
        setShowAreaSuggestions(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedAreaSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedAreaSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedAreaSuggestionIndex >= 0) {
          const selectedArea = suggestions[selectedAreaSuggestionIndex];
          setAreaSearchQuery(selectedArea);
          handleAreaFilterChange(selectedArea);
        } else {
          handleAreaFilterChange(areaSearchQuery);
        }
        setShowAreaSuggestions(false);
        setSelectedAreaSuggestionIndex(-1);
        break;
      case 'Escape':
        setShowAreaSuggestions(false);
        setSelectedAreaSuggestionIndex(-1);
        areaInputRef.current?.blur();
        break;
    }
  };

  // Handle area suggestion click
  const handleAreaSuggestionClick = (suggestion: string) => {
    setAreaSearchQuery(suggestion);
    handleAreaFilterChange(suggestion);
    setShowAreaSuggestions(false);
    setSelectedAreaSuggestionIndex(-1);
  };

  // Handle multiple price range selection
  const handlePriceRangeToggle = (range: [number, number]) => {
    const currentRanges = [...filters.priceRanges];
    const existingIndex = currentRanges.findIndex(
      ([min, max]) => min === range[0] && max === range[1]
    );

    if (existingIndex === -1) {
      currentRanges.push(range);
    } else {
      currentRanges.splice(existingIndex, 1);
    }

    updateFilters({ priceRanges: currentRanges });
  };

  // Handle multiple size range selection
  const handleSizeRangeToggle = (range: [number, number]) => {
    const currentRanges = [...filters.sizeRanges];
    const existingIndex = currentRanges.findIndex(
      ([min, max]) => min === range[0] && max === range[1]
    );

    if (existingIndex === -1) {
      currentRanges.push(range);
    } else {
      currentRanges.splice(existingIndex, 1);
    }

    updateFilters({ sizeRanges: currentRanges });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = [...filters.tags];
    const index = currentTags.indexOf(tag);

    if (index === -1) {
      currentTags.push(tag);
    } else {
      currentTags.splice(index, 1);
    }

    updateFilters({ tags: currentTags });
  };

  const handleExcludeTagToggle = (tag: string) => {
    const currentExcludedTags = [...filters.excludedTags];
    const index = currentExcludedTags.indexOf(tag);

    if (index === -1) {
      currentExcludedTags.push(tag);
    } else {
      currentExcludedTags.splice(index, 1);
    }

    updateFilters({ excludedTags: currentExcludedTags });
  };

  const handleLocationStatusChange = (hasLocation: boolean | null) => {
    updateFilters({ hasLocation });
  };

  const filteredIncludeTags = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
      !filters.excludedTags.includes(tag)
  );

  const filteredExcludeTags = allTags.filter(
    (tag) =>
      tag.toLowerCase().includes(excludeTagSearchQuery.toLowerCase()) &&
      !filters.tags.includes(tag)
  );

  // Calculate location statistics
  const locationStats = React.useMemo(() => {
    const total = properties.length;
    const withLocation = properties.filter(p => 
      p.location.latitude !== DEFAULT_COORDINATES.latitude ||
      p.location.longitude !== DEFAULT_COORDINATES.longitude
    ).length;
    const withoutLocation = total - withLocation;
    
    return { total, withLocation, withoutLocation };
  }, [properties]);

  // Format radius display
  const formatRadius = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>{rating}/5</span>
      </div>
    );
  };

  // Check if a price range is selected
  const isPriceRangeSelected = (range: [number, number]) => {
    return filters.priceRanges.some(([min, max]) => min === range[0] && max === range[1]);
  };

  // Check if a size range is selected
  const isSizeRangeSelected = (range: [number, number]) => {
    return filters.sizeRanges.some(([min, max]) => min === range[0] && max === range[1]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{UI_TEXT.labels.filters}</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {UI_TEXT.buttons.reset}
        </button>
      </div>

 

      {/* 2. Area Filter with Suggestions */}
      <div className="relative">
        <h4 className="text-sm font-medium mb-2">
          {UI_TEXT.labels.area}
          {filters.area && (
            <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-0.5 rounded-full">
              Filtered
            </span>
          )}
        </h4>
        <div className="relative">
          <input
            ref={areaInputRef}
            type="text"
            value={areaSearchQuery}
            onChange={(e) => handleAreaSearchChange(e.target.value)}
            onFocus={handleAreaFocus}
            onBlur={handleAreaBlur}
            onKeyDown={handleAreaKeyDown}
            className="w-full border rounded-md p-2 pr-8 text-sm"
            placeholder="Search or type area name..."
          />
          <MapPin size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          
          {/* Clear area filter button */}
          {filters.area && (
            <button
              onClick={() => {
                setAreaSearchQuery('');
                handleAreaFilterChange('');
              }}
              className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear area filter"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Area Suggestions Dropdown */}
        {showAreaSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filterAreaSuggestions(areaSearchQuery).map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAreaSuggestionClick(suggestion)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors ${
                  index === selectedAreaSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </div>
              </button>
            ))}
            {filterAreaSuggestions(areaSearchQuery).length === 0 && areaSearchQuery && (
              <div className="px-3 py-2 text-gray-500 text-sm">
                Press Enter to filter by "{areaSearchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Current area filter display */}
        {filters.area && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Filtering by:</span>
            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
              {filters.area}
              <button
                onClick={() => {
                  setAreaSearchQuery('');
                  handleAreaFilterChange('');
                }}
                className="ml-1 hover:text-orange-900"
              >
                <X size={12} />
              </button>
            </span>
          </div>
        )}
      </div>

      {/* 3. Property Type */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {UI_TEXT.labels.propertyTypes}
        </h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              className={`flex items-center w-full px-3 py-1.5 text-sm rounded-md border ${
                filters.propertyTypes.includes(type)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handlePropertyTypeToggle(type)}
            >
              <span className="flex-1 text-left">{type}</span>
              {filters.propertyTypes.includes(type) && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Price Range - Multiple Selection */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {UI_TEXT.labels.priceRange}
          {filters.priceRanges.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {filters.priceRanges.length}
            </span>
          )}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_RANGES.map((range, index) => (
            <button
              key={index}
              className={`px-3 py-1.5 text-sm rounded-md border ${
                isPriceRangeSelected(range)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handlePriceRangeToggle(range)}
            >
              {formatCurrency(range[0])} - {formatCurrency(range[1])}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Size Range - Multiple Selection (Expanded by default) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">
            {UI_TEXT.labels.sizeRange}
            {filters.sizeRanges.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                {filters.sizeRanges.length}
              </span>
            )}
          </h4>
          <button
            onClick={() => setShowSizeRange(!showSizeRange)}
            className="text-blue-600 text-sm flex items-center"
          >
            {showSizeRange ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {showSizeRange && (
          <div className="grid grid-cols-2 gap-2">
            {SIZE_RANGES.map((range, index) => (
              <button
                key={index}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  isSizeRangeSelected(range)
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSizeRangeToggle(range)}
              >
                {formatSquareYards(range[0])} - {formatSquareYards(range[1])} sq.yd
              </button>
            ))}
          </div>
        )}
      </div>
     {/* 1. Sort By */}
      <div>
        <h4 className="text-sm font-medium mb-2">{UI_TEXT.labels.sortBy}</h4>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
          className="w-full border rounded-md p-2 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {/* 6. Zone Filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">
          {UI_TEXT.labels.zone}
          {filters.zone && (
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">
              Selected
            </span>
          )}
        </h4>
        <select
          value={filters.zone || ''}
          onChange={(e) => handleZoneChange(e.target.value)}
          className="w-full border rounded-md p-2 text-sm"
        >
          <option value="">All Zones</option>
          {PROPERTY_ZONES.map((zone) => (
            <option key={zone} value={zone}>
              {zone}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Rating (Collapsed) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">{UI_TEXT.labels.rating}</h4>
          <button
            onClick={() => setShowRating(!showRating)}
            className="text-blue-600 text-sm flex items-center"
          >
            {showRating ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {showRating && (
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-md border ${
                filters.rating === undefined
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => updateFilters({ rating: undefined })}
            >
              Any
            </button>
            {RATING_OPTIONS.slice(2).map((rating) => (
              <button
                key={rating}
                className={`px-3 py-1.5 text-sm rounded-md border flex items-center justify-center space-x-1 ${
                  filters.rating === rating
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => updateFilters({ rating })}
              >
                <span>{rating}+</span>
                {renderRating(rating)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 8. Include Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center">
            <Tag size={16} className="mr-1 text-green-600" />
            {UI_TEXT.labels.includeTags}
            {filters.tags.length > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                {filters.tags.length}
              </span>
            )}
          </h4>
          <button
            onClick={() => setShowIncludeTags(!showIncludeTags)}
            className="text-blue-600 text-sm flex items-center"
          >
            {showIncludeTags ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {/* Selected Include Tags */}
        {filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {filters.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs hover:bg-green-200 transition-colors"
              >
                <span>{tag}</span>
                <X size={12} className="ml-1" />
              </button>
            ))}
          </div>
        )}

        {showIncludeTags && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tags to include..."
                value={tagSearchQuery}
                onChange={(e) => setTagSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pr-8 border rounded-md text-sm"
              />
              <Search
                size={16}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filteredIncludeTags.map((tag) => (
                <button
                  key={tag}
                  className={`flex items-center w-full px-3 py-1.5 text-sm rounded-md border ${
                    filters.tags.includes(tag)
                      ? 'bg-green-50 border-green-300 text-green-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTagToggle(tag)}
                >
                  <span className="flex-1 text-left">{tag}</span>
                  {filters.tags.includes(tag) && <Check size={16} />}
                </button>
              ))}
              {filteredIncludeTags.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No tags found
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 9. Exclude Tags */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center">
            <Minus size={16} className="mr-1 text-red-600" />
            {UI_TEXT.labels.excludeTags}
            {filters.excludedTags.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                {filters.excludedTags.length}
              </span>
            )}
          </h4>
          <button
            onClick={() => setShowExcludeTags(!showExcludeTags)}
            className="text-blue-600 text-sm flex items-center"
          >
            {showExcludeTags ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {/* Selected Exclude Tags */}
        {filters.excludedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {filters.excludedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleExcludeTagToggle(tag)}
                className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs hover:bg-red-200 transition-colors"
              >
                <span>{tag}</span>
                <X size={12} className="ml-1" />
              </button>
            ))}
          </div>
        )}

        {showExcludeTags && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search tags to exclude..."
                value={excludeTagSearchQuery}
                onChange={(e) => setExcludeTagSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pr-8 border rounded-md text-sm"
              />
              <Search
                size={16}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {filteredExcludeTags.map((tag) => (
                <button
                  key={tag}
                  className={`flex items-center w-full px-3 py-1.5 text-sm rounded-md border ${
                    filters.excludedTags.includes(tag)
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleExcludeTagToggle(tag)}
                >
                  <span className="flex-1 text-left">{tag}</span>
                  {filters.excludedTags.includes(tag) && <Check size={16} />}
                </button>
              ))}
              {filteredExcludeTags.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  No tags found
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 10. Location Status */}
      <div>
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <MapPin size={16} className="mr-1 text-blue-600" />
          {UI_TEXT.labels.hasLocation}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${
              filters.hasLocation === null
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleLocationStatusChange(null)}
          >
            All
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${
              filters.hasLocation === true
                ? 'bg-green-50 border-green-300 text-green-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleLocationStatusChange(true)}
          >
            <div className="flex flex-col items-center">
              <span>Added</span>
              <span className="text-xs text-gray-500">({locationStats.withLocation})</span>
            </div>
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${
              filters.hasLocation === false
                ? 'bg-orange-50 border-orange-300 text-orange-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleLocationStatusChange(false)}
          >
            <div className="flex flex-col items-center">
              <span>Missing</span>
              <span className="text-xs text-gray-500">({locationStats.withoutLocation})</span>
            </div>
          </button>
        </div>
      </div>

      {/* 11. Radius Coverage (Collapsed) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium flex items-center">
            <Target size={16} className="mr-1 text-purple-600" />
            {UI_TEXT.labels.radiusRange}
          </h4>
          <button
            onClick={() => setShowRadiusRange(!showRadiusRange)}
            className="text-blue-600 text-sm flex items-center"
          >
            {showRadiusRange ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        {showRadiusRange && (
          <div className="grid grid-cols-2 gap-2">
            {RADIUS_RANGES.map((range, index) => (
              <button
                key={index}
                className={`px-3 py-1.5 text-sm rounded-md border ${
                  filters.radiusRange[0] === range[0] &&
                  filters.radiusRange[1] === range[1]
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() =>
                  updateFilters({ radiusRange: [range[0], range[1]] })
                }
              >
                {range[0] === 0 && range[1] === 0 
                  ? 'No Radius' 
                  : `${formatRadius(range[0])} - ${formatRadius(range[1])}`
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;