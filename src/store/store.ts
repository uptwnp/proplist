import { create } from 'zustand';
import { Property, Person, Connection, Link, FilterState, PersonFilterState, MapViewport, SortOption } from '../types';
import { propertyAPI, personAPI, connectionAPI, linkAPI, extractAllDataFromProperties } from '../utils/api';
import { DEFAULT_COORDINATES, MAP_CONFIG, ITEMS_PER_PAGE } from '../constants';

interface Store {
  // Data
  properties: Property[];
  persons: Person[];
  connections: Connection[];
  links: Link[];
  
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
  
  // Map State
  mapViewport: MapViewport;
  
  // Filter State
  filters: FilterState;
  personFilters: PersonFilterState;
  filteredProperties: Property[];
  filteredPersons: Person[];
  
  // Loading States
  isLoading: boolean;
  isLoadingFromCache: boolean;
  loadingStates: {
    creating: boolean;
    updating: boolean;
    deleting: boolean;
  };
  error: string | null;
  lastSyncTime: number | null;
  
  // Actions
  setProperties: (properties: Property[]) => void;
  setPersons: (persons: Person[]) => void;
  setConnections: (connections: Connection[]) => void;
  setLinks: (links: Link[]) => void;
  
  setSelectedProperty: (property: Property | null) => void;
  setSelectedPerson: (person: Person | null) => void;
  togglePropertyDetail: (open?: boolean) => void;
  togglePersonDetail: (open?: boolean) => void;
  toggleSidebar: () => void;
  setMobileView: (isMobile: boolean) => void;
  toggleFilterDrawer: () => void;
  togglePropertyForm: (property?: Property) => void;
  togglePersonForm: (person?: Person) => void;
  setActiveTab: (tab: 'properties' | 'persons') => void;
  
  setMapViewport: (viewport: MapViewport) => void;
  
  updateFilters: (newFilters: Partial<FilterState>) => void;
  updatePersonFilters: (newFilters: Partial<PersonFilterState>) => void;
  resetFilters: () => void;
  resetPersonFilters: () => void;
  applyFilters: () => void;
  applyPersonFilters: () => void;
  
  // Data operations
  loadFromCache: () => Promise<void>;
  loadAllData: () => Promise<void>;
  loadProperties: () => Promise<void>;
  loadPersons: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadLinks: () => Promise<void>;
  loadPropertyDetails: (propertyId: number) => Promise<void>;
  loadPersonDetails: (personId: number) => Promise<void>;
  refreshData: () => Promise<void>;
  
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
  getPersonProperties: (personId: number) => Property[];
  getPropertyConnections: (propertyId: number) => Connection[];
  getPersonConnections: (personId: number) => Connection[];
  getPropertyLinks: (propertyId: number) => Link[];
  getAllTags: () => string[];
}

// Helper function to load map viewport from localStorage
const loadMapViewportFromStorage = (): MapViewport => {
  try {
    const saved = localStorage.getItem('mapViewport');
    if (saved) {
      const parsed = JSON.parse(saved);
      
      // Validate the saved viewport data
      if (
        parsed &&
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        typeof parsed.zoom === 'number' &&
        !isNaN(parsed.latitude) &&
        !isNaN(parsed.longitude) &&
        !isNaN(parsed.zoom) &&
        parsed.latitude >= -90 &&
        parsed.latitude <= 90 &&
        parsed.longitude >= -180 &&
        parsed.longitude <= 180 &&
        parsed.zoom >= MAP_CONFIG.minZoom &&
        parsed.zoom <= MAP_CONFIG.maxZoom
      ) {
        console.log('Loaded saved map viewport from localStorage:', parsed);
        return {
          latitude: parsed.latitude,
          longitude: parsed.longitude,
          zoom: parsed.zoom
        };
      }
    }
  } catch (error) {
    console.warn('Failed to load saved map viewport:', error);
  }
  
  // Return default viewport if no valid saved data
  return {
    latitude: DEFAULT_COORDINATES.latitude,
    longitude: DEFAULT_COORDINATES.longitude,
    zoom: MAP_CONFIG.defaultZoom
  };
};

// Helper function to save map viewport to localStorage
const saveMapViewportToStorage = (viewport: MapViewport) => {
  try {
    // Validate viewport before saving
    if (
      viewport &&
      typeof viewport.latitude === 'number' &&
      typeof viewport.longitude === 'number' &&
      typeof viewport.zoom === 'number' &&
      !isNaN(viewport.latitude) &&
      !isNaN(viewport.longitude) &&
      !isNaN(viewport.zoom)
    ) {
      const viewportToSave = {
        latitude: viewport.latitude,
        longitude: viewport.longitude,
        zoom: viewport.zoom,
        timestamp: Date.now()
      };
      
      localStorage.setItem('mapViewport', JSON.stringify(viewportToSave));
      
      // Throttled logging to reduce console noise
      if (Math.random() < 0.05) { // Log ~5% of saves
        console.log('Saved map viewport to localStorage:', viewportToSave);
      }
    }
  } catch (error) {
    console.warn('Failed to save map viewport:', error);
  }
};

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

export const useStore = create<Store>((set, get) => ({
  // Initial state
  properties: [],
  persons: [],
  connections: [],
  links: [],
  
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
  
  // Initialize map viewport from localStorage
  mapViewport: loadMapViewportFromStorage(),
  
  filters: defaultFilters,
  personFilters: defaultPersonFilters,
  filteredProperties: [],
  filteredPersons: [],
  
  isLoading: false,
  isLoadingFromCache: false,
  loadingStates: {
    creating: false,
    updating: false,
    deleting: false,
  },
  error: null,
  lastSyncTime: null,
  
  // Basic setters
  setProperties: (properties) => set({ properties }),
  setPersons: (persons) => set({ persons }),
  setConnections: (connections) => set({ connections }),
  setLinks: (links) => set({ links }),
  
  setSelectedProperty: (property) => set({ selectedProperty: property }),
  setSelectedPerson: (person) => set({ selectedPerson: person }),
  
  togglePropertyDetail: (open) => set((state) => ({ 
    isPropertyDetailOpen: open !== undefined ? open : !state.isPropertyDetailOpen 
  })),
  
  togglePersonDetail: (open) => set((state) => ({ 
    isPersonDetailOpen: open !== undefined ? open : !state.isPersonDetailOpen 
  })),
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  setMobileView: (isMobile) => set({ isMobileView: isMobile }),
  
  toggleFilterDrawer: () => set((state) => ({ isFilterDrawerOpen: !state.isFilterDrawerOpen })),
  
  togglePropertyForm: (property) => set((state) => ({
    showPropertyForm: !state.showPropertyForm,
    editingProperty: property || null,
  })),
  
  togglePersonForm: (person) => set((state) => ({
    showPersonForm: !state.showPersonForm,
    editingPerson: person || null,
  })),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Map viewport setter with localStorage persistence
  setMapViewport: (viewport) => {
    set({ mapViewport: viewport });
    // Save to localStorage whenever viewport changes
    saveMapViewportToStorage(viewport);
  },
  
  // Filter actions
  updateFilters: (newFilters) => {
    set((state) => {
      const updatedFilters = { ...state.filters, ...newFilters };
      return { filters: updatedFilters };
    });
    // Apply filters after updating
    setTimeout(() => get().applyFilters(), 0);
  },
  
  updatePersonFilters: (newFilters) => {
    set((state) => {
      const updatedFilters = { ...state.personFilters, ...newFilters };
      return { personFilters: updatedFilters };
    });
    // Apply filters after updating
    setTimeout(() => get().applyPersonFilters(), 0);
  },
  
  resetFilters: () => {
    set({ filters: defaultFilters });
    setTimeout(() => get().applyFilters(), 0);
  },
  
  resetPersonFilters: () => {
    set({ personFilters: defaultPersonFilters });
    setTimeout(() => get().applyPersonFilters(), 0);
  },
  
  applyFilters: () => {
    const { properties, filters } = get();
    
    let filtered = [...properties];
    
    // Apply search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(property => 
        (property.area?.toLowerCase().includes(query)) ||
        (property.zone?.toLowerCase().includes(query)) ||
        (property.description?.toLowerCase().includes(query)) ||
        (property.note?.toLowerCase().includes(query)) ||
        (property.type?.toLowerCase().includes(query)) ||
        property.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Apply zone filter
    if (filters.zone) {
      filtered = filtered.filter(property => property.zone === filters.zone);
    }
    
    // Apply area filter
    if (filters.area) {
      filtered = filtered.filter(property => 
        property.area?.toLowerCase().includes(filters.area!.toLowerCase())
      );
    }
    
    // Apply property type filter
    if (filters.propertyTypes.length > 0) {
      filtered = filtered.filter(property => 
        filters.propertyTypes.includes(property.type || 'Other')
      );
    }
    
    // Apply price range filter
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter(property => {
        return filters.priceRanges.some(([min, max]) => {
          const propertyPrice = property.price_min;
          return propertyPrice >= min && propertyPrice <= max;
        });
      });
    }
    
    // Apply size range filter
    if (filters.sizeRanges.length > 0) {
      filtered = filtered.filter(property => {
        return filters.sizeRanges.some(([min, max]) => {
          const propertySize = property.size_min;
          return propertySize >= min && propertySize <= max;
        });
      });
    }
    
    // Apply rating filter
    if (filters.rating !== undefined) {
      filtered = filtered.filter(property => property.rating >= filters.rating!);
    }
    
    // Apply include tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(property =>
        filters.tags.every(tag => property.tags.includes(tag))
      );
    }
    
    // Apply exclude tags filter
    if (filters.excludedTags.length > 0) {
      filtered = filtered.filter(property =>
        !filters.excludedTags.some(tag => property.tags.includes(tag))
      );
    }
    
    // Apply location status filter
    if (filters.hasLocation !== null) {
      filtered = filtered.filter(property => {
        const hasLocation = property.location.latitude !== DEFAULT_COORDINATES.latitude ||
                           property.location.longitude !== DEFAULT_COORDINATES.longitude;
        return filters.hasLocation ? hasLocation : !hasLocation;
      });
    }
    
    // Apply radius range filter
    if (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000) {
      filtered = filtered.filter(property => {
        const radius = property.radius || 0;
        return radius >= filters.radiusRange[0] && radius <= filters.radiusRange[1];
      });
    }
    
    // Apply sorting
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
          return new Date(a.created_on || 0).getTime() - new Date(b.created_on || 0).getTime();
        case 'newest':
        default:
          return new Date(b.created_on || 0).getTime() - new Date(a.created_on || 0).getTime();
      }
    });
    
    set({ filteredProperties: filtered });
  },
  
  applyPersonFilters: () => {
    const { persons, personFilters, connections, properties } = get();
    
    let filtered = [...persons];
    
    // Apply search query
    if (personFilters.searchQuery) {
      const query = personFilters.searchQuery.toLowerCase();
      filtered = filtered.filter(person => 
        (person.name?.toLowerCase().includes(query)) ||
        (person.phone?.includes(query)) ||
        (person.alternative_contact_details?.includes(query)) ||
        (person.about?.toLowerCase().includes(query)) ||
        (person.role?.toLowerCase().includes(query))
      );
    }
    
    // Apply role filter
    if (personFilters.roles.length > 0) {
      filtered = filtered.filter(person => 
        personFilters.roles.includes(person.role || 'Other Related')
      );
    }
    
    // Apply has properties filter
    if (personFilters.hasProperties !== null) {
      filtered = filtered.filter(person => {
        const hasProperties = connections.some(conn => conn.person_id === person.id);
        return personFilters.hasProperties ? hasProperties : !hasProperties;
      });
    }
    
    set({ filteredPersons: filtered });
  },
  
  // Data loading functions
  loadFromCache: async () => {
    set({ isLoadingFromCache: true, error: null });
    
    try {
      // Load from localStorage
      const cachedProperties = localStorage.getItem('properties');
      const cachedPersons = localStorage.getItem('persons');
      const cachedConnections = localStorage.getItem('connections');
      const cachedLinks = localStorage.getItem('links');
      
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
      
      // Apply filters after loading from cache
      get().applyFilters();
      get().applyPersonFilters();
      
    } catch (error) {
      console.error('Failed to load from cache:', error);
      set({ error: 'Failed to load cached data' });
    } finally {
      set({ isLoadingFromCache: false });
    }
  },
  
  loadAllData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      console.log('Loading all data from API...');
      
      // Use the new API function to get all data efficiently
      const { properties, persons, connections, links } = await extractAllDataFromProperties();
      
      console.log('Loaded data:', {
        properties: properties.length,
        persons: persons.length,
        connections: connections.length,
        links: links.length
      });
      
      // Update state
      set({ 
        properties, 
        persons, 
        connections, 
        links,
        lastSyncTime: Date.now()
      });
      
      // Cache to localStorage
      localStorage.setItem('properties', JSON.stringify(properties));
      localStorage.setItem('persons', JSON.stringify(persons));
      localStorage.setItem('connections', JSON.stringify(connections));
      localStorage.setItem('links', JSON.stringify(links));
      
      // Apply filters
      get().applyFilters();
      get().applyPersonFilters();
      
    } catch (error) {
      console.error('Failed to load all data:', error);
      set({ error: 'Failed to load data from server' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadProperties: async () => {
    const { properties } = get();
    
    // Prevent duplicate loads if we already have data
    if (properties.length > 0) {
      console.log('Properties already loaded, skipping API call');
      get().applyFilters();
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const loadedProperties = await propertyAPI.getAll();
      set({ properties: loadedProperties, lastSyncTime: Date.now() });
      
      // Cache to localStorage
      localStorage.setItem('properties', JSON.stringify(loadedProperties));
      
      // Apply filters
      get().applyFilters();
      
    } catch (error) {
      console.error('Failed to load properties:', error);
      set({ error: 'Failed to load properties' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadPersons: async () => {
    const { persons } = get();
    
    // Prevent duplicate loads if we already have data
    if (persons.length > 0) {
      console.log('Persons already loaded, skipping API call');
      get().applyPersonFilters();
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const loadedPersons = await personAPI.getAll();
      set({ persons: loadedPersons, lastSyncTime: Date.now() });
      
      // Cache to localStorage
      localStorage.setItem('persons', JSON.stringify(loadedPersons));
      
      // Apply filters
      get().applyPersonFilters();
      
    } catch (error) {
      console.error('Failed to load persons:', error);
      set({ error: 'Failed to load persons' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadConnections: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const loadedConnections = await connectionAPI.getAll();
      set({ connections: loadedConnections, lastSyncTime: Date.now() });
      
      // Cache to localStorage
      localStorage.setItem('connections', JSON.stringify(loadedConnections));
      
    } catch (error) {
      console.error('Failed to load connections:', error);
      set({ error: 'Failed to load connections' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadLinks: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const loadedLinks = await linkAPI.getAll();
      set({ links: loadedLinks, lastSyncTime: Date.now() });
      
      // Cache to localStorage
      localStorage.setItem('links', JSON.stringify(loadedLinks));
      
    } catch (error) {
      console.error('Failed to load links:', error);
      set({ error: 'Failed to load links' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  loadPropertyDetails: async (propertyId: number) => {
    try {
      const { property, persons, connections, links } = await propertyAPI.getById(propertyId);
      
      // Update the property in the list
      set((state) => ({
        properties: state.properties.map(p => p.id === propertyId ? property : p)
      }));
      
      // Update related data
      const { persons: currentPersons, connections: currentConnections, links: currentLinks } = get();
      
      // Merge new persons (avoid duplicates)
      const updatedPersons = [...currentPersons];
      persons.forEach(newPerson => {
        const existingIndex = updatedPersons.findIndex(p => p.id === newPerson.id);
        if (existingIndex >= 0) {
          updatedPersons[existingIndex] = newPerson;
        } else {
          updatedPersons.push(newPerson);
        }
      });
      
      // Merge new connections (avoid duplicates)
      const updatedConnections = [...currentConnections];
      connections.forEach(newConnection => {
        const existingIndex = updatedConnections.findIndex(c => c.id === newConnection.id);
        if (existingIndex >= 0) {
          updatedConnections[existingIndex] = newConnection;
        } else {
          updatedConnections.push(newConnection);
        }
      });
      
      // Merge new links (avoid duplicates)
      const updatedLinks = [...currentLinks];
      links.forEach(newLink => {
        const existingIndex = updatedLinks.findIndex(l => l.id === newLink.id);
        if (existingIndex >= 0) {
          updatedLinks[existingIndex] = newLink;
        } else {
          updatedLinks.push(newLink);
        }
      });
      
      set({
        persons: updatedPersons,
        connections: updatedConnections,
        links: updatedLinks
      });
      
    } catch (error) {
      console.error('Failed to load property details:', error);
      throw error;
    }
  },
  
  loadPersonDetails: async (personId: number) => {
    try {
      const { person, properties, connections, links } = await personAPI.getById(personId);
      
      // Update the person in the list
      set((state) => ({
        persons: state.persons.map(p => p.id === personId ? person : p)
      }));
      
      // Update related data
      const { properties: currentProperties, connections: currentConnections, links: currentLinks } = get();
      
      // Merge new properties (avoid duplicates)
      const updatedProperties = [...currentProperties];
      properties.forEach(newProperty => {
        const existingIndex = updatedProperties.findIndex(p => p.id === newProperty.id);
        if (existingIndex >= 0) {
          updatedProperties[existingIndex] = newProperty;
        } else {
          updatedProperties.push(newProperty);
        }
      });
      
      // Merge new connections (avoid duplicates)
      const updatedConnections = [...currentConnections];
      connections.forEach(newConnection => {
        const existingIndex = updatedConnections.findIndex(c => c.id === newConnection.id);
        if (existingIndex >= 0) {
          updatedConnections[existingIndex] = newConnection;
        } else {
          updatedConnections.push(newConnection);
        }
      });
      
      // Merge new links (avoid duplicates)
      const updatedLinks = [...currentLinks];
      links.forEach(newLink => {
        const existingIndex = updatedLinks.findIndex(l => l.id === newLink.id);
        if (existingIndex >= 0) {
          updatedLinks[existingIndex] = newLink;
        } else {
          updatedLinks.push(newLink);
        }
      });
      
      set({
        properties: updatedProperties,
        connections: updatedConnections,
        links: updatedLinks
      });
      
    } catch (error) {
      console.error('Failed to load person details:', error);
      throw error;
    }
  },
  
  refreshData: async () => {
    await get().loadAllData();
  },
  
  // Property CRUD operations
  createProperty: async (property) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await propertyAPI.create(property);
      
      // Reload properties to get the new one with proper ID
      await get().loadProperties();
      
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
      
      // Update the property in the local state
      set((state) => ({
        properties: state.properties.map(p => p.id === property.id ? property : p),
        selectedProperty: state.selectedProperty?.id === property.id ? property : state.selectedProperty
      }));
      
      // Update cache
      const { properties } = get();
      localStorage.setItem('properties', JSON.stringify(properties));
      
      // Reapply filters
      get().applyFilters();
      
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
      
      // Remove from local state
      set((state) => ({
        properties: state.properties.filter(p => p.id !== id),
        selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
        isPropertyDetailOpen: state.selectedProperty?.id === id ? false : state.isPropertyDetailOpen
      }));
      
      // Remove related connections and links
      set((state) => ({
        connections: state.connections.filter(c => c.property_id !== id),
        links: state.links.filter(l => l.property_id !== id)
      }));
      
      // Update cache
      const { properties, connections, links } = get();
      localStorage.setItem('properties', JSON.stringify(properties));
      localStorage.setItem('connections', JSON.stringify(connections));
      localStorage.setItem('links', JSON.stringify(links));
      
      // Reapply filters
      get().applyFilters();
      
    } catch (error) {
      console.error('Failed to delete property:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },
  
  // Person CRUD operations
  createPerson: async (person) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await personAPI.create(person);
      
      // Reload persons to get the new one with proper ID
      await get().loadPersons();
      
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
      
      // Update the person in the local state
      set((state) => ({
        persons: state.persons.map(p => p.id === person.id ? person : p),
        selectedPerson: state.selectedPerson?.id === person.id ? person : state.selectedPerson
      }));
      
      // Update cache
      const { persons } = get();
      localStorage.setItem('persons', JSON.stringify(persons));
      
      // Reapply filters
      get().applyPersonFilters();
      
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
      
      // Remove from local state
      set((state) => ({
        persons: state.persons.filter(p => p.id !== id),
        selectedPerson: state.selectedPerson?.id === id ? null : state.selectedPerson,
        isPersonDetailOpen: state.selectedPerson?.id === id ? false : state.isPersonDetailOpen
      }));
      
      // Remove related connections
      set((state) => ({
        connections: state.connections.filter(c => c.person_id !== id)
      }));
      
      // Update cache
      const { persons, connections } = get();
      localStorage.setItem('persons', JSON.stringify(persons));
      localStorage.setItem('connections', JSON.stringify(connections));
      
      // Reapply filters
      get().applyPersonFilters();
      
    } catch (error) {
      console.error('Failed to delete person:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },
  
  // Connection operations
  createConnection: async (connection) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await connectionAPI.create(connection);
      
      // Add to local state
      const newConnection = { ...connection, id: result.id };
      set((state) => ({
        connections: [...state.connections, newConnection]
      }));
      
      // Update cache
      const { connections } = get();
      localStorage.setItem('connections', JSON.stringify(connections));
      
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
      
      // Remove from local state
      set((state) => ({
        connections: state.connections.filter(c => c.id !== id)
      }));
      
      // Update cache
      const { connections } = get();
      localStorage.setItem('connections', JSON.stringify(connections));
      
    } catch (error) {
      console.error('Failed to delete connection:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
    }
  },
  
  // Link operations
  createLink: async (link) => {
    set((state) => ({ loadingStates: { ...state.loadingStates, creating: true } }));
    
    try {
      const result = await linkAPI.create(link);
      
      // Add to local state
      const newLink = { ...link, id: result.id };
      set((state) => ({
        links: [...state.links, newLink]
      }));
      
      // Update cache
      const { links } = get();
      localStorage.setItem('links', JSON.stringify(links));
      
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
      
      // Update the link in the local state
      set((state) => ({
        links: state.links.map(l => l.id === link.id ? link : l)
      }));
      
      // Update cache
      const { links } = get();
      localStorage.setItem('links', JSON.stringify(links));
      
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
      
      // Remove from local state
      set((state) => ({
        links: state.links.filter(l => l.id !== id)
      }));
      
      // Update cache
      const { links } = get();
      localStorage.setItem('links', JSON.stringify(links));
      
    } catch (error) {
      console.error('Failed to delete link:', error);
      throw error;
    } finally {
      set((state) => ({ loadingStates: { ...state.loadingStates, deleting: false } }));
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
    const { connections } = get();
    return connections.filter(c => c.property_id === propertyId);
  },
  
  getPersonConnections: (personId) => {
    const { connections } = get();
    return connections.filter(c => c.person_id === personId);
  },
  
  getPropertyLinks: (propertyId) => {
    const { links } = get();
    return links.filter(l => l.property_id === propertyId);
  },
  
  getAllTags: () => {
    const { properties } = get();
    const allTags = properties.flatMap(property => property.tags || []);
    return Array.from(new Set(allTags)).sort();
  },
}));