import { create } from 'zustand';
import { Property, Person, Connection, Link, FilterState, PersonFilterState, MapViewport, SortOption } from '../types';
import { propertyAPI, personAPI, connectionAPI, linkAPI, extractAllDataFromProperties } from '../utils/api';
import { DEFAULT_COORDINATES } from '../constants';
import { authUtils } from '../utils/auth';

interface LoadingStates {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
}

interface Store {
  // Authentication
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  
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
  selectedPerson: Person | null;
  isPropertyDetailOpen: boolean;
  isPersonDetailOpen: boolean;
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
  isLoadingFromCache: boolean;
  error: string | null;
  lastSyncTime: number | null;
  
  // Actions
  setProperties: (properties: Property[]) => void;
  setPersons: (persons: Person[]) => void;
  setConnections: (connections: Connection[]) => void;
  setLinks: (links: Link[]) => void;
  setFilteredProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setSelectedPerson: (person: Person | null) => void;
  setMapViewport: (viewport: Partial<MapViewport>) => void;
  toggleSidebar: () => void;
  setMobileView: (isMobile: boolean) => void;
  toggleFilterDrawer: () => void;
  togglePropertyDetail: (open?: boolean) => void;
  togglePersonDetail: (open?: boolean) => void;
  togglePropertyForm: (property?: Property) => void;
  togglePersonForm: (person?: Person) => void;
  setActiveTab: (tab: 'properties' | 'persons') => void;
  setIsLiveView: (isLive: boolean) => void;
  
  // Filter actions
  updateFilters: (newFilters: Partial<FilterState>) => void;
  updatePersonFilters: (newFilters: Partial<PersonFilterState>) => void;
  resetFilters: () => void;
  resetPersonFilters: () => void;
  applyFilters: () => void;
  applyPersonFilters: () => void;
  
  // Data actions
  loadProperties: () => Promise<void>;
  loadPersons: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadLinks: () => Promise<void>;
  loadAllData: () => Promise<void>;
  loadFromCache: () => Promise<void>;
  refreshData: () => Promise<void>;
  
  // CRUD operations
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
  
  // Detail loading
  loadPropertyDetails: (id: number) => Promise<void>;
  loadPersonDetails: (id: number) => Promise<void>;
  
  // Helper functions
  getPropertyPersons: (propertyId: number) => Person[];
  getPersonProperties: (personId: number) => Property[];
  getPropertyConnections: (propertyId: number) => Connection[];
  getPersonConnections: (personId: number) => Connection[];
  getPropertyLinks: (propertyId: number) => Link[];
  getAllTags: () => string[];
}

// Default filter state
const defaultFilters: FilterState = {
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

const defaultPersonFilters: PersonFilterState = {
  searchQuery: '',
  roles: [],
  hasProperties: null,
};

// Cache keys
const CACHE_KEYS = {
  properties: 'cached_properties',
  persons: 'cached_persons',
  connections: 'cached_connections',
  links: 'cached_links',
  lastSync: 'last_sync_time',
};

export const useStore = create<Store>((set, get) => ({
  // Authentication state
  isAuthenticated: authUtils.isAuthenticated(),

  async login(pin: string) {
    const success = await authUtils.login(pin);
    if (success) {
      set({ isAuthenticated: true });
    }
    return success;
  },

  logout() {
    authUtils.logout();
    // Clear all app data on logout
    set({
      isAuthenticated: false,
      properties: [],
      persons: [],
      connections: [],
      links: [],
      filteredProperties: [],
      filteredPersons: [],
      selectedProperty: null,
      selectedPerson: null,
      isPropertyDetailOpen: false,
      isPersonDetailOpen: false,
      filters: defaultFilters,
      personFilters: defaultPersonFilters,
      lastSyncTime: null,
      error: null,
    });
    
    // Clear cache
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  checkAuth() {
    const isAuth = authUtils.isAuthenticated();
    if (get().isAuthenticated !== isAuth) {
      if (!isAuth) {
        // User session expired, logout
        get().logout();
      } else {
        set({ isAuthenticated: isAuth });
      }
    }
  },

  // Initial state
  properties: [],
  persons: [],
  connections: [],
  links: [],
  filteredProperties: [],
  filteredPersons: [],
  selectedProperty: null,
  selectedPerson: null,
  isPropertyDetailOpen: false,
  isPersonDetailOpen: false,
  isSidebarOpen: true,
  isMobileView: false,
  isFilterDrawerOpen: false,
  showPropertyForm: false,
  showPersonForm: false,
  editingProperty: null,
  editingPerson: null,
  activeTab: 'properties',
  isLiveView: false,
  
  mapViewport: {
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    zoom: 12,
  },
  
  filters: defaultFilters,
  personFilters: defaultPersonFilters,
  
  loadingStates: {
    creating: false,
    updating: false,
    deleting: false,
  },
  isLoading: false,
  isLoadingFromCache: false,
  error: null,
  lastSyncTime: null,

  // Basic setters
  setProperties: (properties) => {
    set({ properties });
    // Cache the data
    localStorage.setItem(CACHE_KEYS.properties, JSON.stringify(properties));
  },
  
  setPersons: (persons) => {
    set({ persons });
    localStorage.setItem(CACHE_KEYS.persons, JSON.stringify(persons));
  },
  
  setConnections: (connections) => {
    set({ connections });
    localStorage.setItem(CACHE_KEYS.connections, JSON.stringify(connections));
  },
  
  setLinks: (links) => {
    set({ links });
    localStorage.setItem(CACHE_KEYS.links, JSON.stringify(links));
  },
  
  setFilteredProperties: (filteredProperties) => set({ filteredProperties }),
  setSelectedProperty: (selectedProperty) => set({ selectedProperty }),
  setSelectedPerson: (selectedPerson) => set({ selectedPerson }),
  
  setMapViewport: (viewport) => {
    const currentViewport = get().mapViewport;
    
    // Handle bounds conversion if needed
    let processedViewport = { ...viewport };
    
    if (viewport.bounds && typeof viewport.bounds.getNorth === 'function') {
      // Convert MapLibre bounds object to plain object
      try {
        processedViewport.bounds = {
          north: viewport.bounds.getNorth(),
          south: viewport.bounds.getSouth(),
          east: viewport.bounds.getEast(),
          west: viewport.bounds.getWest(),
        };
      } catch (error) {
        console.warn('Error converting bounds:', error);
        delete processedViewport.bounds;
      }
    }
    
    set({ 
      mapViewport: { 
        ...currentViewport, 
        ...processedViewport 
      } 
    });
  },

  // UI actions
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setMobileView: (isMobileView) => set({ isMobileView }),
  toggleFilterDrawer: () => set((state) => ({ isFilterDrawerOpen: !state.isFilterDrawerOpen })),
  
  togglePropertyDetail: (open) => set((state) => ({ 
    isPropertyDetailOpen: open !== undefined ? open : !state.isPropertyDetailOpen 
  })),
  
  togglePersonDetail: (open) => set((state) => ({ 
    isPersonDetailOpen: open !== undefined ? open : !state.isPersonDetailOpen 
  })),
  
  togglePropertyForm: (property) => set((state) => ({
    showPropertyForm: !state.showPropertyForm,
    editingProperty: property || null,
  })),
  
  togglePersonForm: (person) => set((state) => ({
    showPersonForm: !state.showPersonForm,
    editingPerson: person || null,
  })),
  
  setActiveTab: (activeTab) => {
    set({ activeTab });
    // Auto-open sidebar when switching tabs on mobile
    if (get().isMobileView) {
      set({ isSidebarOpen: true });
    }
  },
  
  setIsLiveView: (isLiveView) => set({ isLiveView }),

  // Filter actions
  updateFilters: (newFilters) => {
    const updatedFilters = { ...get().filters, ...newFilters };
    set({ filters: updatedFilters });
    get().applyFilters();
  },
  
  updatePersonFilters: (newFilters) => {
    const updatedFilters = { ...get().personFilters, ...newFilters };
    set({ personFilters: updatedFilters });
    get().applyPersonFilters();
  },
  
  resetFilters: () => {
    set({ filters: defaultFilters });
    get().applyFilters();
  },
  
  resetPersonFilters: () => {
    set({ personFilters: defaultPersonFilters });
    get().applyPersonFilters();
  },

  applyFilters: () => {
    const { properties, filters } = get();
    let filtered = [...properties];

    // Search query filter
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter((property) => {
        // Search in property fields
        const propertyMatch = 
          (property.area?.toLowerCase().includes(query)) ||
          (property.zone?.toLowerCase().includes(query)) ||
          (property.description?.toLowerCase().includes(query)) ||
          (property.note?.toLowerCase().includes(query)) ||
          (property.type?.toLowerCase().includes(query)) ||
          property.tags.some(tag => tag.toLowerCase().includes(query));

        if (propertyMatch) return true;

        // Search in connected persons
        const propertyConnections = get().getPropertyConnections(property.id);
        const connectedPersons = propertyConnections.map(conn => 
          get().persons.find(person => person.id === conn.person_id)
        ).filter(Boolean);

        const personMatch = connectedPersons.some(person => 
          person && (
            person.name?.toLowerCase().includes(query) ||
            person.phone?.includes(query) ||
            person.alternative_contact_details?.includes(query) ||
            person.about?.toLowerCase().includes(query) ||
            person.role?.toLowerCase().includes(query)
          )
        );

        if (personMatch) return true;

        // Search in connection remarks
        const connectionMatch = propertyConnections.some(conn =>
          conn.remark?.toLowerCase().includes(query) ||
          conn.role?.toLowerCase().includes(query)
        );

        return connectionMatch;
      });
    }

    // Zone filter
    if (filters.zone && filters.zone.trim()) {
      filtered = filtered.filter(property => 
        property.zone?.toLowerCase() === filters.zone?.toLowerCase()
      );
    }

    // Area filter
    if (filters.area && filters.area.trim()) {
      const areaQuery = filters.area.toLowerCase().trim();
      filtered = filtered.filter(property => 
        property.area?.toLowerCase().includes(areaQuery)
      );
    }

    // Property type filter
    if (filters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyTypes.includes(property.type || 'Other')
      );
    }

    // Price range filter - support multiple ranges
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter(property => {
        return filters.priceRanges.some(([min, max]) => {
          const propertyMin = property.price_min;
          const propertyMax = property.price_max;
          
          // Check if property price range overlaps with filter range
          return propertyMin <= max && propertyMax >= min;
        });
      });
    }

    // Size range filter - support multiple ranges
    if (filters.sizeRanges.length > 0) {
      filtered = filtered.filter(property => {
        return filters.sizeRanges.some(([min, max]) => {
          const propertyMin = property.size_min;
          const propertyMax = property.size_max;
          
          // Convert to square yards for comparison (assuming input is in gaj/square yards)
          return propertyMin <= max && propertyMax >= min;
        });
      });
    }

    // Rating filter
    if (filters.rating !== undefined) {
      filtered = filtered.filter(property => 
        (property.rating || 0) >= filters.rating!
      );
    }

    // Tags filter (include)
    if (filters.tags.length > 0) {
      filtered = filtered.filter(property =>
        filters.tags.every(tag => property.tags.includes(tag))
      );
    }

    // Excluded tags filter
    if (filters.excludedTags.length > 0) {
      filtered = filtered.filter(property =>
        !filters.excludedTags.some(tag => property.tags.includes(tag))
      );
    }

    // Location filter
    if (filters.hasLocation !== null) {
      filtered = filtered.filter(property => {
        const hasLocation = property.location.latitude !== DEFAULT_COORDINATES.latitude ||
                           property.location.longitude !== DEFAULT_COORDINATES.longitude;
        return filters.hasLocation ? hasLocation : !hasLocation;
      });
    }

    // Radius range filter
    if (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000) {
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
    const { persons, personFilters, connections, properties } = get();
    let filtered = [...persons];

    // Search query filter
    if (personFilters.searchQuery && personFilters.searchQuery.trim()) {
      const query = personFilters.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(person =>
        (person.name?.toLowerCase().includes(query)) ||
        (person.phone?.includes(query)) ||
        (person.alternative_contact_details?.includes(query)) ||
        (person.about?.toLowerCase().includes(query)) ||
        (person.role?.toLowerCase().includes(query))
      );
    }

    // Role filter
    if (personFilters.roles.length > 0) {
      filtered = filtered.filter(person =>
        personFilters.roles.includes(person.role || 'Other Related')
      );
    }

    // Has properties filter
    if (personFilters.hasProperties !== null) {
      filtered = filtered.filter(person => {
        const hasProperties = connections.some(conn => conn.person_id === person.id);
        return personFilters.hasProperties ? hasProperties : !hasProperties;
      });
    }

    // Sort by most recently added (assuming higher ID = newer)
    filtered.sort((a, b) => b.id - a.id);

    set({ filteredPersons: filtered });
  },

  // Data loading functions
  loadFromCache: async () => {
    set({ isLoadingFromCache: true, error: null });
    
    try {
      const cachedProperties = localStorage.getItem(CACHE_KEYS.properties);
      const cachedPersons = localStorage.getItem(CACHE_KEYS.persons);
      const cachedConnections = localStorage.getItem(CACHE_KEYS.connections);
      const cachedLinks = localStorage.getItem(CACHE_KEYS.links);
      const cachedLastSync = localStorage.getItem(CACHE_KEYS.lastSync);

      if (cachedProperties) {
        const properties = JSON.parse(cachedProperties);
        set({ properties });
        console.log('Loaded properties from cache:', properties.length);
      }

      if (cachedPersons) {
        const persons = JSON.parse(cachedPersons);
        set({ persons });
        console.log('Loaded persons from cache:', persons.length);
      }

      if (cachedConnections) {
        const connections = JSON.parse(cachedConnections);
        set({ connections });
        console.log('Loaded connections from cache:', connections.length);
      }

      if (cachedLinks) {
        const links = JSON.parse(cachedLinks);
        set({ links });
        console.log('Loaded links from cache:', links.length);
      }

      if (cachedLastSync) {
        const lastSyncTime = parseInt(cachedLastSync);
        set({ lastSyncTime });
      }

      // Apply filters to cached data
      get().applyFilters();
      get().applyPersonFilters();

    } catch (error) {
      console.error('Error loading from cache:', error);
    } finally {
      set({ isLoadingFromCache: false });
    }
  },

  loadProperties: async () => {
    const { isLoading } = get();
    if (isLoading) {
      console.log('Properties already loading, skipping duplicate request');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const properties = await propertyAPI.getAll();
      get().setProperties(properties);
      get().applyFilters();
      console.log('Properties loaded successfully:', properties.length);
    } catch (error) {
      console.error('Failed to load properties:', error);
      set({ error: 'Failed to load properties' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadPersons: async () => {
    const { isLoading } = get();
    if (isLoading) {
      console.log('Persons already loading, skipping duplicate request');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      const persons = await personAPI.getAll();
      get().setPersons(persons);
      get().applyPersonFilters();
      console.log('Persons loaded successfully:', persons.length);
    } catch (error) {
      console.error('Failed to load persons:', error);
      set({ error: 'Failed to load persons' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadConnections: async () => {
    try {
      const connections = await connectionAPI.getAll();
      get().setConnections(connections);
      console.log('Connections loaded successfully:', connections.length);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  },

  loadLinks: async () => {
    try {
      const links = await linkAPI.getAll();
      get().setLinks(links);
      console.log('Links loaded successfully:', links.length);
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  },

  loadAllData: async () => {
    const { isLoading } = get();
    if (isLoading) {
      console.log('Data already loading, skipping duplicate request');
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      console.log('Loading all data from API...');
      
      // Use the optimized endpoint that returns all data in one call
      const { properties, persons, connections, links } = await extractAllDataFromProperties();
      
      // Update all data at once
      get().setProperties(properties);
      get().setPersons(persons);
      get().setConnections(connections);
      get().setLinks(links);
      
      // Apply filters
      get().applyFilters();
      get().applyPersonFilters();
      
      // Update sync time
      const now = Date.now();
      set({ lastSyncTime: now });
      localStorage.setItem(CACHE_KEYS.lastSync, now.toString());
      
      console.log('All data loaded successfully:', {
        properties: properties.length,
        persons: persons.length,
        connections: connections.length,
        links: links.length
      });
      
    } catch (error) {
      console.error('Failed to load all data:', error);
      set({ error: 'Failed to load data from server' });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshData: async () => {
    console.log('Refreshing all data...');
    await get().loadAllData();
  },

  // CRUD operations
  createProperty: async (property) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await propertyAPI.create(property);
      
      if (result.success && result.id) {
        const newProperty = { ...property, id: result.id };
        const updatedProperties = [...get().properties, newProperty];
        get().setProperties(updatedProperties);
        get().applyFilters();
      }
    } catch (error) {
      console.error('Failed to create property:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, creating: false } }));
    }
  },

  updateProperty: async (property) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, updating: true } }));
    
    try {
      await propertyAPI.update(property);
      
      const updatedProperties = get().properties.map(p => 
        p.id === property.id ? property : p
      );
      get().setProperties(updatedProperties);
      get().applyFilters();
      
      // Update selected property if it's the one being updated
      if (get().selectedProperty?.id === property.id) {
        set({ selectedProperty: property });
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, updating: false } }));
    }
  },

  deleteProperty: async (id) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, deleting: true } }));
    
    try {
      await propertyAPI.delete(id);
      
      // Remove from properties
      const updatedProperties = get().properties.filter(p => p.id !== id);
      get().setProperties(updatedProperties);
      get().applyFilters();
      
      // Remove related connections
      const updatedConnections = get().connections.filter(c => c.property_id !== id);
      get().setConnections(updatedConnections);
      
      // Remove related links
      const updatedLinks = get().links.filter(l => l.property_id !== id);
      get().setLinks(updatedLinks);
      
      // Clear selected property if it was deleted
      if (get().selectedProperty?.id === id) {
        set({ selectedProperty: null, isPropertyDetailOpen: false });
      }
    } catch (error) {
      console.error('Failed to delete property:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },

  createPerson: async (person) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await personAPI.create(person);
      
      if (result.success && result.id) {
        const newPerson = { ...person, id: result.id };
        const updatedPersons = [...get().persons, newPerson];
        get().setPersons(updatedPersons);
        get().applyPersonFilters();
      }
    } catch (error) {
      console.error('Failed to create person:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, creating: false } }));
    }
  },

  updatePerson: async (person) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, updating: true } }));
    
    try {
      await personAPI.update(person);
      
      const updatedPersons = get().persons.map(p => 
        p.id === person.id ? person : p
      );
      get().setPersons(updatedPersons);
      get().applyPersonFilters();
      
      // Update selected person if it's the one being updated
      if (get().selectedPerson?.id === person.id) {
        set({ selectedPerson: person });
      }
    } catch (error) {
      console.error('Failed to update person:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, updating: false } }));
    }
  },

  deletePerson: async (id) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, deleting: true } }));
    
    try {
      await personAPI.delete(id);
      
      // Remove from persons
      const updatedPersons = get().persons.filter(p => p.id !== id);
      get().setPersons(updatedPersons);
      get().applyPersonFilters();
      
      // Remove related connections
      const updatedConnections = get().connections.filter(c => c.person_id !== id);
      get().setConnections(updatedConnections);
      
      // Clear selected person if it was deleted
      if (get().selectedPerson?.id === id) {
        set({ selectedPerson: null, isPersonDetailOpen: false });
      }
    } catch (error) {
      console.error('Failed to delete person:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },

  createConnection: async (connection) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await connectionAPI.create(connection);
      
      if (result.success && result.id) {
        const newConnection = { ...connection, id: result.id };
        const updatedConnections = [...get().connections, newConnection];
        get().setConnections(updatedConnections);
      }
    } catch (error) {
      console.error('Failed to create connection:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, creating: false } }));
    }
  },

  deleteConnection: async (id) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, deleting: true } }));
    
    try {
      await connectionAPI.delete(id);
      
      const updatedConnections = get().connections.filter(c => c.id !== id);
      get().setConnections(updatedConnections);
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },

  createLink: async (link) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await linkAPI.create(link);
      
      if (result.success && result.id) {
        const newLink = { ...link, id: result.id };
        const updatedLinks = [...get().links, newLink];
        get().setLinks(updatedLinks);
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, creating: false } }));
    }
  },

  updateLink: async (link) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, updating: true } }));
    
    try {
      await linkAPI.update(link);
      
      const updatedLinks = get().links.map(l => 
        l.id === link.id ? link : l
      );
      get().setLinks(updatedLinks);
    } catch (error) {
      console.error('Failed to update link:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, updating: false } }));
    }
  },

  deleteLink: async (id) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, deleting: true } }));
    
    try {
      await linkAPI.delete(id);
      
      const updatedLinks = get().links.filter(l => l.id !== id);
      get().setLinks(updatedLinks);
    } catch (error) {
      console.error('Failed to delete link:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },

  // Detail loading functions
  loadPropertyDetails: async (id) => {
    try {
      const { property, persons, connections, links } = await propertyAPI.getById(id);
      
      // Update the property in the main list
      const updatedProperties = get().properties.map(p => 
        p.id === id ? property : p
      );
      get().setProperties(updatedProperties);
      
      // Update selected property
      set({ selectedProperty: property });
      
      // Merge any new persons, connections, and links
      const existingPersonIds = new Set(get().persons.map(p => p.id));
      const newPersons = persons.filter(p => !existingPersonIds.has(p.id));
      if (newPersons.length > 0) {
        get().setPersons([...get().persons, ...newPersons]);
      }
      
      const existingConnectionIds = new Set(get().connections.map(c => c.id));
      const newConnections = connections.filter(c => !existingConnectionIds.has(c.id));
      if (newConnections.length > 0) {
        get().setConnections([...get().connections, ...newConnections]);
      }
      
      const existingLinkIds = new Set(get().links.map(l => l.id));
      const newLinks = links.filter(l => !existingLinkIds.has(l.id));
      if (newLinks.length > 0) {
        get().setLinks([...get().links, ...newLinks]);
      }
      
    } catch (error) {
      console.error('Failed to load property details:', error);
      throw error;
    }
  },

  loadPersonDetails: async (id) => {
    try {
      const { person, properties, connections, links } = await personAPI.getById(id);
      
      // Update the person in the main list
      const updatedPersons = get().persons.map(p => 
        p.id === id ? person : p
      );
      get().setPersons(updatedPersons);
      
      // Update selected person
      set({ selectedPerson: person });
      
      // Merge any new properties, connections, and links
      const existingPropertyIds = new Set(get().properties.map(p => p.id));
      const newProperties = properties.filter(p => !existingPropertyIds.has(p.id));
      if (newProperties.length > 0) {
        get().setProperties([...get().properties, ...newProperties]);
      }
      
      const existingConnectionIds = new Set(get().connections.map(c => c.id));
      const newConnections = connections.filter(c => !existingConnectionIds.has(c.id));
      if (newConnections.length > 0) {
        get().setConnections([...get().connections, ...newConnections]);
      }
      
      const existingLinkIds = new Set(get().links.map(l => l.id));
      const newLinks = links.filter(l => !existingLinkIds.has(l.id));
      if (newLinks.length > 0) {
        get().setLinks([...get().links, ...newLinks]);
      }
      
    } catch (error) {
      console.error('Failed to load person details:', error);
      throw error;
    }
  },

  // Helper functions
  getPropertyPersons: (propertyId) => {
    const { persons, connections } = get();
    const propertyConnections = connections.filter(c => c.property_id === propertyId);
    return propertyConnections.map(connection => 
      persons.find(person => person.id === connection.person_id)
    ).filter(Boolean) as Person[];
  },

  getPersonProperties: (personId) => {
    const { properties, connections } = get();
    const personConnections = connections.filter(c => c.person_id === personId);
    return personConnections.map(connection => 
      properties.find(property => property.id === connection.property_id)
    ).filter(Boolean) as Property[];
  },

  getPropertyConnections: (propertyId) => {
    return get().connections.filter(c => c.property_id === propertyId);
  },

  getPersonConnections: (personId) => {
    return get().connections.filter(c => c.person_id === personId);
  },

  getPropertyLinks: (propertyId) => {
    return get().links.filter(l => l.property_id === propertyId);
  },

  getAllTags: () => {
    const { properties } = get();
    const allTags = properties.flatMap(property => property.tags || []);
    return Array.from(new Set(allTags)).sort();
  },
}));