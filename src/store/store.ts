import { create } from 'zustand';
import {
  Property,
  Person,
  Connection,
  Link,
  MapViewport,
  FilterState,
  PersonFilterState,
  SortOption,
} from '../types';
import { propertyAPI, personAPI, connectionAPI, linkAPI } from '../utils/api';
import {
  DEFAULT_COORDINATES,
  MAP_CONFIG,
  ERROR_MESSAGES,
  PROPERTY_TYPES,
  PERSON_ROLES,
} from '../constants';

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

// Helper function to validate bounds object
const isValidBounds = (bounds: any): boolean => {
  if (!bounds || typeof bounds !== 'object') {
    return false;
  }

  const { north, south, east, west } = bounds;

  return (
    typeof north === 'number' &&
    !isNaN(north) &&
    typeof south === 'number' &&
    !isNaN(south) &&
    typeof east === 'number' &&
    !isNaN(east) &&
    typeof west === 'number' &&
    !isNaN(west) &&
    north > south &&
    east > west
  );
};

// Helper function to convert MapLibre bounds to plain object
const convertBoundsToPlainObject = (bounds: any) => {
  if (!bounds) {
    console.log('No bounds provided');
    return null;
  }

  try {
    // Handle MapLibre LngLatBounds object
    if (typeof bounds.getNorth === 'function') {
      const plainBounds = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
      console.log('Converted LngLatBounds to plain object:', plainBounds);
      return isValidBounds(plainBounds) ? plainBounds : null;
    }

    // Handle plain object bounds
    if (isValidBounds(bounds)) {
      console.log('Using valid plain object bounds:', bounds);
      return bounds;
    }

    console.log('Invalid bounds detected, not setting bounds in viewport');
    return null;
  } catch (error) {
    console.error('Error converting bounds:', error);
    return null;
  }
};

// Helper function to ensure valid viewport
const ensureValidViewport = (viewport: Partial<MapViewport>): MapViewport => {
  const safeViewport: MapViewport = {
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    zoom: MAP_CONFIG.defaultZoom,
  };

  if (
    viewport.latitude &&
    typeof viewport.latitude === 'number' &&
    !isNaN(viewport.latitude)
  ) {
    safeViewport.latitude = viewport.latitude;
  }

  if (
    viewport.longitude &&
    typeof viewport.longitude === 'number' &&
    !isNaN(viewport.longitude)
  ) {
    safeViewport.longitude = viewport.longitude;
  }

  if (
    viewport.zoom &&
    typeof viewport.zoom === 'number' &&
    !isNaN(viewport.zoom)
  ) {
    safeViewport.zoom = viewport.zoom;
  }

  // Only include bounds if they are valid - use the converter
  const validBounds = convertBoundsToPlainObject(viewport.bounds);
  if (validBounds) {
    safeViewport.bounds = validBounds;
  }

  return safeViewport;
};

// Helper function to sort properties
const sortProperties = (
  properties: Property[],
  sortBy: SortOption
): Property[] => {
  const sorted = [...properties];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price_min - b.price_min);
    case 'price_desc':
      return sorted.sort((a, b) => b.price_min - a.price_min);
    case 'size_asc':
      return sorted.sort((a, b) => a.size_min - b.size_min);
    case 'size_desc':
      return sorted.sort((a, b) => b.size_min - a.size_min);
    case 'rating_desc':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'newest':
      return sorted.sort((a, b) => b.id - a.id); // Assuming higher ID means newer
    case 'oldest':
      return sorted.sort((a, b) => a.id - b.id);
    default:
      return sorted;
  }
};

// Enhanced search function for properties - searches ALL fields comprehensively
const searchInProperty = (
  property: Property,
  searchQuery: string,
  connections: Connection[],
  persons: Person[]
): boolean => {
  if (!searchQuery || !searchQuery.trim()) return true;

  const searchLower = searchQuery.toLowerCase().trim();

  // Search in ALL property fields including numeric values and formatted values
  const propertyFields = [
    // Text fields
    property.area,
    property.zone,
    property.description,
    property.note,
    property.type,

    // Numeric fields converted to strings
    property.price_min?.toString(),
    property.price_max?.toString(),
    property.size_min?.toString(),
    property.size_max?.toString(),
    property.rating?.toString(),
    property.radius?.toString(),
    property.id?.toString(),

    // Formatted values for better search experience
    Math.round(property.size_min)?.toString(), // Size in sq yards (min)
    Math.round(property.size_max)?.toString(), // Size in sq yards (max)

    // Price in different formats
    property.price_min?.toFixed(1), // Price in lakhs
    property.price_max?.toFixed(1),

    // Location coordinates as searchable text
    property.location?.latitude?.toString(),
    property.location?.longitude?.toString(),
    property.location?.latitude?.toFixed(6),
    property.location?.longitude?.toFixed(6),

    // Radius in different formats
    property.radius && property.radius >= 1000
      ? `${(property.radius / 1000).toFixed(1)}km`
      : `${property.radius}m`,

    // All tags
    ...property.tags,

    // Join all tags as a single string for phrase searching
    property.tags.join(' '),

    // Created/updated dates if available
    property.created_on,
    property.updated_on,
  ].filter(Boolean);

  // Check if any property field matches
  const propertyMatch = propertyFields.some(
    (field) => field && field.toString().toLowerCase().includes(searchLower)
  );

  if (propertyMatch) return true;

  // Search in connected persons and connection details
  const propertyConnections = connections.filter(
    (conn) => conn.property_id === property.id
  );

  for (const connection of propertyConnections) {
    // Check connection fields
    const connectionFields = [
      connection.remark,
      connection.role,
      connection.id?.toString(),
    ].filter(Boolean);

    const connectionMatch = connectionFields.some(
      (field) => field && field.toString().toLowerCase().includes(searchLower)
    );

    if (connectionMatch) return true;

    // Find connected person and search in ALL their details
    const connectedPerson = persons.find(
      (person) => person.id === connection.person_id
    );
    if (connectedPerson) {
      const personFields = [
        connectedPerson.name,
        connectedPerson.phone,
        connectedPerson.alternative_contact,
        connectedPerson.about,
        connectedPerson.role,
        connectedPerson.id?.toString(),
      ].filter(Boolean);

      const personMatch = personFields.some(
        (field) => field && field.toString().toLowerCase().includes(searchLower)
      );

      if (personMatch) return true;
    }
  }

  return false;
};

// Enhanced search function for persons - searches ALL fields comprehensively
const searchInPerson = (
  person: Person,
  searchQuery: string,
  connections: Connection[],
  properties: Property[]
): boolean => {
  if (!searchQuery || !searchQuery.trim()) return true;

  const searchLower = searchQuery.toLowerCase().trim();

  // Search in ALL person fields
  const personFields = [
    person.name,
    person.phone,
    person.alternative_contact,
    person.about,
    person.role,
    person.id?.toString(),
  ].filter(Boolean);

  // Check if any person field matches
  const personMatch = personFields.some(
    (field) => field && field.toString().toLowerCase().includes(searchLower)
  );

  if (personMatch) return true;

  // Search in connected properties and connection details
  const personConnections = connections.filter(
    (conn) => conn.person_id === person.id
  );

  for (const connection of personConnections) {
    // Check connection fields
    const connectionFields = [
      connection.remark,
      connection.role,
      connection.id?.toString(),
    ].filter(Boolean);

    const connectionMatch = connectionFields.some(
      (field) => field && field.toString().toLowerCase().includes(searchLower)
    );

    if (connectionMatch) return true;

    // Find connected property and search in ALL their details
    const connectedProperty = properties.find(
      (property) => property.id === connection.property_id
    );
    if (connectedProperty) {
      const propertyFields = [
        // Text fields
        connectedProperty.area,
        connectedProperty.zone,
        connectedProperty.description,
        connectedProperty.note,
        connectedProperty.type,

        // Numeric fields
        connectedProperty.price_min?.toString(),
        connectedProperty.price_max?.toString(),
        connectedProperty.size_min?.toString(),
        connectedProperty.size_max?.toString(),
        connectedProperty.rating?.toString(),
        connectedProperty.radius?.toString(),
        connectedProperty.id?.toString(),

        // Formatted values
        Math.round(connectedProperty.size_min)?.toString(),
        Math.round(connectedProperty.size_max)?.toString(),
        connectedProperty.price_min?.toFixed(1),
        connectedProperty.price_max?.toFixed(1),

        // Location
        connectedProperty.location?.latitude?.toString(),
        connectedProperty.location?.longitude?.toString(),

        // Tags
        ...connectedProperty.tags,
        connectedProperty.tags.join(' '),
      ].filter(Boolean);

      const propertyMatch = propertyFields.some(
        (field) => field && field.toString().toLowerCase().includes(searchLower)
      );

      if (propertyMatch) return true;
    }
  }

  return false;
};

interface StoreState {
  properties: Property[];
  filteredProperties: Property[];
  persons: Person[];
  filteredPersons: Person[];
  connections: Connection[];
  links: Link[];
  selectedProperty: Property | null;
  selectedPerson: Person | null;
  mapViewport: MapViewport;
  filters: FilterState;
  personFilters: PersonFilterState;
  isSidebarOpen: boolean;
  isFilterDrawerOpen: boolean;
  isPropertyDetailOpen: boolean;
  isMobileView: boolean;
  showPropertyForm: boolean;
  showPersonForm: boolean;
  editingProperty: Property | null;
  editingPerson: Person | null;
  activeTab: 'properties' | 'persons';
  isLiveView: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Property-specific data caches
  propertyConnections: Record<number, Connection[]>;
  propertyLinks: Record<number, Link[]>;
  propertyPersons: Record<number, Person[]>;
  
  // Data loading states - track what's been loaded
  dataLoaded: {
    properties: boolean;
    persons: boolean;
    connections: boolean;
    links: boolean;
  };
  
  // Granular loading states
  loadingStates: {
    properties: boolean;
    persons: boolean;
    connections: boolean;
    links: boolean;
    creating: boolean;
    updating: boolean;
    deleting: boolean;
    propertyDetails: boolean;
  };

  // Actions
  setProperties: (properties: Property[]) => void;
  setPersons: (persons: Person[]) => void;
  setConnections: (connections: Connection[]) => void;
  setLinks: (links: Link[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setSelectedPerson: (person: Person | null) => void;
  setMapViewport: (viewport: Partial<MapViewport>) => void;
  updateFilters: (partialFilters: Partial<FilterState>) => void;
  updatePersonFilters: (partialFilters: Partial<PersonFilterState>) => void;
  resetFilters: () => void;
  resetPersonFilters: () => void;
  toggleSidebar: () => void;
  toggleFilterDrawer: () => void;
  togglePropertyDetail: (force?: boolean) => void;
  setMobileView: (isMobile: boolean) => void;
  togglePropertyForm: (property?: Property | null) => void;
  togglePersonForm: (person?: Person | null) => void;
  setActiveTab: (tab: 'properties' | 'persons') => void;
  setFilteredProperties: (properties: Property[]) => void;
  setIsLiveView: (isLive: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoadingState: (key: keyof StoreState['loadingStates'], loading: boolean) => void;

  // Optimized API Actions
  loadProperties: () => Promise<void>;
  loadPersons: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadLinks: () => Promise<void>;
  loadAllData: () => Promise<void>;
  loadPropertyDetails: (propertyId: number) => Promise<void>;
  createProperty: (property: Omit<Property, 'id'>) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (id: number) => Promise<void>;
  createPerson: (person: Omit<Person, 'id'>) => Promise<void>;
  updatePerson: (person: Person) => Promise<void>;
  deletePerson: (id: number) => Promise<void>;
  createConnection: (connection: Omit<Connection, 'id'>) => Promise<void>;
  deleteConnection: (id: number) => Promise<void>;
  createLink: (link: Omit<Link, 'id'>) => Promise<void>;
  updateLink: (link: Link) => Promise<void>;
  deleteLink: (id: number) => Promise<void>;

  // Derived actions
  filterProperties: () => void;
  filterPersons: () => void;
  getPropertyPersons: (propertyId: number) => Person[];
  getPropertyLinks: (propertyId: number) => Link[];
  focusMapOnProperty: (property: Property) => void;
  getAllTags: () => string[];
  updatePropertyPersonsCache: () => void;
}

// Load initial filters from localStorage
const loadFiltersFromStorage = (): FilterState => {
  try {
    const saved = localStorage.getItem('propertyFilters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        priceRange: parsed.priceRange || [0, 1000000000000],
        sizeRange: parsed.sizeRange || [0, 10000000],
        propertyTypes: parsed.propertyTypes || [],
        searchQuery: parsed.searchQuery || '',
        tags: parsed.tags || [],
        excludedTags: parsed.excludedTags || [],
        rating: parsed.rating,
        sortBy: parsed.sortBy || 'newest',
        hasLocation: parsed.hasLocation || null,
        radiusRange: parsed.radiusRange || [0, 50000],
      };
    }
  } catch (error) {
    console.error('Error loading filters from storage:', error);
  }
  
  return {
    priceRange: [0, 1000000000000],
    sizeRange: [0, 10000000],
    propertyTypes: [],
    searchQuery: '',
    tags: [],
    excludedTags: [],
    sortBy: 'newest',
    hasLocation: null,
    radiusRange: [0, 50000],
  };
};

// Load initial person filters from localStorage
const loadPersonFiltersFromStorage = (): PersonFilterState => {
  try {
    const saved = localStorage.getItem('personFilters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        searchQuery: parsed.searchQuery || '',
        roles: parsed.roles || [],
        hasProperties: parsed.hasProperties,
      };
    }
  } catch (error) {
    console.error('Error loading person filters from storage:', error);
  }
  
  return {
    searchQuery: '',
    roles: [],
    hasProperties: null,
  };
};

// Load initial map viewport from localStorage
const loadMapViewportFromStorage = (): MapViewport => {
  try {
    const saved = localStorage.getItem('mapViewport');
    if (saved) {
      const parsed = JSON.parse(saved);
      return ensureValidViewport(parsed);
    }
  } catch (error) {
    console.error('Error loading map viewport from storage:', error);
  }
  
  return ensureValidViewport({
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    zoom: MAP_CONFIG.defaultZoom,
  });
};

const initialFilters = loadFiltersFromStorage();
const initialPersonFilters = loadPersonFiltersFromStorage();
const initialMapViewport = loadMapViewportFromStorage();

const initialLoadingStates = {
  properties: false,
  persons: false,
  connections: false,
  links: false,
  creating: false,
  updating: false,
  deleting: false,
  propertyDetails: false,
};

const initialDataLoaded = {
  properties: false,
  persons: false,
  connections: false,
  links: false,
};

export const useStore = create<StoreState>((set, get) => ({
  properties: [],
  filteredProperties: [],
  persons: [],
  filteredPersons: [],
  connections: [],
  links: [],
  selectedProperty: null,
  selectedPerson: null,
  mapViewport: initialMapViewport,
  filters: initialFilters,
  personFilters: initialPersonFilters,
  isSidebarOpen: true,
  isFilterDrawerOpen: false,
  isPropertyDetailOpen: false,
  isMobileView: false,
  showPropertyForm: false,
  showPersonForm: false,
  editingProperty: null,
  editingPerson: null,
  activeTab: 'properties',
  isLiveView: false,
  isLoading: false,
  error: null,
  dataLoaded: initialDataLoaded,
  loadingStates: initialLoadingStates,
  propertyConnections: {},
  propertyLinks: {},
  propertyPersons: {},

  // Basic Actions
  setProperties: (properties) => {
    console.log('Setting properties:', properties.length);

    // Ensure all properties have valid locations
    const validProperties = properties.map((property) => ({
      ...property,
      location: ensureValidLocation(property.location),
    }));

    set({ 
      properties: validProperties,
      dataLoaded: { ...get().dataLoaded, properties: true }
    });
    get().filterProperties();
  },

  setPersons: (persons) => {
    console.log('Setting persons:', persons.length);
    set({ 
      persons,
      dataLoaded: { ...get().dataLoaded, persons: true }
    });
    get().filterPersons();
  },

  setConnections: (connections) => {
    console.log('Setting connections:', connections.length);
    set({ 
      connections,
      dataLoaded: { ...get().dataLoaded, connections: true }
    });
    
    // Update property-specific caches when connections are loaded
    const { propertyConnections } = get();
    const newPropertyConnections = { ...propertyConnections };
    
    connections.forEach(connection => {
      const propertyId = connection.property_id;
      if (!newPropertyConnections[propertyId]) {
        newPropertyConnections[propertyId] = [];
      }
      // Only add if not already present
      if (!newPropertyConnections[propertyId].find(c => c.id === connection.id)) {
        newPropertyConnections[propertyId].push(connection);
      }
    });
    
    set({ propertyConnections: newPropertyConnections });
  },

  setLinks: (links) => {
    console.log('Setting links:', links.length);
    set({ 
      links,
      dataLoaded: { ...get().dataLoaded, links: true }
    });
    
    // Update property-specific caches when links are loaded
    const { propertyLinks } = get();
    const newPropertyLinks = { ...propertyLinks };
    
    links.forEach(link => {
      const propertyId = link.property_id;
      if (!newPropertyLinks[propertyId]) {
        newPropertyLinks[propertyId] = [];
      }
      // Only add if not already present
      if (!newPropertyLinks[propertyId].find(l => l.id === link.id)) {
        newPropertyLinks[propertyId].push(link);
      }
    });
    
    set({ propertyLinks: newPropertyLinks });
  },

  setSelectedProperty: (property) => {
    if (property) {
      // Ensure the selected property has a valid location
      const validProperty = {
        ...property,
        location: ensureValidLocation(property.location),
      };
      set({ selectedProperty: validProperty });
      get().focusMapOnProperty(validProperty);
      
      // Load property details when a property is selected
      get().loadPropertyDetails(validProperty.id);
    } else {
      set({ selectedProperty: null });
    }
  },

  setSelectedPerson: (person) => set({ selectedPerson: person }),

  setMapViewport: (viewport) => {
    const currentViewport = get().mapViewport;
    const newViewport = ensureValidViewport({
      ...currentViewport,
      ...viewport,
    });

    console.log('Setting map viewport:', newViewport);
    set({ mapViewport: newViewport });

    // Save to localStorage
    try {
      localStorage.setItem('mapViewport', JSON.stringify(newViewport));
    } catch (error) {
      console.error('Error saving map viewport to storage:', error);
    }

    // Only filter by viewport if live view is enabled
    if (get().isLiveView) {
      get().filterProperties();
    }
  },

  updateFilters: (partialFilters) => {
    console.log('Updating filters:', partialFilters);
    const newFilters = { ...get().filters, ...partialFilters };
    set({ filters: newFilters });
    
    // Save to localStorage
    try {
      localStorage.setItem('propertyFilters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Error saving filters to storage:', error);
    }
    
    get().filterProperties();
  },

  updatePersonFilters: (partialFilters) => {
    const newPersonFilters = { ...get().personFilters, ...partialFilters };
    set({ personFilters: newPersonFilters });
    
    // Save to localStorage
    try {
      localStorage.setItem('personFilters', JSON.stringify(newPersonFilters));
    } catch (error) {
      console.error('Error saving person filters to storage:', error);
    }
    
    get().filterPersons();
  },

  resetFilters: () => {
    console.log('Resetting filters');
    const defaultFilters = {
      priceRange: [0, 1000000000000],
      sizeRange: [0, 10000000],
      propertyTypes: [],
      searchQuery: '',
      tags: [],
      excludedTags: [],
      sortBy: 'newest' as SortOption,
      hasLocation: null,
      radiusRange: [0, 50000],
    };
    set({ filters: defaultFilters });
    
    // Save to localStorage
    try {
      localStorage.setItem('propertyFilters', JSON.stringify(defaultFilters));
    } catch (error) {
      console.error('Error saving reset filters to storage:', error);
    }
    
    get().filterProperties();
  },

  resetPersonFilters: () => {
    const defaultPersonFilters = {
      searchQuery: '',
      roles: [],
      hasProperties: null,
    };
    set({ personFilters: defaultPersonFilters });
    
    // Save to localStorage
    try {
      localStorage.setItem('personFilters', JSON.stringify(defaultPersonFilters));
    } catch (error) {
      console.error('Error saving reset person filters to storage:', error);
    }
    
    get().filterPersons();
  },

  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
  toggleFilterDrawer: () =>
    set({ isFilterDrawerOpen: !get().isFilterDrawerOpen }),
  togglePropertyDetail: (force?: boolean) =>
    set({
      isPropertyDetailOpen:
        force !== undefined ? force : !get().isPropertyDetailOpen,
    }),
  setMobileView: (isMobile) => set({ isMobileView: isMobile }),
  togglePropertyForm: (property?: Property | null) => {
    // Ensure property has valid location if provided
    const validProperty = property
      ? {
          ...property,
          location: ensureValidLocation(property.location),
        }
      : null;

    set({
      showPropertyForm: !get().showPropertyForm,
      editingProperty: validProperty,
    });
  },
  togglePersonForm: (person?: Person | null) =>
    set({
      showPersonForm: !get().showPersonForm,
      editingPerson: person || null,
    }),
  setActiveTab: (tab) => {
    console.log('Setting active tab:', tab);
    set({ activeTab: tab });
    
    // Load appropriate data based on tab
    if (tab === 'properties') {
      if (!get().dataLoaded.properties) {
        get().loadProperties();
      }
    } else if (tab === 'persons') {
      // Load all necessary data for persons tab
      get().loadAllData();
    }
  },
  setFilteredProperties: (properties) => {
    // Ensure all filtered properties have valid locations
    const validProperties = properties.map((property) => ({
      ...property,
      location: ensureValidLocation(property.location),
    }));
    set({ filteredProperties: validProperties });
  },
  setIsLiveView: (isLive) => {
    set({ isLiveView: isLive });
    get().filterProperties();
  },
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLoadingState: (key, loading) => {
    set({
      loadingStates: {
        ...get().loadingStates,
        [key]: loading,
      },
    });
  },

  // Optimized API Actions
  loadProperties: async () => {
    const { dataLoaded } = get();
    if (dataLoaded.properties) {
      console.log('Properties already loaded');
      return;
    }

    try {
      console.log('Loading properties...');
      get().setLoadingState('properties', true);
      const properties = await propertyAPI.getAll();
      console.log('Loaded properties:', properties.length);

      // Ensure all properties have valid locations
      const validProperties = properties.map((property) => ({
        ...property,
        location: ensureValidLocation(property.location),
      }));

      set({ 
        properties: validProperties, 
        error: null,
        dataLoaded: { ...get().dataLoaded, properties: true }
      });
      get().filterProperties();

      // If we have properties and no current viewport bounds, center on first property with valid location
      if (validProperties.length > 0 && !get().mapViewport.bounds) {
        const firstValidProperty = validProperties.find(
          (p) =>
            p.location.latitude !== DEFAULT_COORDINATES.latitude ||
            p.location.longitude !== DEFAULT_COORDINATES.longitude
        );

        if (firstValidProperty) {
          get().setMapViewport({
            latitude: firstValidProperty.location.latitude,
            longitude: firstValidProperty.location.longitude,
            zoom: MAP_CONFIG.focusZoom,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      set({
        error: ERROR_MESSAGES.loadProperties + ': ' + (error as Error).message,
      });
    } finally {
      get().setLoadingState('properties', false);
    }
  },

  loadPersons: async () => {
    const { dataLoaded } = get();
    if (dataLoaded.persons) {
      console.log('Persons already loaded');
      return;
    }

    try {
      console.log('Loading persons...');
      get().setLoadingState('persons', true);
      const persons = await personAPI.getAll();
      console.log('Loaded persons:', persons.length);

      set({ 
        persons, 
        error: null,
        dataLoaded: { ...get().dataLoaded, persons: true }
      });
      get().filterPersons();
    } catch (error) {
      console.error('Failed to load persons:', error);
      set({
        error: ERROR_MESSAGES.loadPersons + ': ' + (error as Error).message,
      });
    } finally {
      get().setLoadingState('persons', false);
    }
  },

  loadConnections: async () => {
    const { dataLoaded } = get();
    if (dataLoaded.connections) {
      console.log('Connections already loaded');
      return;
    }

    try {
      console.log('Loading connections...');
      get().setLoadingState('connections', true);
      const connections = await connectionAPI.getAll();
      console.log('Loaded connections:', connections.length);

      set({ 
        connections, 
        error: null,
        dataLoaded: { ...get().dataLoaded, connections: true }
      });
      
      // Update property-specific caches
      const propertyConnections: Record<number, Connection[]> = {};
      connections.forEach(connection => {
        const propertyId = connection.property_id;
        if (!propertyConnections[propertyId]) {
          propertyConnections[propertyId] = [];
        }
        propertyConnections[propertyId].push(connection);
      });
      
      set({ propertyConnections });
    } catch (error) {
      console.error('Failed to load connections:', error);
      set({
        error: ERROR_MESSAGES.loadConnections + ': ' + (error as Error).message,
      });
    } finally {
      get().setLoadingState('connections', false);
    }
  },

  loadLinks: async () => {
    const { dataLoaded } = get();
    if (dataLoaded.links) {
      console.log('Links already loaded');
      return;
    }

    try {
      console.log('Loading links...');
      get().setLoadingState('links', true);
      const links = await linkAPI.getAll();
      console.log('Loaded links:', links.length);

      set({ 
        links, 
        error: null,
        dataLoaded: { ...get().dataLoaded, links: true }
      });
      
      // Update property-specific caches
      const propertyLinks: Record<number, Link[]> = {};
      links.forEach(link => {
        const propertyId = link.property_id;
        if (!propertyLinks[propertyId]) {
          propertyLinks[propertyId] = [];
        }
        propertyLinks[propertyId].push(link);
      });
      
      set({ propertyLinks });
    } catch (error) {
      console.error('Failed to load links:', error);
      set({
        error: ERROR_MESSAGES.loadLinks + ': ' + (error as Error).message,
      });
    } finally {
      get().setLoadingState('links', false);
    }
  },

  loadAllData: async () => {
    console.log('Loading all data...');
    const { dataLoaded } = get();
    
    const promises = [];
    
    if (!dataLoaded.properties) {
      promises.push(get().loadProperties());
    }
    if (!dataLoaded.persons) {
      promises.push(get().loadPersons());
    }
    if (!dataLoaded.connections) {
      promises.push(get().loadConnections());
    }
    if (!dataLoaded.links) {
      promises.push(get().loadLinks());
    }
    
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        console.log('All data loaded successfully');
        
        // Update property-specific caches with persons
        get().updatePropertyPersonsCache();
      } catch (error) {
        console.error('Failed to load all data:', error);
      }
    } else {
      console.log('All data already loaded');
      // Still update caches in case they're missing
      get().updatePropertyPersonsCache();
    }
  },

  // Helper method to update property persons cache
  updatePropertyPersonsCache: () => {
    const { connections, persons } = get();
    const propertyPersons: Record<number, Person[]> = {};
    
    connections.forEach(connection => {
      const propertyId = connection.property_id;
      const person = persons.find(p => p.id === connection.person_id);
      
      if (person) {
        if (!propertyPersons[propertyId]) {
          propertyPersons[propertyId] = [];
        }
        // Only add if not already present
        if (!propertyPersons[propertyId].find(p => p.id === person.id)) {
          propertyPersons[propertyId].push(person);
        }
      }
    });
    
    set({ propertyPersons });
  },

  // Load property-specific data (connections, links, persons)
  loadPropertyDetails: async (propertyId: number) => {
    console.log(`Loading details for property ${propertyId}...`);
    
    // Load all data if not already loaded
    await get().loadAllData();
    
    // Property details are now available through the global caches
    console.log(`Property ${propertyId} details loaded from cache`);
  },

  createProperty: async (propertyData) => {
    try {
      get().setLoadingState('creating', true);
      console.log('Creating property:', propertyData);

      // Ensure location is valid before creating
      const validPropertyData = {
        ...propertyData,
        location: ensureValidLocation(propertyData.location),
        rating: propertyData.rating || 0, // Default to 0 if not set
      };

      const result = await propertyAPI.create(validPropertyData);
      console.log('Property created:', result);
      if (result.success) {
        // Reload properties to get the new one
        set({ dataLoaded: { ...get().dataLoaded, properties: false } });
        await get().loadProperties();
      }
    } catch (error) {
      console.error('Failed to create property:', error);
      set({
        error: ERROR_MESSAGES.createProperty + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('creating', false);
    }
  },

  updateProperty: async (property) => {
    try {
      get().setLoadingState('updating', true);
      console.log('Updating property:', property);

      // Ensure location is valid before updating
      const validProperty = {
        ...property,
        location: ensureValidLocation(property.location),
        rating: property.rating || 0, // Default to 0 if not set
      };

      const result = await propertyAPI.update(validProperty);
      console.log('Property updated:', result);
      if (result.success) {
        // Update the property in the local state
        const updatedProperties = get().properties.map(p => 
          p.id === property.id ? validProperty : p
        );
        set({ properties: updatedProperties });
        get().filterProperties();

        // If this was the selected property, update the selection
        if (get().selectedProperty?.id === property.id) {
          set({ selectedProperty: validProperty });
        }
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      set({
        error: ERROR_MESSAGES.updateProperty + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('updating', false);
    }
  },

  deleteProperty: async (id) => {
    try {
      get().setLoadingState('deleting', true);
      console.log('Deleting property:', id);

      const result = await propertyAPI.delete(id);
      console.log('Property deleted:', result);

      if (result.success) {
        // Remove from local state
        const updatedProperties = get().properties.filter(p => p.id !== id);
        set({ properties: updatedProperties });
        get().filterProperties();

        // Clear property-specific caches
        const { propertyConnections, propertyLinks, propertyPersons } = get();
        const newPropertyConnections = { ...propertyConnections };
        const newPropertyLinks = { ...propertyLinks };
        const newPropertyPersons = { ...propertyPersons };
        delete newPropertyConnections[id];
        delete newPropertyLinks[id];
        delete newPropertyPersons[id];
        
        set({
          propertyConnections: newPropertyConnections,
          propertyLinks: newPropertyLinks,
          propertyPersons: newPropertyPersons
        });

        // Clear selected property if it was deleted
        if (get().selectedProperty?.id === id) {
          set({ selectedProperty: null, isPropertyDetailOpen: false });
        }
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      set({
        error: ERROR_MESSAGES.deleteProperty + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('deleting', false);
    }
  },

  createPerson: async (personData) => {
    try {
      get().setLoadingState('creating', true);
      console.log('Creating person:', personData);
      const result = await personAPI.create(personData);
      console.log('Person created:', result);
      if (result.success) {
        // Add to local state
        const newPerson = { ...personData, id: result.id };
        set({ persons: [...get().persons, newPerson] });
        get().filterPersons();
      }
    } catch (error) {
      console.error('Failed to create person:', error);
      set({
        error: ERROR_MESSAGES.createPerson + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('creating', false);
    }
  },

  updatePerson: async (person) => {
    try {
      get().setLoadingState('updating', true);
      console.log('Updating person:', person);
      const result = await personAPI.update(person);
      console.log('Person updated:', result);
      if (result.success) {
        // Update in local state
        const updatedPersons = get().persons.map(p => 
          p.id === person.id ? person : p
        );
        set({ persons: updatedPersons });
        get().filterPersons();

        // Update property-specific caches
        get().updatePropertyPersonsCache();
      }
    } catch (error) {
      console.error('Failed to update person:', error);
      set({
        error: ERROR_MESSAGES.updatePerson + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('updating', false);
    }
  },

  deletePerson: async (id) => {
    try {
      get().setLoadingState('deleting', true);
      console.log('Deleting person:', id);

      const result = await personAPI.delete(id);
      console.log('Person deleted:', result);

      if (result.success) {
        // Remove from local state
        const updatedPersons = get().persons.filter(p => p.id !== id);
        set({ persons: updatedPersons });
        get().filterPersons();

        // Update property-specific caches
        get().updatePropertyPersonsCache();
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
      set({
        error: ERROR_MESSAGES.deletePerson + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('deleting', false);
    }
  },

  createConnection: async (connectionData) => {
    try {
      get().setLoadingState('creating', true);
      console.log('Creating connection:', connectionData);
      const result = await connectionAPI.create(connectionData);
      console.log('Connection created:', result);
      if (result.success) {
        const newConnection = { ...connectionData, id: result.id };
        
        // Update global connections
        set({ connections: [...get().connections, newConnection] });
        
        // Update property-specific cache
        const { propertyConnections } = get();
        const propertyId = connectionData.property_id;
        const currentConnections = propertyConnections[propertyId] || [];
        
        set({
          propertyConnections: {
            ...propertyConnections,
            [propertyId]: [...currentConnections, newConnection]
          }
        });

        // Update property persons cache
        get().updatePropertyPersonsCache();
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      set({
        error:
          ERROR_MESSAGES.createConnection + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('creating', false);
    }
  },

  deleteConnection: async (id) => {
    try {
      get().setLoadingState('deleting', true);
      console.log('Deleting connection:', id);
      
      // Find the connection to get property ID
      const connection = get().connections.find(c => c.id === id);
      
      const result = await connectionAPI.delete(id);
      console.log('Connection deleted:', result);
      
      if (result.success) {
        // Update global connections
        const updatedConnections = get().connections.filter(c => c.id !== id);
        set({ connections: updatedConnections });
        
        // Update property-specific cache
        if (connection) {
          const { propertyConnections } = get();
          const propertyId = connection.property_id;
          const updatedPropertyConnections = propertyConnections[propertyId]?.filter(conn => conn.id !== id) || [];
          
          set({
            propertyConnections: {
              ...propertyConnections,
              [propertyId]: updatedPropertyConnections
            }
          });
        }

        // Update property persons cache
        get().updatePropertyPersonsCache();
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
      set({
        error:
          ERROR_MESSAGES.deleteConnection + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('deleting', false);
    }
  },

  createLink: async (linkData) => {
    try {
      get().setLoadingState('creating', true);
      console.log('Creating link:', linkData);
      const result = await linkAPI.create(linkData);
      console.log('Link created:', result);
      if (result.success) {
        const newLink = { ...linkData, id: result.id };
        
        // Update global links
        set({ links: [...get().links, newLink] });
        
        // Update property-specific cache
        const { propertyLinks } = get();
        const propertyId = linkData.property_id;
        const currentLinks = propertyLinks[propertyId] || [];
        
        set({
          propertyLinks: {
            ...propertyLinks,
            [propertyId]: [...currentLinks, newLink]
          }
        });
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      set({
        error: ERROR_MESSAGES.createLink + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('creating', false);
    }
  },

  updateLink: async (link) => {
    try {
      get().setLoadingState('updating', true);
      console.log('Updating link:', link);
      const result = await linkAPI.update(link);
      console.log('Link updated:', result);
      if (result.success) {
        // Update global links
        const updatedLinks = get().links.map(l => l.id === link.id ? link : l);
        set({ links: updatedLinks });
        
        // Update property-specific cache
        const { propertyLinks } = get();
        const propertyId = link.property_id;
        const currentLinks = propertyLinks[propertyId] || [];
        const updatedPropertyLinks = currentLinks.map(l => l.id === link.id ? link : l);
        
        set({
          propertyLinks: {
            ...propertyLinks,
            [propertyId]: updatedPropertyLinks
          }
        });
      }
    } catch (error) {
      console.error('Failed to update link:', error);
      set({
        error: ERROR_MESSAGES.updateLink + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('updating', false);
    }
  },

  deleteLink: async (id) => {
    try {
      get().setLoadingState('deleting', true);
      console.log('Deleting link:', id);
      
      // Find the link to get property ID
      const link = get().links.find(l => l.id === id);

      const result = await linkAPI.delete(id);
      console.log('Link deleted:', result);
      
      if (result.success) {
        // Update global links
        const updatedLinks = get().links.filter(l => l.id !== id);
        set({ links: updatedLinks });
        
        // Update property-specific cache
        if (link) {
          const { propertyLinks } = get();
          const propertyId = link.property_id;
          const updatedPropertyLinks = propertyLinks[propertyId]?.filter(l => l.id !== id) || [];
          
          set({
            propertyLinks: {
              ...propertyLinks,
              [propertyId]: updatedPropertyLinks
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      set({
        error: ERROR_MESSAGES.deleteLink + ': ' + (error as Error).message,
      });
      throw error;
    } finally {
      get().setLoadingState('deleting', false);
    }
  },

  // Enhanced filtering with comprehensive search - SEARCHES ENTIRE DATASET FIRST
  filterProperties: () => {
    const {
      properties,
      filters,
      isLiveView,
      mapViewport,
      connections,
      persons,
    } = get();

    console.log('Filtering properties:', {
      totalProperties: properties.length,
      filters,
      isLiveView,
      hasMapBounds: !!mapViewport.bounds,
    });

    // Start with ALL properties, ensuring they have valid locations
    let filtered = properties.map((property) => ({
      ...property,
      location: ensureValidLocation(property.location),
    }));

    // CRITICAL: Apply search and other filters to the ENTIRE dataset FIRST
    filtered = filtered.filter((property) => {
      // Enhanced comprehensive search (only if query is provided) - SEARCHES ALL FIELDS
      if (filters.searchQuery && filters.searchQuery.trim()) {
        if (
          !searchInProperty(property, filters.searchQuery, connections, persons)
        ) {
          return false;
        }
      }

      // Filter by price range (only if not default range)
      if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000000000) {
        if (
          property.price_min > filters.priceRange[1] ||
          property.price_max < filters.priceRange[0]
        ) {
          return false;
        }
      }

      // Filter by size range (only if not default range)
      if (filters.sizeRange[0] > 0 || filters.sizeRange[1] < 10000) {
        if (
          property.size_min > filters.sizeRange[1] ||
          property.size_max < filters.sizeRange[0]
        ) {
          return false;
        }
      }

      // Filter by property types (only if types are selected)
      if (filters.propertyTypes.length > 0) {
        if (!property.type || !filters.propertyTypes.includes(property.type)) {
          return false;
        }
      }

      // Filter by rating (only if rating is specified)
      if (filters.rating !== undefined) {
        if (!property.rating || property.rating < filters.rating) {
          return false;
        }
      }

      // Filter by included tags (only if tags are selected)
      if (filters.tags.length > 0) {
        if (!filters.tags.some((tag) => property.tags.includes(tag))) {
          return false;
        }
      }

      // Filter by excluded tags (only if excluded tags are selected)
      if (filters.excludedTags.length > 0) {
        if (filters.excludedTags.some((tag) => property.tags.includes(tag))) {
          return false;
        }
      }

      // Filter by location status
      if (filters.hasLocation !== null) {
        const hasValidLocation = 
          property.location.latitude !== DEFAULT_COORDINATES.latitude ||
          property.location.longitude !== DEFAULT_COORDINATES.longitude;
        
        if (filters.hasLocation !== hasValidLocation) {
          return false;
        }
      }

      // Filter by radius range
      if (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000) {
        const radius = property.radius || 0;
        if (radius < filters.radiusRange[0] || radius > filters.radiusRange[1]) {
          return false;
        }
      }

      return true;
    });

    console.log(
      'After search and filters:',
      filtered.length,
      'out of',
      properties.length
    );

    // THEN apply viewport filter if live view is enabled (after search/filters)
    if (isLiveView && mapViewport.bounds && isValidBounds(mapViewport.bounds)) {
      const { north, south, east, west } = mapViewport.bounds;
      filtered = filtered.filter((property) => {
        const { latitude, longitude } = property.location;
        return (
          latitude <= north &&
          latitude >= south &&
          longitude <= east &&
          longitude >= west
        );
      });
      console.log('After viewport filter:', filtered.length);
    }

    // Apply sorting to the final filtered results
    const sorted = sortProperties(filtered, filters.sortBy);

    console.log(
      'Final filtered and sorted properties:',
      sorted.length,
      'out of',
      properties.length
    );
    set({ filteredProperties: sorted });
  },

  // Enhanced filtering for persons - SEARCHES ENTIRE DATASET FIRST
  filterPersons: () => {
    const { persons, personFilters, connections, properties } = get();

    console.log('Filtering persons:', {
      totalPersons: persons.length,
      personFilters,
    });

    // Start with ALL persons and apply filters to ENTIRE dataset
    const filtered = persons.filter((person) => {
      // Enhanced comprehensive search (only if query is provided) - SEARCHES ALL FIELDS
      if (personFilters.searchQuery && personFilters.searchQuery.trim()) {
        if (
          !searchInPerson(
            person,
            personFilters.searchQuery,
            connections,
            properties
          )
        ) {
          return false;
        }
      }

      // Filter by roles
      if (
        personFilters.roles.length > 0 &&
        !personFilters.roles.includes(person.role || '')
      ) {
        return false;
      }

      // Filter by property connection
      if (personFilters.hasProperties !== null) {
        const hasConnections = connections.some(
          (conn) => conn.person_id === person.id
        );
        if (personFilters.hasProperties !== hasConnections) {
          return false;
        }
      }

      return true;
    });

    console.log(
      'Final filtered persons:',
      filtered.length,
      'out of',
      persons.length
    );
    set({ filteredPersons: filtered });
  },

  getPropertyPersons: (propertyId) => {
    const { propertyPersons } = get();
    return propertyPersons[propertyId] || [];
  },

  getPropertyLinks: (propertyId) => {
    const { propertyLinks } = get();
    return propertyLinks[propertyId] || [];
  },

  focusMapOnProperty: (property) => {
    const validLocation = ensureValidLocation(property.location);
    get().setMapViewport({
      latitude: validLocation.latitude,
      longitude: validLocation.longitude,
      zoom: MAP_CONFIG.detailZoom,
    });
  },

  getAllTags: () => {
    const { properties } = get();
    const allTags = new Set<string>();

    properties.forEach((property) => {
      property.tags.forEach((tag) => {
        if (tag.trim()) {
          allTags.add(tag.trim());
        }
      });
    });

    return Array.from(allTags).sort();
  },
}));