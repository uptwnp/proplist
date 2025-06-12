import React, { useState } from 'react';
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
import { formatCurrency } from '../utils/formatters';
import {
  PROPERTY_TYPES,
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

  const allTags = getAllTags();

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

      {/* 2. Property Type */}
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

      {/* 3. Price Range - Multiple Selection */}
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
              {formatCurrency(range[0])} -{' '}
              {range[1] === 100000000 ? '5+ Cr' : formatCurrency(range[1])}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Size Range - Multiple Selection (Collapsed) */}
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
                {Math.round(range[0] / 9)} -{' '}
                {range[1] === 10000 ? '1000+' : Math.round(range[1] / 9)} yd
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Rating (Collapsed) */}
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

      {/* 6. Include Tags */}
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

      {/* 7. Exclude Tags */}
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

      {/* 8. Location Status */}
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

      {/* 9. Radius Coverage (Collapsed) */}
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