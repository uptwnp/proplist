import React, { useState, useCallback, useEffect } from 'react';
import { X, MapPin, Crosshair, Layers, Map as MapIcon, Save, Search, Loader2, Navigation } from 'lucide-react';
import { Property } from '../types';
import { useStore } from '../store/store';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import maplibreGl from 'maplibre-gl';
import circle from '@turf/circle';
import { point } from '@turf/helpers';
import { MAP_CONFIG, PROPERTY_ZONES, ERROR_MESSAGES, DEFAULT_COORDINATES } from '../constants';

interface LocationUpdateModalProps {
  property: Property;
  onClose: () => void;
}

const LocationUpdateModal: React.FC<LocationUpdateModalProps> = ({ property, onClose }) => {
  const { updateProperty, isMobileView } = useStore();
  
  // Backup coordinates for Karnal, Haryana
  const BACKUP_COORDINATES = {
    latitude: 29.3864726,
    longitude: 76.9956668
  };
  
  const radiusSteps = [0, 20, 50, 100, 200, 300, 500, 700, 1000, 2000, 3000, 4000, 5000, 7000, 10000, 15000, 20000, 25000, 30000, 50000];
  
  // Helper function to ensure valid location
  const ensureValidLocation = (location: any) => {
    if (!location || 
        typeof location.latitude !== 'number' || 
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) || 
        isNaN(location.longitude)) {
      return BACKUP_COORDINATES;
    }
    return location;
  };
  
  const [location, setLocation] = useState(() => ensureValidLocation(property.location));
  const [radius, setRadius] = useState(property.radius || 0);
  
  // Remember satellite view preference from localStorage
  const [isSatelliteView, setIsSatelliteView] = useState(() => {
    const saved = localStorage.getItem('mapSatelliteView');
    return saved ? JSON.parse(saved) : true;
  });
  
  const [mapViewport, setMapViewport] = useState(() => {
    const validLocation = ensureValidLocation(property.location);
    
    // Try to load saved viewport first, but use property location if available
    const savedViewport = localStorage.getItem('mapViewport');
    let initialViewport = {
      latitude: validLocation.latitude,
      longitude: validLocation.longitude,
      zoom: 15
    };
    
    // If property has a valid location (not default), use it
    // Otherwise, try to use saved viewport
    if (
      validLocation.latitude === BACKUP_COORDINATES.latitude &&
      validLocation.longitude === BACKUP_COORDINATES.longitude &&
      savedViewport
    ) {
      try {
        const parsed = JSON.parse(savedViewport);
        if (
          parsed &&
          typeof parsed.latitude === 'number' &&
          typeof parsed.longitude === 'number' &&
          typeof parsed.zoom === 'number' &&
          !isNaN(parsed.latitude) &&
          !isNaN(parsed.longitude) &&
          !isNaN(parsed.zoom)
        ) {
          initialViewport = {
            latitude: parsed.latitude,
            longitude: parsed.longitude,
            zoom: Math.max(15, parsed.zoom) // Use at least zoom 15 for location editing
          };
        }
      } catch (error) {
        console.error('Error parsing saved viewport in location modal:', error);
      }
    }
    
    return initialViewport;
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  // Save satellite view preference when it changes
  useEffect(() => {
    localStorage.setItem('mapSatelliteView', JSON.stringify(isSatelliteView));
  }, [isSatelliteView]);

  // Save viewport changes to localStorage with debouncing (for location modal)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        mapViewport &&
        typeof mapViewport.latitude === 'number' &&
        typeof mapViewport.longitude === 'number' &&
        typeof mapViewport.zoom === 'number' &&
        !isNaN(mapViewport.latitude) &&
        !isNaN(mapViewport.longitude) &&
        !isNaN(mapViewport.zoom)
      ) {
        const viewportToSave = {
          latitude: mapViewport.latitude,
          longitude: mapViewport.longitude,
          zoom: mapViewport.zoom,
        };
        
        localStorage.setItem('mapViewport', JSON.stringify(viewportToSave));
      }
    }, 1000); // 1 second debounce for location modal

    return () => clearTimeout(timeoutId);
  }, [mapViewport.latitude, mapViewport.longitude, mapViewport.zoom]);

  // Generate search suggestions based on zones
  const generateSearchSuggestions = useCallback((query: string) => {
    if (!query.trim()) return [];
    
    const suggestions = [];
    const queryLower = query.toLowerCase();
    
    // Add zone-based suggestions with "Panipat" suffix
    PROPERTY_ZONES.forEach(zone => {
      if (zone.toLowerCase().includes(queryLower)) {
        suggestions.push(`${zone}, Panipat`);
        suggestions.push(zone); // Also add without suffix
      }
    });
    
    // Add direct search terms
    if (queryLower.length > 2) {
      suggestions.push(`${query}, Panipat`);
      suggestions.push(`${query}, Haryana`);
      suggestions.push(`${query}, India`);
    }
    
    // Remove duplicates and limit to 8 suggestions
    return Array.from(new Set(suggestions)).slice(0, 8);
  }, []);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim()) {
      const suggestions = generateSearchSuggestions(value);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle search focus
  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      const suggestions = generateSearchSuggestions(searchQuery);
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      // Show zone suggestions when focused with empty input
      const zoneSuggestions = PROPERTY_ZONES.slice(0, 8).map(zone => `${zone}, Panipat`);
      setSearchSuggestions(zoneSuggestions);
      setShowSuggestions(true);
    }
  };

  // Handle search blur
  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // Detect input type and handle accordingly
  const detectInputType = (input: string) => {
    const trimmed = input.trim();
    
    // Check for Plus Code (format: 8 characters + optional 2-4 more, or short codes with +)
    const plusCodeRegex = /^([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}|[23456789CFGHJMPQRVWX]{10})$/i;
    if (plusCodeRegex.test(trimmed.replace(/\s/g, ''))) {
      return 'pluscode';
    }
    
    // Check for coordinates (lat,lng or lat lng)
    const coordRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const coordMatch = trimmed.match(coordRegex);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return 'coordinates';
      }
    }
    
    // Default to search query
    return 'search';
  };

  // Google Maps Geocoding API for Plus Code conversion
  const handlePlusCodeWithGoogleMaps = async (plusCode: string) => {
    try {
      // Clean the plus code
      const cleanPlusCode = plusCode.trim().toUpperCase().replace(/\s/g, '');
      
      // Basic Plus Code validation
      const plusCodeRegex = /^([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}|[23456789CFGHJMPQRVWX]{10})$/i;
      if (!plusCodeRegex.test(cleanPlusCode)) {
        throw new Error('Invalid Plus Code format');
      }
      
      console.log('Converting Plus Code with Google Maps API:', cleanPlusCode);
      
      // Use Google Maps Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanPlusCode)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE'}`
      );
      
      if (!response.ok) {
        throw new Error('Google Maps API request failed');
      }
      
      const data = await response.json();
      console.log('Google Maps API response:', data);
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        
        console.log('Plus Code converted to coordinates:', { lat, lng });
        
        setLocation({ latitude: lat, longitude: lng });
        setMapViewport({
          latitude: lat,
          longitude: lng,
          zoom: 16
        });
        setShowSuggestions(false);
        return true;
      } else {
        console.warn('Google Maps API returned no results:', data);
        // Fallback to local implementation
        return await handlePlusCodeFallback(cleanPlusCode);
      }
    } catch (error) {
      console.error('Google Maps Plus Code conversion error:', error);
      // Fallback to local implementation
      return await handlePlusCodeFallback(plusCode);
    }
  };

  // Fallback Plus Code conversion implementation
  const handlePlusCodeFallback = async (plusCode: string) => {
    try {
      // Clean the plus code
      const cleanPlusCode = plusCode.trim().toUpperCase().replace(/\s/g, '');
      
      console.log('Using fallback Plus Code conversion for:', cleanPlusCode);
      
      // Try to decode using Open Location Code algorithm
      const decoded = decodePlusCode(cleanPlusCode);
      
      if (decoded) {
        setLocation({ latitude: decoded.lat, longitude: decoded.lng });
        setMapViewport({
          latitude: decoded.lat,
          longitude: decoded.lng,
          zoom: 16
        });
        setShowSuggestions(false);
        return true;
      } else {
        throw new Error('Unable to decode Plus Code');
      }
    } catch (error) {
      console.error('Fallback Plus Code conversion error:', error);
      alert(`Unable to convert Plus Code "${plusCode}". Please check the format and try again.`);
      return false;
    }
  };

  // Main Plus Code handler that tries Google Maps first, then fallback
  const handlePlusCode = async (plusCode: string) => {
    // Check if Google Maps API key is available
    const hasGoogleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY && 
                             import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE';
    
    if (hasGoogleMapsKey) {
      console.log('Using Google Maps API for Plus Code conversion');
      return await handlePlusCodeWithGoogleMaps(plusCode);
    } else {
      console.log('Google Maps API key not available, using fallback conversion');
      return await handlePlusCodeFallback(plusCode);
    }
  };

  // Simple Plus Code decoder implementation (fallback)
  const decodePlusCode = (plusCode: string) => {
    try {
      // This is a simplified implementation of Open Location Code decoding
      // For production use, consider using the official openlocationcode library
      
      const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
      const SEPARATOR = '+';
      const SEPARATOR_POSITION = 8;
      const PADDING_CHARACTER = '0';
      
      // Remove separator and padding
      let code = plusCode.replace(SEPARATOR, '');
      
      // Check if we have at least 8 characters
      if (code.length < 8) {
        return null;
      }
      
      // Decode the grid coordinates
      let latLo = -90.0;
      let lngLo = -180.0;
      let latHi = 90.0;
      let lngHi = 180.0;
      
      // Process pairs of characters
      for (let i = 0; i < Math.min(code.length, 10); i += 2) {
        if (i >= code.length - 1) break;
        
        const latChar = code[i];
        const lngChar = code[i + 1];
        
        const latIndex = CODE_ALPHABET.indexOf(latChar);
        const lngIndex = CODE_ALPHABET.indexOf(lngChar);
        
        if (latIndex === -1 || lngIndex === -1) {
          return null;
        }
        
        const latRange = latHi - latLo;
        const lngRange = lngHi - lngLo;
        
        const latStep = latRange / 20;
        const lngStep = lngRange / 20;
        
        latLo = latLo + latIndex * latStep;
        latHi = latLo + latStep;
        lngLo = lngLo + lngIndex * lngStep;
        lngHi = lngLo + lngStep;
      }
      
      // Return the center of the final grid cell
      const lat = (latLo + latHi) / 2;
      const lng = (lngLo + lngHi) / 2;
      
      // Validate the result
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
      
      return null;
    } catch (error) {
      console.error('Plus Code decoding error:', error);
      return null;
    }
  };

  // Handle coordinate input
  const handleCoordinates = (coordString: string) => {
    const coordRegex = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const match = coordString.trim().match(coordRegex);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setLocation({ latitude: lat, longitude: lng });
        setMapViewport({
          latitude: lat,
          longitude: lng,
          zoom: 16
        });
        setShowSuggestions(false);
        return true;
      }
    }
    return false;
  };

  // Geocoding function using Nominatim (OpenStreetMap)
  const geocodeLocation = async (query: string) => {
    try {
      setIsSearching(true);
      
      // Enhanced query construction with better location context
      let enhancedQuery = query.trim();
      const queryLower = enhancedQuery.toLowerCase();
      
      // Ensure we have complete address information
      if (!queryLower.includes('india')) {
        if (!queryLower.includes('haryana')) {
          if (!queryLower.includes('panipat')) {
            enhancedQuery = `${enhancedQuery}, Panipat, Haryana, India`;
          } else {
            enhancedQuery = `${enhancedQuery}, Haryana, India`;
          }
        } else {
          enhancedQuery = `${enhancedQuery}, India`;
        }
      }
      
      console.log('Geocoding query:', enhancedQuery);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enhancedQuery)}&limit=5&countrycodes=in&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      console.log('Geocoding response:', data);
      
      if (data && data.length > 0) {
        // Try to find the best match - prefer results with Panipat or Haryana in the display name
        let bestResult = data[0];
        
        for (const result of data) {
          const displayName = result.display_name?.toLowerCase() || '';
          if (displayName.includes('panipat') || displayName.includes('haryana')) {
            bestResult = result;
            break;
          }
        }
        
        const lat = parseFloat(bestResult.lat);
        const lon = parseFloat(bestResult.lon);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          setLocation({ latitude: lat, longitude: lon });
          setMapViewport({
            latitude: lat,
            longitude: lon,
            zoom: 16
          });
          setShowSuggestions(false);
          return true;
        }
      }
      
      // If no results found, try a broader search with just the original query + India
      if (data.length === 0 && !queryLower.includes('india')) {
        const broadQuery = `${query.trim()}, India`;
        console.log('Trying broader search:', broadQuery);
        
        const broadResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(broadQuery)}&limit=5&countrycodes=in&addressdetails=1`
        );
        
        if (broadResponse.ok) {
          const broadData = await broadResponse.json();
          console.log('Broad search response:', broadData);
          
          if (broadData && broadData.length > 0) {
            const result = broadData[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            if (!isNaN(lat) && !isNaN(lon)) {
              setLocation({ latitude: lat, longitude: lon });
              setMapViewport({
                latitude: lat,
                longitude: lon,
                zoom: 16
              });
              setShowSuggestions(false);
              return true;
            }
          }
        }
      }
      
      throw new Error('Location not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      // Only show alert for manual searches, not auto-searches
      if (hasAutoSearched) {
        console.log(`Auto-search failed for "${query}" - this is normal, continuing with default location`);
      } else {
        alert(`Unable to find location "${query}". Please try a more specific address or check the spelling.`);
      }
      return false;
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search submission with input type detection
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const inputType = detectInputType(searchQuery);
    
    switch (inputType) {
      case 'pluscode':
        await handlePlusCode(searchQuery.trim());
        break;
      case 'coordinates':
        if (!handleCoordinates(searchQuery)) {
          alert('Invalid coordinates. Please use format: latitude, longitude (e.g., 29.3865, 76.9957)');
        }
        break;
      case 'search':
      default:
        await geocodeLocation(searchQuery.trim());
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    await geocodeLocation(suggestion);
  };

  // Check if property has valid location (not default coordinates)
  const hasValidLocation = () => {
    if (!property.location) return false;
    
    const { latitude, longitude } = property.location;
    return (
      latitude !== DEFAULT_COORDINATES.latitude ||
      longitude !== DEFAULT_COORDINATES.longitude
    );
  };

  // Auto-search when modal opens - UPDATED: Only if property has zone AND no valid location
  useEffect(() => {
    const performAutoSearch = async () => {
      if (property.zone && 
          property.zone !== 'Other' && 
          property.zone.trim() && 
          !hasAutoSearched &&
          !hasValidLocation()) { // Only auto-search if location doesn't exist
        const searchTerm = `${property.zone}, Panipat`;
        setSearchQuery(searchTerm);
        setHasAutoSearched(true);
        
        console.log('Auto-searching for zone (no existing location):', searchTerm);
        await geocodeLocation(searchTerm);
      }
    };

    // Small delay to ensure modal is fully rendered
    const timer = setTimeout(performAutoSearch, 500);
    return () => clearTimeout(timer);
  }, [property.zone, hasAutoSearched]);

  const handleMapClick = useCallback((event: any) => {
    // First check if event exists and has lngLat property
    if (!event || !event.lngLat) {
      console.warn('Invalid map click event - missing event or lngLat:', event);
      return;
    }
    
    // Then destructure and validate the coordinates
    const { lat, lng } = event.lngLat;
    
    if (typeof lat !== 'number' || 
        typeof lng !== 'number' ||
        isNaN(lat) || 
        isNaN(lng)) {
      console.warn('Invalid map click coordinates:', { lat, lng });
      return;
    }
    
    setLocation({
      latitude: lat,
      longitude: lng
    });
  }, []);

  const handleGPSLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Validate GPS coordinates
          if (isNaN(latitude) || isNaN(longitude)) {
            console.warn('Invalid GPS coordinates:', { latitude, longitude });
            return;
          }
          
          setUserLocation({ latitude, longitude });
          setLocation({ latitude, longitude });
          setMapViewport({
            latitude,
            longitude,
            zoom: 16
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please check your GPS settings and try again.');
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    } else {
      alert('GPS is not supported in your browser');
    }
  };

  useEffect(() => {
    let watchId: number;
    
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Validate GPS coordinates
          if (!isNaN(latitude) && !isNaN(longitude)) {
            setUserLocation({ latitude, longitude });
          }
        },
        (error) => {
          console.error('Error watching position:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 60000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const formatRadius = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  const getCircleGeoJSON = () => {
    if (!location || !radius) return null;
    
    const center = point([location.longitude, location.latitude]);
    const options = { steps: 64, units: 'meters' as const };
    const circleGeojson = circle(center, radius, options);
    
    return circleGeojson;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedProperty = {
        ...property,
        location: location,
        radius: radius
      };
      
      await updateProperty(updatedProperty);
      onClose();
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const mapStyle = {
    version: 8,
    sources: {
      'osm': {
        type: 'raster',
        tiles: [
          isSatelliteView 
            ? MAP_CONFIG.satelliteUrl
            : MAP_CONFIG.streetUrl
        ],
        tileSize: 256,
        attribution: isSatelliteView ? '© Esri' : '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  };

  // Get input placeholder based on detected type
  const getInputPlaceholder = () => {
    if (!searchQuery) {
      return "Search location, coordinates (lat,lng), or Plus Code...";
    }
    
    const inputType = detectInputType(searchQuery);
    switch (inputType) {
      case 'pluscode':
        return "Plus Code detected - will convert to coordinates";
      case 'coordinates':
        return "Coordinates detected";
      default:
        return "Search for a location...";
    }
  };

  return (
    <div className={`fixed bg-black bg-opacity-50 z-[200] flex items-center justify-center ${
      isMobileView ? 'inset-0' : 'inset-0 p-4'
    }`}>
      <div className={`bg-white rounded-lg w-full flex flex-col ${
        isMobileView 
          ? 'h-full max-w-none rounded-none' 
          : 'max-w-4xl h-[90vh]'
      }`}>
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Update Location</h2>
            <p className="text-sm text-gray-600">{property.area}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-4">
              {/* Enhanced Search Bar */}
              <div className="relative">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={getInputPlaceholder()}
                    disabled={isSearching}
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {isSearching ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Search size={20} />
                    )}
                  </button>
                </form>

                {/* Input Type Indicator */}
                {searchQuery && (
                  <div className="mt-1 text-xs text-gray-500">
                    {detectInputType(searchQuery) === 'coordinates' && (
                      <span className="text-green-600">✓ Coordinates format detected</span>
                    )}
                    {detectInputType(searchQuery) === 'pluscode' && (
                      <span className="text-blue-600">✓ Plus Code format detected - will convert using Google Maps API</span>
                    )}
                    {detectInputType(searchQuery) === 'search' && searchQuery.includes(',') && (
                      <span className="text-gray-500">Search query (use lat,lng for coordinates)</span>
                    )}
                  </div>
                )}

                {/* Search Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900">{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Map Container */}
              <div className={`rounded-lg overflow-hidden border relative ${
                isMobileView ? 'h-64' : 'h-[22.5rem]'
              }`}>
                <Map
                  {...mapViewport}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={mapStyle}
                  onClick={handleMapClick}
                  onMove={evt => setMapViewport(evt.viewState)}
                  mapLib={maplibreGl}
                  minZoom={MAP_CONFIG.minZoom}
                  maxZoom={MAP_CONFIG.maxZoom}
                >
                  {/* Map Controls */}
                  <div className="absolute top-2 right-2 bg-white rounded-md shadow-md z-10 flex flex-col gap-1 p-1">
                    <button 
                      type="button"
                      onClick={() => setIsSatelliteView(!isSatelliteView)}
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors w-full flex items-center justify-center"
                      title={isSatelliteView ? "Switch to Street View" : "Switch to Satellite View"}
                    >
                      {isSatelliteView ? <MapIcon size={20} /> : <Layers size={20} />}
                    </button>
                  </div>
                  
                  <NavigationControl position="bottom-right" />

                  {/* GPS Button */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-md shadow-md p-1">
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                      onClick={handleGPSLocation}
                      title="Use current location"
                    >
                      <Crosshair size={20} />
                    </button>
                  </div>
                  
                  {/* Radius Circle */}
                  {location && radius > 0 && (
                    <Source type="geojson" data={getCircleGeoJSON()}>
                      <Layer
                        id="radius-circle"
                        type="fill"
                        paint={{
                          'fill-color': '#4285f4',
                          'fill-opacity': 0.15
                        }}
                      />
                      <Layer
                        id="radius-circle-border"
                        type="line"
                        paint={{
                          'line-color': '#4285f4',
                          'line-width': 2
                        }}
                      />
                    </Source>
                  )}
                  
                  {/* Property Marker */}
                  <Marker
                    longitude={location.longitude}
                    latitude={location.latitude}
                    anchor="center"
                    draggable
                    onDragEnd={(e) => {
                      // First check if event exists and has lngLat property
                      if (!e || !e.lngLat) {
                        console.warn('Invalid drag end event - missing event or lngLat:', e);
                        return;
                      }
                      
                      // Then destructure and validate the coordinates
                      const { lat, lng } = e.lngLat;
                      
                      if (typeof lat !== 'number' || 
                          typeof lng !== 'number' ||
                          isNaN(lat) || 
                          isNaN(lng)) {
                        console.warn('Invalid drag end coordinates:', { lat, lng });
                        return;
                      }
                      
                      setLocation({
                        latitude: lat,
                        longitude: lng
                      });
                    }}
                  >
                    <div className="cursor-grab active:cursor-grabbing">
                      <div className="relative flex items-center justify-center">
                        <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                          <MapPin size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </Marker>

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      longitude={userLocation.longitude}
                      latitude={userLocation.latitude}
                      anchor="center"
                    >
                      <div className="relative">
                        <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                        <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-20 animate-ping" />
                      </div>
                    </Marker>
                  )}
                </Map>
              </div>
              
              {/* Radius Control */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Coverage Radius</label>
                <input
                  type="range"
                  value={radiusSteps.indexOf(radius)}
                  onChange={e => setRadius(radiusSteps[Number(e.target.value)])}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  min="0"
                  max={radiusSteps.length - 1}
                  step="1"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0m</span>
                  <span className="font-medium text-blue-600">{formatRadius(radius)}</span>
                  <span>50km</span>
                </div>
              </div>
              
              {/* Location Info */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">Current Coordinates:</div>
                <div className="font-mono text-sm">
                  {location.latitude.toFixed(6)}°N, {location.longitude.toFixed(6)}°E
                </div>
              </div>

              {/* Input Format Help */}
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800 font-medium mb-1">Supported Input Formats:</div>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>• <strong>Search:</strong> "Modal Town, Panipat" or "Sector 7"</div>
                  <div>• <strong>Coordinates:</strong> "29.3865, 76.9957" or "29.3865 76.9957"</div>
                  <div>• <strong>Plus Code:</strong> "7JVW9XPW+XX" or "92M2+R8" (Google Maps API powered!)</div>
                </div>
              </div>

              {/* API Status Indicator */}
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-800 font-medium mb-1">Plus Code Conversion:</div>
                <div className="text-xs text-green-700">
                  {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && import.meta.env.VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY_HERE' ? (
                    <span>✅ Google Maps API enabled for accurate Plus Code conversion</span>
                  ) : (
                    <span>⚠️ Using fallback conversion (add VITE_GOOGLE_MAPS_API_KEY for better accuracy)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Update Location</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationUpdateModal;