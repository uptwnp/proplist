import React, { useEffect, useState, useCallback, useRef } from 'react';
import Map, { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import maplibreGl from 'maplibre-gl';
import { useStore } from '../store/store';
import { 
  Home, 
  Layers, 
  MapIcon, 
  Navigation,
  Crosshair,
  Plus,
  Minus
} from 'lucide-react';
import { MAP_CONFIG, DEFAULT_COORDINATES, PROPERTY_TYPE_COLORS } from '../constants';
import circle from '@turf/circle';
import { point } from '@turf/helpers';

const MapView: React.FC = () => {
  const {
    properties,
    selectedProperty,
    setSelectedProperty,
    togglePropertyDetail,
    mapViewport,
    setMapViewport,
    filteredProperties,
  } = useStore();

  // Remember satellite view preference from localStorage
  const [isSatelliteView, setIsSatelliteView] = useState(() => {
    const saved = localStorage.getItem('mapSatelliteView');
    return saved ? JSON.parse(saved) : true;
  });

  // Save satellite view preference when it changes
  useEffect(() => {
    localStorage.setItem('mapSatelliteView', JSON.stringify(isSatelliteView));
  }, [isSatelliteView]);

  // Check if map is at default location
  const isAtDefaultLocation = useCallback(() => {
    if (!mapViewport) return false;
    
    const latDiff = Math.abs(mapViewport.latitude - DEFAULT_COORDINATES.latitude);
    const lngDiff = Math.abs(mapViewport.longitude - DEFAULT_COORDINATES.longitude);
    const zoomDiff = Math.abs(mapViewport.zoom - MAP_CONFIG.defaultZoom);
    
    // Consider "close enough" to default (within small tolerance)
    return latDiff < 0.01 && lngDiff < 0.01 && zoomDiff < 1;
  }, [mapViewport]);

  const handleMapClick = useCallback((event: any) => {
    if (!event.features || event.features.length === 0) {
      setSelectedProperty(null);
    }
  }, [setSelectedProperty]);

  const handleMarkerClick = useCallback((property: any) => {
    setSelectedProperty(property);
    togglePropertyDetail(true);
  }, [setSelectedProperty, togglePropertyDetail]);

  const centerOnDefault = useCallback(() => {
    setMapViewport({
      ...mapViewport,
      latitude: DEFAULT_COORDINATES.latitude,
      longitude: DEFAULT_COORDINATES.longitude,
      zoom: MAP_CONFIG.defaultZoom
    });
  }, [mapViewport, setMapViewport]);

  const zoomIn = useCallback(() => {
    setMapViewport({
      ...mapViewport,
      zoom: Math.min(mapViewport.zoom + 1, MAP_CONFIG.maxZoom)
    });
  }, [mapViewport, setMapViewport]);

  const zoomOut = useCallback(() => {
    setMapViewport({
      ...mapViewport,
      zoom: Math.max(mapViewport.zoom - 1, MAP_CONFIG.minZoom)
    });
  }, [mapViewport, setMapViewport]);

  const getCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapViewport({
            latitude,
            longitude,
            zoom: MAP_CONFIG.focusZoom
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
  }, [setMapViewport]);

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

  const getCircleGeoJSON = (property: any) => {
    if (!property.radius || property.radius === 0) return null;
    
    const center = point([property.location.longitude, property.location.latitude]);
    const options = { steps: 64, units: 'meters' as const };
    const circleGeojson = circle(center, property.radius, options);
    
    return circleGeojson;
  };

  return (
    <div className="relative w-full h-full">
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
        <div className="absolute top-4 right-4 bg-white rounded-md shadow-md z-10 flex flex-col gap-1 p-1">
          <button 
            onClick={() => setIsSatelliteView(!isSatelliteView)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={isSatelliteView ? "Switch to Street View" : "Switch to Satellite View"}
          >
            {isSatelliteView ? <MapIcon size={20} /> : <Layers size={20} />}
          </button>
        </div>
        
        <NavigationControl position="bottom-right" />

        {/* Custom Controls */}
        <div className="absolute bottom-4 left-4 bg-white rounded-md shadow-md p-1 flex flex-col gap-1">
          <button
            onClick={getCurrentLocation}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Use current location"
          >
            <Crosshair size={20} />
          </button>
          
          <button
            onClick={centerOnDefault}
            className={`p-2 rounded-md transition-colors ${
              isAtDefaultLocation() 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'hover:bg-gray-100'
            }`}
            title="Center on Karnal"
          >
            <Home size={20} />
          </button>
          
          <div className="border-t border-gray-200 my-1"></div>
          
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom in"
            disabled={mapViewport.zoom >= MAP_CONFIG.maxZoom}
          >
            <Plus size={20} />
          </button>
          
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Zoom out"
            disabled={mapViewport.zoom <= MAP_CONFIG.minZoom}
          >
            <Minus size={20} />
          </button>
        </div>

        {/* Property Markers */}
        {filteredProperties.map((property) => {
          if (!property.location || 
              property.location.latitude === DEFAULT_COORDINATES.latitude && 
              property.location.longitude === DEFAULT_COORDINATES.longitude) {
            return null;
          }

          const isSelected = selectedProperty?.id === property.id;
          const color = PROPERTY_TYPE_COLORS[property.type] || PROPERTY_TYPE_COLORS.Other;

          return (
            <React.Fragment key={property.id}>
              <Marker
                longitude={property.location.longitude}
                latitude={property.location.latitude}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleMarkerClick(property);
                }}
              >
                <div 
                  className={`cursor-pointer transition-transform ${
                    isSelected ? 'scale-125' : 'hover:scale-110'
                  }`}
                >
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </Marker>

              {/* Radius Circle */}
              {property.radius && property.radius > 0 && (
                <Source type="geojson" data={getCircleGeoJSON(property)}>
                  <Layer
                    id={`radius-circle-${property.id}`}
                    type="fill"
                    paint={{
                      'fill-color': color,
                      'fill-opacity': isSelected ? 0.2 : 0.1
                    }}
                  />
                  <Layer
                    id={`radius-circle-border-${property.id}`}
                    type="line"
                    paint={{
                      'line-color': color,
                      'line-width': isSelected ? 2 : 1,
                      'line-opacity': isSelected ? 0.8 : 0.5
                    }}
                  />
                </Source>
              )}
            </React.Fragment>
          );
        })}
      </Map>
    </div>
  );
};

export default MapView;