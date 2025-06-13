import { create } from 'zustand';
import { Property, Person, Connection, Link, FilterState, PersonFilterState, MapViewport, SortOption } from '../types';
import { propertyAPI, personAPI, connectionAPI, linkAPI } from '../utils/api';
import { DEFAULT_COORDINATES, PRICE_RANGES, SIZE_RANGES } from '../constants';

// Helper function to ensure valid location
const ensureValidLocation = (location: any) => {
  if (!location || 
      typeof location.latitude !== 'number' || 
      typeof location.longitude !== 'number' ||
      isNaN(location.latitude) || 
      isNaN(location.longitude)) {
    return DEFAULT_COORDINATES;
  }
  return location;
};

interface LoadingStates {
  properties: boolean;
  persons: boolean;
  connections: boolean;
  links: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

interface Store {
  // Data
  properties: Property[];
  persons: Person[];
  connections: Connection[];
  links: Link[];
  
  // Filtered data
  filteredProperties: Property[];
  filteredPersons: Person[];
  
  // UI State
  selectedProperty: Property | null;
  isPropertyDetailOpen: boolean;
  isSidebarOpen: boolean;
  isMobileView: boolean;
  isFilterDrawerOpen: boolean;
  showPropertyForm: boolean;
  showPersonForm: boolean;
  editingProperty: Property | null;
  editingPerson: Person | null;
  activeTab: 'properties' | 'persons';
  isLiveView: boolean;
  
  // Map state
  mapViewport: MapViewport;
  
  // Filters
  filters: FilterState;
  personFilters: PersonFilterState;
  
  // Loading states
  loadingStates: LoadingStates;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setProperties: (properties: Property[]) => void;
  setPersons: (persons: Person[]) => void;
  setConnections: (connections: Connection[]) => void;
  setLinks: (links: Link[]) => void;
  setFilteredProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setMapViewport: (viewport: Partial<MapViewport>) => void;
  setMobileView: (isMobile: boolean) => void;
  setActiveTab: (tab: 'properties' | 'persons') => void;
  setIsLiveView: (isLive: boolean) => void;
  
  // UI Actions
  toggleSidebar: () => void;
  togglePropertyDetail: (open?: boolean) => void;
  toggleFilterDrawer: () => void;
  togglePropertyForm: (property?: Property) => void;
  togglePersonForm: (person?: Person) => void;
  
  // Filter Actions
  updateFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  updatePersonFilters: (newFilters: Partial<PersonFilterState>) => void;
  resetPersonFilters: () => void;
  
  // Data Actions
  loadProperties: () => Promise<void>;
  loadPersons: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadLinks: () => Promise<void>;
  loadAllData: () => Promise<void>;
  
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
  
  // Helper functions
  getPropertyPersons: (propertyId: number) => Person[];
  getPropertyLinks: (propertyId: number) => Link[];
  getAllTags: () => string[];
  applyFilters: () => void;
  applyPersonFilters: () => void;
}

const initialFilters: FilterState = {
  priceRanges: [],
  sizeRanges: [],
  propertyTypes: [],
  searchQuery: '',
  tags: [],
  excludedTags: [],
  rating: undefined,
  sortBy: 'newest',
  hasLocation: null,
  radiusRange: [0, 50000],
  zone: undefined,
  area: undefined,
};

const initialPersonFilters: PersonFilterState = {
  searchQuery: '',
  roles: [],
  hasProperties: null,
};

const initialMapViewport: MapViewport = {
  latitude: DEFAULT_COORDINATES.latitude,
  longitude: DEFAULT_COORDINATES.longitude,
  zoom: 12,
};

const initialLoadingStates: LoadingStates = {
  properties: false,
  persons: false,
  connections: false,
  links: false,
  creating: false,
  updating: false,
  deleting: false,
};

export const useStore = create<Store>((set, get) => ({
  // Initial state
  properties: [],
  persons: [],
  connections: [],
  links: [],
  filteredProperties: [],
  filteredPersons: [],
  selectedProperty: null,
  isPropertyDetailOpen: false,
  isSidebarOpen: true,
  isMobileView: false,
  isFilterDrawerOpen: false,
  showPropertyForm: false,
  showPersonForm: false,
  editingProperty: null,
  editingPerson: null,
  activeTab: 'properties',
  isLiveView: true,
  mapViewport: initialMapViewport,
  filters: initialFilters,
  personFilters: initialPersonFilters,
  loadingStates: initialLoadingStates,
  isLoading: false,
  error: null,

  // Setters
  setProperties: (properties) => {
    set({ properties });
    get().applyFilters();
  },
  
  setPersons: (persons) => {
    set({ persons });
    get().applyPersonFilters();
  },
  
  setConnections: (connections) => set({ connections }),
  setLinks: (links) => set({ links }),
  setFilteredProperties: (filteredProperties) => set({ filteredProperties }),
  
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  
  setMapViewport: (viewport) => {
    const currentViewport = get().mapViewport;
    
    // Handle bounds parameter specially
    if (viewport.bounds) {
      // If bounds is a MapLibre bounds object, extract the coordinates
      let boundsObj;
      if (typeof viewport.bounds.getNorth === 'function') {
        // MapLibre bounds object
        boundsObj = {
          north: viewport.bounds.getNorth(),
          south: viewport.bounds.getSouth(),
          east: viewport.bounds.getEast(),
          west: viewport.bounds.getWest(),
        };
      } else {
        // Already a plain object
        boundsObj = viewport.bounds;
      }
      
      set({
        mapViewport: {
          ...currentViewport,
          ...viewport,
          bounds: boundsObj,
        }
      });
    } else {
      // Regular viewport update without bounds
      const { bounds, ...viewportWithoutBounds } = viewport;
      set({
        mapViewport: {
          ...currentViewport,
          ...viewportWithoutBounds,
        }
      });
    }
  },
  
  setMobileView: (isMobile) => set({ isMobileView: isMobile }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLiveView: (isLive) => set({ isLiveView: isLive }),

  // UI Actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  togglePropertyDetail: (open) => set((state) => ({ 
    isPropertyDetailOpen: open !== undefined ? open : !state.isPropertyDetailOpen 
  })),
  
  toggleFilterDrawer: () => set((state) => ({ isFilterDrawerOpen: !state.isFilterDrawerOpen })),
  
  togglePropertyForm: (property) => set((state) => ({
    showPropertyForm: !state.showPropertyForm,
    editingProperty: property || null,
  })),
  
  togglePersonForm: (person) => set((state) => ({
    showPersonForm: !state.showPersonForm,
    editingPerson: person || null,
  })),

  // Filter Actions
  updateFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().applyFilters();
  },
  
  resetFilters: () => {
    set({ filters: initialFilters });
    get().applyFilters();
  },
  
  updatePersonFilters: (newFilters) => {
    set((state) => ({
      personFilters: { ...state.personFilters, ...newFilters }
    }));
    get().applyPersonFilters();
  },
  
  resetPersonFilters: () => {
    set({ personFilters: initialPersonFilters });
    get().applyPersonFilters();
  },

  // Data loading actions
  loadProperties: async () => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, properties: true },
      isLoading: true,
      error: null,
    }));

    try {
      const properties = await propertyAPI.getAll();
      console.log('Loaded properties:', properties.length);
      
      // Ensure all properties have valid locations
      const validatedProperties = properties.map(property => ({
        ...property,
        location: ensureValidLocation(property.location),
      }));
      
      set({ properties: validatedProperties });
      get().applyFilters();
    } catch (error) {
      console.error('Failed to load properties:', error);
      set({ error: 'Failed to load properties' });
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, properties: false },
        isLoading: false,
      }));
    }
  },

  loadPersons: async () => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, persons: true },
    }));

    try {
      const persons = await personAPI.getAll();
      console.log('Loaded persons:', persons.length);
      set({ persons });
      get().applyPersonFilters();
    } catch (error) {
      console.error('Failed to load persons:', error);
      set({ error: 'Failed to load persons' });
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, persons: false },
      }));
    }
  },

  loadConnections: async () => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, connections: true },
    }));

    try {
      const connections = await connectionAPI.getAll();
      console.log('Loaded connections:', connections.length);
      set({ connections });
    } catch (error) {
      console.error('Failed to load connections:', error);
      set({ error: 'Failed to load connections' });
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, connections: false },
      }));
    }
  },

  loadLinks: async () => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, links: true },
    }));

    try {
      const links = await linkAPI.getAll();
      console.log('Loaded links:', links.length);
      set({ links });
    } catch (error) {
      console.error('Failed to load links:', error);
      set({ error: 'Failed to load links' });
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, links: false },
      }));
    }
  },

  loadAllData: async () => {
    console.log('Loading all data...');
    set({ isLoading: true, error: null });

    try {
      await Promise.all([
        get().loadProperties(),
        get().loadPersons(),
        get().loadConnections(),
        get().loadLinks(),
      ]);
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Failed to load all data:', error);
      set({ error: 'Failed to load data' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Property CRUD
  createProperty: async (propertyData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await propertyAPI.create(propertyData);
      if (result.success) {
        // Reload properties to get the updated list
        await get().loadProperties();
      }
    } catch (error) {
      console.error('Failed to create property:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, creating: false },
      }));
    }
  },

  updateProperty: async (property) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, updating: true },
    }));

    try {
      const result = await propertyAPI.update(property);
      if (result.success) {
        // Update the property in the local state
        set((state) => {
          const updatedProperties = state.properties.map(p => 
            p.id === property.id ? property : p
          );
          return { 
            properties: updatedProperties,
            selectedProperty: state.selectedProperty?.id === property.id ? property : state.selectedProperty
          };
        });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, updating: false },
      }));
    }
  },

  deleteProperty: async (id) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, deleting: true },
    }));

    try {
      // Delete associated connections and links first
      await connectionAPI.deleteByPropertyId(id);
      await linkAPI.deleteByPropertyId(id);
      
      // Then delete the property
      const result = await propertyAPI.delete(id);
      if (result.success) {
        set((state) => {
          const updatedProperties = state.properties.filter(p => p.id !== id);
          const updatedConnections = state.connections.filter(c => c.property_id !== id);
          const updatedLinks = state.links.filter(l => l.property_id !== id);
          
          return {
            properties: updatedProperties,
            connections: updatedConnections,
            links: updatedLinks,
            selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
            isPropertyDetailOpen: state.selectedProperty?.id === id ? false : state.isPropertyDetailOpen,
          };
        });
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Person CRUD
  createPerson: async (personData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await personAPI.create(personData);
      if (result.success) {
        await get().loadPersons();
      }
    } catch (error) {
      console.error('Failed to create person:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, creating: false },
      }));
    }
  },

  updatePerson: async (person) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, updating: true },
    }));

    try {
      const result = await personAPI.update(person);
      if (result.success) {
        set((state) => ({
          persons: state.persons.map(p => p.id === person.id ? person : p),
        }));
        get().applyPersonFilters();
      }
    } catch (error) {
      console.error('Failed to update person:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, updating: false },
      }));
    }
  },

  deletePerson: async (id) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, deleting: true },
    }));

    try {
      // Delete associated connections first
      await connectionAPI.deleteByPersonId(id);
      
      // Then delete the person
      const result = await personAPI.delete(id);
      if (result.success) {
        set((state) => ({
          persons: state.persons.filter(p => p.id !== id),
          connections: state.connections.filter(c => c.person_id !== id),
        }));
        get().applyPersonFilters();
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Connection CRUD
  createConnection: async (connectionData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await connectionAPI.create(connectionData);
      if (result.success) {
        await get().loadConnections();
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, creating: false },
      }));
    }
  },

  deleteConnection: async (id) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, deleting: true },
    }));

    try {
      const result = await connectionAPI.delete(id);
      if (result.success) {
        set((state) => ({
          connections: state.connections.filter(c => c.id !== id),
        }));
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Link CRUD
  createLink: async (linkData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await linkAPI.create(linkData);
      if (result.success) {
        await get().loadLinks();
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, creating: false },
      }));
    }
  },

  updateLink: async (link) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, updating: true },
    }));

    try {
      const result = await linkAPI.update(link);
      if (result.success) {
        set((state) => ({
          links: state.links.map(l => l.id === link.id ? link : l),
        }));
      }
    } catch (error) {
      console.error('Failed to update link:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, updating: false },
      }));
    }
  },

  deleteLink: async (id) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, deleting: true },
    }));

    try {
      const result = await linkAPI.delete(id);
      if (result.success) {
        set((state) => ({
          links: state.links.filter(l => l.id !== id),
        }));
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Helper functions
  getPropertyPersons: (propertyId) => {
    const state = get();
    const propertyConnections = state.connections.filter(c => c.property_id === propertyId);
    return propertyConnections.map(connection => 
      state.persons.find(person => person.id === connection.person_id)
    ).filter(Boolean) as Person[];
  },

  getPropertyLinks: (propertyId) => {
    const state = get();
    return state.links.filter(link => link.property_id === propertyId);
  },

  getAllTags: () => {
    const state = get();
    const allTags = state.properties.flatMap(property => property.tags || []);
    return Array.from(new Set(allTags)).sort();
  },

  // Enhanced filtering logic
  applyFilters: () => {
    const state = get();
    const { properties, filters, connections, persons } = state;

    let filtered = [...properties];

    // Search query filter - Enhanced to search across multiple fields
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(property => {
        // Search in property fields
        const propertyMatch = 
          (property.area?.toLowerCase().includes(query)) ||
          (property.zone?.toLowerCase().includes(query)) ||
          (property.type?.toLowerCase().includes(query)) ||
          (property.description?.toLowerCase().includes(query)) ||
          (property.note?.toLowerCase().includes(query)) ||
          (property.tags?.some(tag => tag.toLowerCase().includes(query)));

        // Search in connected persons
        const propertyConnections = connections.filter(c => c.property_id === property.id);
        const connectedPersons = propertyConnections.map(conn => 
          persons.find(person => person.id === conn.person_id)
        ).filter(Boolean);
        
        const personMatch = connectedPersons.some(person => 
          person?.name?.toLowerCase().includes(query) ||
          person?.phone?.includes(query) ||
          person?.alternative_contact?.includes(query) ||
          person?.role?.toLowerCase().includes(query) ||
          person?.about?.toLowerCase().includes(query)
        );

        // Search in connection details
        const connectionMatch = propertyConnections.some(conn =>
          conn.role?.toLowerCase().includes(query) ||
          conn.remark?.toLowerCase().includes(query)
        );

        return propertyMatch || personMatch || connectionMatch;
      });
    }

    // Zone filter - NEW: Apply zone filtering
    if (filters.zone && filters.zone.trim()) {
      filtered = filtered.filter(property => 
        property.zone === filters.zone
      );
    }

    // Area filter - NEW: Apply area filtering
    if (filters.area && filters.area.trim()) {
      const areaQuery = filters.area.toLowerCase().trim();
      filtered = filtered.filter(property => 
        property.area?.toLowerCase().includes(areaQuery)
      );
    }

    // Property type filter
    if (filters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyTypes.includes(property.type!)
      );
    }

    // Price range filter - Multiple ranges support
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter(property => {
        return filters.priceRanges.some(([min, max]) => {
          const propertyMin = property.price_min;
          const propertyMax = property.price_max;
          
          // Check if property price range overlaps with filter range
          return (propertyMin <= max && propertyMax >= min);
        });
      });
    }

    // Size range filter - Multiple ranges support
    if (filters.sizeRanges.length > 0) {
      filtered = filtered.filter(property => {
        return filters.sizeRanges.some(([min, max]) => {
          const propertyMin = property.size_min;
          const propertyMax = property.size_max;
          
          // Check if property size range overlaps with filter range
          return (propertyMin <= max && propertyMax >= min);
        });
      });
    }

    // Rating filter
    if (filters.rating !== undefined) {
      filtered = filtered.filter(property => 
        property.rating >= filters.rating!
      );
    }

    // Tags filter (include)
    if (filters.tags.length > 0) {
      filtered = filtered.filter(property => 
        filters.tags.some(tag => property.tags.includes(tag))
      );
    }

    // Excluded tags filter
    if (filters.excludedTags.length > 0) {
      filtered = filtered.filter(property => 
        !filters.excludedTags.some(tag => property.tags.includes(tag))
      );
    }

    // Location status filter
    if (filters.hasLocation !== null) {
      filtered = filtered.filter(property => {
        const hasValidLocation = 
          property.location.latitude !== DEFAULT_COORDINATES.latitude ||
          property.location.longitude !== DEFAULT_COORDINATES.longitude;
        
        return filters.hasLocation ? hasValidLocation : !hasValidLocation;
      });
    }

    // Radius range filter
    if (filters.radiusRange && (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000)) {
      filtered = filtered.filter(property => {
        const radius = property.radius || 0;
        return radius >= filters.radiusRange[0] && radius <= filters.radiusRange[1];
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.price_min - b.price_min;
        case 'price_desc':
          return b.price_min - a.price_min;
        case 'size_asc':
          return a.size_min - b.size_min;
        case 'size_desc':
          return b.size_min - a.size_min;
        case 'rating_desc':
          return (b.rating || 0) - (a.rating || 0);
        case 'oldest':
          return a.id - b.id; // Assuming lower ID means older
        case 'newest':
        default:
          return b.id - a.id; // Assuming higher ID means newer
      }
    });

    set({ filteredProperties: filtered });
  },

  applyPersonFilters: () => {
    const state = get();
    const { persons, personFilters, connections } = state;

    let filtered = [...persons];

    // Search query filter
    if (personFilters.searchQuery && personFilters.searchQuery.trim()) {
      const query = personFilters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(person => 
        (person.name?.toLowerCase().includes(query)) ||
        (person.phone?.includes(query)) ||
        (person.alternative_contact?.includes(query)) ||
        (person.role?.toLowerCase().includes(query)) ||
        (person.about?.toLowerCase().includes(query))
      );
    }

    // Role filter
    if (personFilters.roles.length > 0) {
      filtered = filtered.filter(person => 
        personFilters.roles.includes(person.role!)
      );
    }

    // Has properties filter
    if (personFilters.hasProperties !== null) {
      filtered = filtered.filter(person => {
        const hasProperties = connections.some(conn => conn.person_id === person.id);
        return personFilters.hasProperties ? hasProperties : !hasProperties;
      });
    }

    set({ filteredPersons: filtered });
  },
}));