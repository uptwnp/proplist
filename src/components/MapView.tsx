import React, { useEffect, useCallback, useState, useMemo } from 'react';
import Map, {
  Marker,
  NavigationControl,
  Popup,
  Source,
  Layer,
} from 'react-map-gl';
import maplibreGl from 'maplibre-gl';
import { useStore } from '../store/store';
import { Layers, Map as MapIcon, Home, Crosshair, MapPin, Eye, Store, Building2, Building, Wheat, Warehouse, Factory, Zap, IndianRupee, ExternalLink, Navigation, ShoppingBag, TreePine, Truck, Wrench, Landmark, LandPlot, Grid2x2 as Grid2x2Check } from 'lucide-react';
import { Property } from '../types';
import {
  DEFAULT_COORDINATES,
  PROPERTY_TYPE_COLORS,
  PROPERTY_TYPE_ICONS,
  MAP_CONFIG,
} from '../constants';
import { formatCurrency } from '../utils/formatters';
import circle from '@turf/circle';
import { point } from '@turf/helpers';

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

// Icon component mapping using the constants - Updated with available icons
const IconComponents = {
  LandPlot,
  Store,
  Home, // Changed from House to Home
  Building2,
  Building,
  Wheat,
  TreePine,
  Warehouse,
  Factory,
  Grid2x2Check,
  MapPin, // Changed from MapPinHouse to MapPin
};

const MapView: React.FC = () => {
  const {
    filteredProperties,
    mapViewport,
    setMapViewport,
    selectedProperty,
    setSelectedProperty,
    togglePropertyDetail,
    togglePropertyForm,
    properties,
    setFilteredProperties,
    isLiveView,
    setIsLiveView,
  } = useStore();

  const [popupInfo, setPopupInfo] = useState<Property | null>(null);
  const [isSatelliteView, setIsSatelliteView] = useState(() => {
    // Remember satellite view preference
    const saved = localStorage.getItem('mapSatelliteView');
    return saved ? JSON.parse(saved) : true;
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Save satellite view preference
  useEffect(() => {
    localStorage.setItem('mapSatelliteView', JSON.stringify(isSatelliteView));
  }, [isSatelliteView]);

  // Filter properties to only include those with valid locations
  const validProperties = useMemo(() => {
    return filteredProperties.filter((property) => {
      const location = ensureValidLocation(property.location);
      // Only include properties where location is not the backup (meaning they have real coordinates)
      return (
        location.latitude !== DEFAULT_COORDINATES.latitude ||
        location.longitude !== DEFAULT_COORDINATES.longitude ||
        (property.location &&
          typeof property.location.latitude === 'number' &&
          typeof property.location.longitude === 'number' &&
          !isNaN(property.location.latitude) &&
          !isNaN(property.location.longitude))
      );
    });
  }, [filteredProperties]);

  const onMapLoad = useCallback(
    (event: any) => {
      console.log('Map loaded, setting initial bounds from map.getBounds()');
      const map = event.target;

      // Ensure map is properly loaded before getting bounds
      if (map && typeof map.getBounds === 'function') {
        try {
          const bounds = map.getBounds();

          if (bounds && typeof bounds.getNorth === 'function') {
            // Use the store's bounds converter to ensure proper format
            setMapViewport({
              bounds: bounds, // Let the store handle the conversion
            });
          }
        } catch (error) {
          console.warn('Error getting map bounds on load:', error);
        }
      }
    },
    [setMapViewport]
  );

  const onMapMove = useCallback(
    ({ viewState, target }: any) => {
      let bounds;

      // Get bounds from the map instance with error handling
      if (target && typeof target.getBounds === 'function') {
        try {
          const mapBounds = target.getBounds();
          if (mapBounds && typeof mapBounds.getNorth === 'function') {
            bounds = mapBounds; // Pass the MapLibre bounds object directly
          }
        } catch (error) {
          console.warn('Error getting map bounds on move:', error);
        }
      }

      // Validate viewState before setting
      if (
        viewState &&
        typeof viewState.latitude === 'number' &&
        typeof viewState.longitude === 'number' &&
        typeof viewState.zoom === 'number' &&
        !isNaN(viewState.latitude) &&
        !isNaN(viewState.longitude) &&
        !isNaN(viewState.zoom)
      ) {
        setMapViewport({
          latitude: viewState.latitude,
          longitude: viewState.longitude,
          zoom: viewState.zoom,
          bounds,
        });
      }
    },
    [setMapViewport]
  );

  const handleMapClick = useCallback(
    (event: any) => {
      // Enhanced validation for map click events
      if (!event || !event.originalEvent) {
        return;
      }

      // Only handle direct map clicks, not marker clicks
      if (
        event.originalEvent.target &&
        (event.originalEvent.target.closest('.maplibregl-marker') ||
          event.originalEvent.target.closest('button'))
      ) {
        return;
      }

      setPopupInfo(null);
      setSelectedProperty(null);
      togglePropertyDetail(false);
    },
    [setSelectedProperty, togglePropertyDetail]
  );

  const handleGPSLocation = (event: React.MouseEvent) => {
    event.stopPropagation();
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Validate GPS coordinates
          if (!isNaN(latitude) && !isNaN(longitude)) {
            setUserLocation({ latitude, longitude });
            setMapViewport({
              latitude,
              longitude,
              zoom: 16,
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          alert(
            'Unable to get your location. Please check your GPS settings and try again.'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );

      // Start watching position
      if (!watchId) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            if (!isNaN(latitude) && !isNaN(longitude)) {
              setUserLocation({ latitude, longitude });
            }
          },
          (error) => {
            console.error('Error watching position:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
        setWatchId(id);
      }
    } else {
      alert('GPS is not supported in your browser');
    }
  };

  // Cleanup watch position
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const getMarkerColor = (property: Property): string => {
    return PROPERTY_TYPE_COLORS[property.type] || '#6B7280';
  };

  const getMarkerIcon = (property: Property) => {
    // Use the PROPERTY_TYPE_ICONS constant to get the correct icon name
    const iconName = PROPERTY_TYPE_ICONS[property.type] || 'MapPin';

    // Get the corresponding icon component
    const IconComponent =
      IconComponents[iconName as keyof typeof IconComponents] || MapPin;

    return IconComponent;
  };

  const getMarkerSize = (): number => {
    const zoom = mapViewport.zoom;

    if (zoom < 10) return 24;
    if (zoom < 12) return 28;
    if (zoom < 14) return 32;
    return 36;
  };

  const mapStyle = useMemo(
    () => ({
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            isSatelliteView ? MAP_CONFIG.satelliteUrl : MAP_CONFIG.streetUrl,
          ],
          tileSize: 256,
          attribution: isSatelliteView
            ? '© Esri'
            : '© OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    }),
    [isSatelliteView]
  );

  // Ensure mapViewport has valid coordinates
  const safeMapViewport = useMemo(() => {
    const viewport = { ...mapViewport };

    if (
      typeof viewport.latitude !== 'number' ||
      typeof viewport.longitude !== 'number' ||
      isNaN(viewport.latitude) ||
      isNaN(viewport.longitude)
    ) {
      viewport.latitude = DEFAULT_COORDINATES.latitude;
      viewport.longitude = DEFAULT_COORDINATES.longitude;
    }

    if (typeof viewport.zoom !== 'number' || isNaN(viewport.zoom)) {
      viewport.zoom = 12;
    }

    // CRITICAL: Remove bounds from the viewport passed to Map component
    // The Map component should not receive bounds as it causes the fitBounds error
    const { bounds, ...viewportWithoutBounds } = viewport;

    console.log(
      'MapView rendering with safeMapViewport:',
      viewportWithoutBounds
    );
    return viewportWithoutBounds;
  }, [mapViewport]);

  const openInGoogleMaps = (property: Property) => {
    const { latitude, longitude } = property.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const renderRating = (rating?: number) => {
    // Only show rating if it exists and is greater than 0
    if (!rating || rating === 0) return null;

    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-xs font-medium">{rating}/5</span>
      </div>
    );
  };

  // Get circle GeoJSON for radius visualization with enhanced visibility
  const getCircleGeoJSON = (property: Property) => {
    if (!property.radius || property.radius === 0) return null;

    const center = point([
      property.location.longitude,
      property.location.latitude,
    ]);
    const options = { steps: 64, units: 'meters' as const };
    const circleGeojson = circle(center, property.radius, options);

    return circleGeojson;
  };

  return (
    <div className="relative w-full h-full">
      <Map
        {...safeMapViewport}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        onLoad={onMapLoad}
        onMove={onMapMove}
        onClick={handleMapClick}
        attributionControl={true}
        mapLib={maplibreGl}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
      >
        {/* Render radius circles for properties with enhanced visibility */}
        {validProperties.map((property) => {
          const circleData = getCircleGeoJSON(property);
          if (!circleData) return null;

          const isSelected = selectedProperty?.id === property.id;
          const baseColor = getMarkerColor(property);

          return (
            <Source
              key={`radius-${property.id}`}
              type="geojson"
              data={circleData}
            >
              <Layer
                id={`radius-fill-${property.id}`}
                type="fill"
                paint={{
                  'fill-color': baseColor,
                  'fill-opacity': isSelected ? 0.25 : 0.15,
                }}
              />
              <Layer
                id={`radius-border-${property.id}`}
                type="line"
                paint={{
                  'line-color': baseColor,
                  'line-width': isSelected ? 3 : 2,
                  'line-opacity': isSelected ? 0.8 : 0.6,
                  'line-dasharray': isSelected ? [1, 0] : [2, 2],
                }}
              />
            </Source>
          );
        })}

        {validProperties.map((property) => {
          const validLocation = ensureValidLocation(property.location);
          const IconComponent = getMarkerIcon(property);
          const markerSize = getMarkerSize();
          const isSelected = selectedProperty?.id === property.id;

          return (
            <Marker
              key={property.id}
              longitude={validLocation.longitude}
              latitude={validLocation.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupInfo(property);
              }}
            >
              <div
                className={`flex items-center justify-center rounded-full border-3 transition-all cursor-pointer shadow-lg ${
                  isSelected
                    ? 'scale-125 border-white shadow-xl animate-pulse ring-4 ring-white ring-opacity-50'
                    : 'border-white shadow-md hover:scale-110 hover:shadow-xl'
                }`}
                style={{
                  backgroundColor: getMarkerColor(property),
                  width: markerSize,
                  height: markerSize,
                  borderWidth: '3px',
                }}
              >
                <IconComponent
                  size={markerSize * 0.55}
                  color="white"
                  strokeWidth={2}
                  fill="none"
                />
              </div>
            </Marker>
          );
        })}

        {/* User location marker */}
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

        {popupInfo && (
          <Popup
            longitude={ensureValidLocation(popupInfo.location).longitude}
            latitude={ensureValidLocation(popupInfo.location).latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            closeOnClick={false}
            className="rounded-lg overflow-hidden"
            maxWidth="320px"
          >
            <div className="p-1 bg-white">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {popupInfo.type || 'Property'}
                    </span>
                    {popupInfo.rating > 0 && renderRating(popupInfo.rating)}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                    {popupInfo.area || 'Property Area'}
                  </h3>
                </div>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="text-lg font-bold text-blue-600 flex items-center">
                  <IndianRupee size={16} />
                  <span>{formatCurrency(popupInfo.price_min)}</span>
                  {popupInfo.price_min !== popupInfo.price_max && (
                    <span className="text-sm font-normal text-gray-600 ml-1">
                      - {formatCurrency(popupInfo.price_max)}
                    </span>
                  )}
                </div>
              </div>

              {/* Size */}
              <div className="mb-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Size: </span>
                  {popupInfo.size_min === popupInfo.size_max
                    ? `${Math.round(popupInfo.size_min)} sq.yd`
                    : `${Math.round(popupInfo.size_min)} - ${Math.round(
                        popupInfo.size_max
                      )} sq.yd`}
                </div>
              </div>

              {/* Zone */}
              {popupInfo.zone && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Zone: </span>
                    {popupInfo.zone}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  className="flex-1 text-xs bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded transition-colors flex items-center justify-center space-x-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProperty(popupInfo);
                    togglePropertyDetail(true);
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Details</span>
                </button>
                <button
                  className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded transition-colors flex items-center justify-center space-x-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    openInGoogleMaps(popupInfo);
                  }}
                >
                  <Navigation size={12} />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          </Popup>
        )}

        <NavigationControl position="bottom-right" />

        {/* Live view toggle */}
        <div className="absolute top-4 left-4 bg-white rounded-md shadow-md p-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setIsLiveView(!isLiveView);
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
              isLiveView ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
            }`}
            title={isLiveView ? 'Live view enabled' : 'Live view disabled'}
          >
            <Eye
              size={18}
              className={isLiveView ? 'text-blue-600' : 'text-gray-600'}
            />
            <span className="text-sm">Live View</span>
          </button>
        </div>

        {/* Map controls */}
        <div className="absolute top-4 right-4 bg-white rounded-md shadow-md p-1 flex flex-col space-y-1">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setMapViewport({
                latitude: DEFAULT_COORDINATES.latitude,
                longitude: DEFAULT_COORDINATES.longitude,
                zoom: 12,
              });
            }}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Center on Karnal"
          >
            <Home size={18} />
          </button>
          <button
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              setIsSatelliteView(!isSatelliteView);
            }}
            title={
              isSatelliteView
                ? 'Switch to Street View'
                : 'Switch to Satellite View'
            }
          >
            {isSatelliteView ? <MapIcon size={18} /> : <Layers size={18} />}
          </button>
        </div>

        {/* GPS button */}
        <div className="absolute bottom-4 left-4 bg-white rounded-md shadow-md p-1">
          <button
            onClick={handleGPSLocation}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Use current location"
          >
            <Crosshair size={18} />
          </button>
        </div>
      </Map>
    </div>
  );
};

export default MapView;