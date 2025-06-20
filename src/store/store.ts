import { create } from "zustand";
import {
  Property,
  Person,
  Connection,
  Link,
  FilterState,
  PersonFilterState,
  MapViewport,
  SortOption,
} from "../types";
import {
  propertyAPI,
  personAPI,
  connectionAPI,
  linkAPI,
  extractAllDataFromProperties,
} from "../utils/api";
import {
  DEFAULT_COORDINATES,
  PRICE_RANGES,
  SIZE_RANGES,
  APP_VERSION,
} from "../constants";

// Helper function to ensure valid location
const ensureValidLocation = (location: any) => {
  if (
    !location ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    isNaN(location.latitude) ||
    isNaN(location.longitude)
  ) {
    return DEFAULT_COORDINATES;
  }
  return location;
};

// Local Storage Keys
const STORAGE_KEYS = {
  PROPERTIES: "pms_properties",
  PERSONS: "pms_persons",
  CONNECTIONS: "pms_connections",
  LINKS: "pms_links",
  PROPERTY_DETAILS: "pms_property_details", // New key for individual property details
  PERSON_DETAILS: "pms_person_details", // New key for individual person details
  LAST_SYNC: "pms_last_sync",
  VERSION: "pms_version",
  FILTERS: "pms_filters",
  PERSON_FILTERS: "pms_person_filters",
};

// Local Storage Helper Functions
const storage = {
  set: (key: string, data: any) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          version: APP_VERSION,
        })
      );
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  },

  get: (key: string) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Check version compatibility
      if (parsed.version !== APP_VERSION) {
        console.log(`Version mismatch for ${key}, clearing cache`);
        localStorage.removeItem(key);
        return null;
      }

      // Check if data is too old (24 hours) - except for filters which should persist longer
      const maxAge = key.includes("filters")
        ? 7 * 24 * 60 * 60 * 1000
        : 24 * 60 * 60 * 1000; // 7 days for filters, 24 hours for data
      if (Date.now() - parsed.timestamp > maxAge) {
        console.log(`Cache expired for ${key}, clearing`);
        localStorage.removeItem(key);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return null;
    }
  },

  clear: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  },

  setLastSync: () => {
    storage.set(STORAGE_KEYS.LAST_SYNC, Date.now());
  },

  getLastSync: (): number => {
    return storage.get(STORAGE_KEYS.LAST_SYNC) || 0;
  },

  // Helper functions for detail caching
  setPropertyDetails: (propertyId: number, details: any) => {
    const allDetails = storage.get(STORAGE_KEYS.PROPERTY_DETAILS) || {};
    allDetails[propertyId] = details;
    storage.set(STORAGE_KEYS.PROPERTY_DETAILS, allDetails);
  },

  getPropertyDetails: (propertyId: number) => {
    const allDetails = storage.get(STORAGE_KEYS.PROPERTY_DETAILS) || {};
    return allDetails[propertyId] || null;
  },

  setPersonDetails: (personId: number, details: any) => {
    const allDetails = storage.get(STORAGE_KEYS.PERSON_DETAILS) || {};
    allDetails[personId] = details;
    storage.set(STORAGE_KEYS.PERSON_DETAILS, allDetails);
  },

  getPersonDetails: (personId: number) => {
    const allDetails = storage.get(STORAGE_KEYS.PERSON_DETAILS) || {};
    return allDetails[personId] || null;
  },

  clearDetailsCaches: () => {
    localStorage.removeItem(STORAGE_KEYS.PROPERTY_DETAILS);
    localStorage.removeItem(STORAGE_KEYS.PERSON_DETAILS);
  },
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
  activeTab: "properties" | "persons";
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

  // Cache state
  isLoadingFromCache: boolean;
  lastSyncTime: number;

  // Data loading flags to prevent duplicate requests
  dataLoadingPromises: {
    properties: Promise<void> | null;
    persons: Promise<void> | null;
    connections: Promise<void> | null;
    links: Promise<void> | null;
    allData: Promise<void> | null;
    propertyDetails: Map<number, Promise<void>>;
    personDetails: Map<number, Promise<void>>;
  };

  // Actions
  setProperties: (properties: Property[]) => void;
  setPersons: (persons: Person[]) => void;
  setConnections: (connections: Connection[]) => void;
  setLinks: (links: Link[]) => void;
  setFilteredProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setSelectedPerson: (person: Person | null) => void;
  setMapViewport: (viewport: Partial<MapViewport>) => void;
  setMobileView: (isMobile: boolean) => void;
  setActiveTab: (tab: "properties" | "persons") => void;
  setIsLiveView: (isLive: boolean) => void;

  // UI Actions
  toggleSidebar: () => void;
  togglePropertyDetail: (open?: boolean) => void;
  togglePersonDetail: (open?: boolean) => void;
  toggleFilterDrawer: () => void;
  togglePropertyForm: (property?: Property) => void;
  togglePersonForm: (person?: Person) => void;

  // Filter Actions
  updateFilters: (newFilters: Partial<FilterState>) => void;
  resetFilters: () => void;
  updatePersonFilters: (newFilters: Partial<PersonFilterState>) => void;
  resetPersonFilters: () => void;

  // Data Actions
  loadFromCache: () => void;
  loadProperties: () => Promise<void>;
  loadPersons: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadLinks: () => Promise<void>;
  loadAllData: () => Promise<void>;
  loadPropertyDetails: (id: number) => Promise<void>;
  loadPersonDetails: (id: number) => Promise<void>;
  refreshData: () => Promise<void>;

  createProperty: (property: Omit<Property, "id">) => Promise<void>;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (id: number) => Promise<void>;

  createPerson: (person: Omit<Person, "id">) => Promise<void>;
  updatePerson: (person: Person) => Promise<void>;
  deletePerson: (id: number) => Promise<void>;

  createConnection: (connection: Omit<Connection, "id">) => Promise<void>;
  deleteConnection: (id: number) => Promise<void>;

  createLink: (link: Omit<Link, "id">) => Promise<void>;
  updateLink: (link: Link) => Promise<void>;
  deleteLink: (id: number) => Promise<void>;

  // Helper functions
  getPropertyPersons: (propertyId: number) => Person[];
  getPropertyLinks: (propertyId: number) => Link[];
  getPersonProperties: (personId: number) => Property[];
  getPersonConnections: (personId: number) => Connection[];
  getAllTags: () => string[];
  applyFilters: () => void;
  applyPersonFilters: () => void;
}

const initialFilters: FilterState = {
  priceRanges: [],
  sizeRanges: [],
  propertyTypes: [],
  searchQuery: "",
  tags: [],
  excludedTags: [],
  rating: undefined,
  sortBy: "newest",
  hasLocation: null,
  radiusRange: [0, 50000],
  zone: undefined,
  area: undefined,
};

const initialPersonFilters: PersonFilterState = {
  searchQuery: "",
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
  // Initial state - Live View set to false by default
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
  activeTab: "properties",
  isLiveView: false,
  mapViewport: initialMapViewport,
  // Load filters from localStorage or use defaults
  filters: storage.get(STORAGE_KEYS.FILTERS) || initialFilters,
  personFilters:
    storage.get(STORAGE_KEYS.PERSON_FILTERS) || initialPersonFilters,
  loadingStates: initialLoadingStates,
  isLoading: false,
  error: null,
  isLoadingFromCache: false,
  lastSyncTime: 0,
  dataLoadingPromises: {
    properties: null,
    persons: null,
    connections: null,
    links: null,
    allData: null,
    propertyDetails: new Map(),
    personDetails: new Map(),
  },

  // Load data from cache immediately
  loadFromCache: () => {
    console.log("Loading data from cache...");
    set({ isLoadingFromCache: true });

    const cachedProperties = storage.get(STORAGE_KEYS.PROPERTIES);
    const cachedPersons = storage.get(STORAGE_KEYS.PERSONS);
    const cachedConnections = storage.get(STORAGE_KEYS.CONNECTIONS);
    const cachedLinks = storage.get(STORAGE_KEYS.LINKS);
    const lastSync = storage.getLastSync();

    if (cachedProperties || cachedPersons || cachedConnections || cachedLinks) {
      console.log("Found cached data:", {
        properties: cachedProperties?.length || 0,
        persons: cachedPersons?.length || 0,
        connections: cachedConnections?.length || 0,
        links: cachedLinks?.length || 0,
        lastSync: new Date(lastSync).toLocaleString(),
      });

      // Validate cached properties
      const validatedProperties = (cachedProperties || []).map(
        (property: Property) => ({
          ...property,
          location: ensureValidLocation(property.location),
        })
      );

      set({
        properties: validatedProperties,
        persons: cachedPersons || [],
        connections: cachedConnections || [],
        links: cachedLinks || [],
        lastSyncTime: lastSync,
        isLoadingFromCache: false,
      });

      // Apply filters to cached data
      get().applyFilters();
      get().applyPersonFilters();
    } else {
      console.log("No cached data found");
      set({ isLoadingFromCache: false });
    }
  },

  // Setters with cache updates and improved filtering
  setProperties: (properties) => {
    console.log("Setting properties:", properties.length);
    set({ properties });
    storage.set(STORAGE_KEYS.PROPERTIES, properties);

    // Apply filters immediately after setting properties
    setTimeout(() => {
      get().applyFilters();
    }, 0);
  },

  setPersons: (persons) => {
    console.log("Setting persons:", persons.length);
    set({ persons });
    storage.set(STORAGE_KEYS.PERSONS, persons);

    // Apply person filters immediately after setting persons
    setTimeout(() => {
      console.log("Applying person filters after setting persons...");
      get().applyPersonFilters();
    }, 0);
  },

  setConnections: (connections) => {
    set({ connections });
    storage.set(STORAGE_KEYS.CONNECTIONS, connections);
  },

  setLinks: (links) => {
    set({ links });
    storage.set(STORAGE_KEYS.LINKS, links);
  },

  setFilteredProperties: (filteredProperties) => set({ filteredProperties }),

  setSelectedProperty: (property) => set({ selectedProperty: property }),
  setSelectedPerson: (person) => set({ selectedPerson: person }),

  setMapViewport: (viewport) => {
    const currentViewport = get().mapViewport;

    if (viewport.bounds) {
      let boundsObj;
      if (typeof viewport.bounds.getNorth === "function") {
        boundsObj = {
          north: viewport.bounds.getNorth(),
          south: viewport.bounds.getSouth(),
          east: viewport.bounds.getEast(),
          west: viewport.bounds.getWest(),
        };
      } else {
        boundsObj = viewport.bounds;
      }

      set({
        mapViewport: {
          ...currentViewport,
          ...viewport,
          bounds: boundsObj,
        },
      });
    } else {
      const { bounds, ...viewportWithoutBounds } = viewport;
      set({
        mapViewport: {
          ...currentViewport,
          ...viewportWithoutBounds,
        },
      });
    }
  },

  setMobileView: (isMobile) => set({ isMobileView: isMobile }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setIsLiveView: (isLive) => set({ isLiveView: isLive }),

  // UI Actions
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  togglePropertyDetail: (open) =>
    set((state) => ({
      isPropertyDetailOpen:
        open !== undefined ? open : !state.isPropertyDetailOpen,
    })),

  togglePersonDetail: (open) =>
    set((state) => ({
      isPersonDetailOpen: open !== undefined ? open : !state.isPersonDetailOpen,
    })),

  toggleFilterDrawer: () =>
    set((state) => ({ isFilterDrawerOpen: !state.isFilterDrawerOpen })),

  togglePropertyForm: (property) =>
    set((state) => ({
      showPropertyForm: !state.showPropertyForm,
      editingProperty: property || null,
    })),

  togglePersonForm: (person) =>
    set((state) => ({
      showPersonForm: !state.showPersonForm,
      editingPerson: person || null,
    })),

  // Filter Actions - Updated to persist filters
  updateFilters: (newFilters) => {
    const updatedFilters = { ...get().filters, ...newFilters };
    set({ filters: updatedFilters });

    // Save filters to localStorage
    storage.set(STORAGE_KEYS.FILTERS, updatedFilters);

    // Apply filters
    get().applyFilters();
  },

  resetFilters: () => {
    set({ filters: initialFilters });

    // Clear filters from localStorage
    localStorage.removeItem(STORAGE_KEYS.FILTERS);

    get().applyFilters();
  },

  updatePersonFilters: (newFilters) => {
    console.log("Updating person filters:", newFilters);
    const updatedFilters = { ...get().personFilters, ...newFilters };
    set({ personFilters: updatedFilters });

    // Save person filters to localStorage
    storage.set(STORAGE_KEYS.PERSON_FILTERS, updatedFilters);

    get().applyPersonFilters();
  },

  resetPersonFilters: () => {
    console.log("Resetting person filters");
    set({ personFilters: initialPersonFilters });

    // Clear person filters from localStorage
    localStorage.removeItem(STORAGE_KEYS.PERSON_FILTERS);

    get().applyPersonFilters();
  },

  // Refresh data from API
  refreshData: async () => {
    console.log("Refreshing data from API...");

    // Clear existing promises to force fresh requests
    set({
      dataLoadingPromises: {
        properties: null,
        persons: null,
        connections: null,
        links: null,
        allData: null,
        propertyDetails: new Map(),
        personDetails: new Map(),
      },
    });

    // Clear detail caches when refreshing
    storage.clearDetailsCaches();

    try {
      await get().loadAllData();
      storage.setLastSync();
      set({ lastSyncTime: Date.now() });
      console.log("Data refresh completed");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  },

  // Data loading actions with deduplication and caching
  loadProperties: async () => {
    const state = get();

    if (state.dataLoadingPromises.properties) {
      console.log("Properties already loading, returning existing promise");
      return state.dataLoadingPromises.properties;
    }

    if (state.properties.length > 0 && !state.loadingStates.properties) {
      console.log("Properties already loaded, skipping");
      return Promise.resolve();
    }

    console.log("Starting properties load...");

    const loadPromise = (async () => {
      set((state) => ({
        loadingStates: { ...state.loadingStates, properties: true },
        isLoading: true,
        error: null,
      }));

      try {
        const properties = await propertyAPI.getAll();
        console.log("Loaded properties:", properties.length);

        const validatedProperties = properties.map((property) => ({
          ...property,
          location: ensureValidLocation(property.location),
        }));

        get().setProperties(validatedProperties);
      } catch (error) {
        console.error("Failed to load properties:", error);
        set({ error: "Failed to load properties" });
      } finally {
        set((state) => ({
          loadingStates: { ...state.loadingStates, properties: false },
          isLoading: false,
          dataLoadingPromises: {
            ...state.dataLoadingPromises,
            properties: null,
          },
        }));
      }
    })();

    set((state) => ({
      dataLoadingPromises: {
        ...state.dataLoadingPromises,
        properties: loadPromise,
      },
    }));

    return loadPromise;
  },

  loadPersons: async () => {
    const state = get();

    if (state.dataLoadingPromises.persons) {
      console.log("Persons already loading, returning existing promise");
      return state.dataLoadingPromises.persons;
    }

    if (state.persons.length > 0 && !state.loadingStates.persons) {
      console.log("Persons already loaded, skipping");
      return Promise.resolve();
    }

    console.log("Starting persons load...");

    const loadPromise = (async () => {
      set((state) => ({
        loadingStates: { ...state.loadingStates, persons: true },
        isLoading: true,
        error: null,
      }));

      try {
        const persons = await personAPI.getAll();
        console.log("Loaded persons from API:", persons.length);
        get().setPersons(persons);
      } catch (error) {
        console.error("Failed to load persons:", error);
        set({ error: "Failed to load persons" });
      } finally {
        set((state) => ({
          loadingStates: { ...state.loadingStates, persons: false },
          isLoading: false,
          dataLoadingPromises: { ...state.dataLoadingPromises, persons: null },
        }));
      }
    })();

    set((state) => ({
      dataLoadingPromises: {
        ...state.dataLoadingPromises,
        persons: loadPromise,
      },
    }));

    return loadPromise;
  },

  loadConnections: async () => {
    const state = get();

    if (state.dataLoadingPromises.connections) {
      console.log("Connections already loading, returning existing promise");
      return state.dataLoadingPromises.connections;
    }

    if (state.connections.length > 0 && !state.loadingStates.connections) {
      console.log("Connections already loaded, skipping");
      return Promise.resolve();
    }

    console.log("Starting connections load...");

    const loadPromise = (async () => {
      set((state) => ({
        loadingStates: { ...state.loadingStates, connections: true },
      }));

      try {
        const connections = await connectionAPI.getAll();
        console.log("Loaded connections:", connections.length);
        get().setConnections(connections);
      } catch (error) {
        console.error("Failed to load connections:", error);
        set({ error: "Failed to load connections" });
      } finally {
        set((state) => ({
          loadingStates: { ...state.loadingStates, connections: false },
          dataLoadingPromises: {
            ...state.dataLoadingPromises,
            connections: null,
          },
        }));
      }
    })();

    set((state) => ({
      dataLoadingPromises: {
        ...state.dataLoadingPromises,
        connections: loadPromise,
      },
    }));

    return loadPromise;
  },

  loadLinks: async () => {
    const state = get();

    if (state.dataLoadingPromises.links) {
      console.log("Links already loading, returning existing promise");
      return state.dataLoadingPromises.links;
    }

    if (state.links.length > 0 && !state.loadingStates.links) {
      console.log("Links already loaded, skipping");
      return Promise.resolve();
    }

    console.log("Starting links load...");

    const loadPromise = (async () => {
      set((state) => ({
        loadingStates: { ...state.loadingStates, links: true },
      }));

      try {
        const links = await linkAPI.getAll();
        console.log("Loaded links:", links.length);
        get().setLinks(links);
      } catch (error) {
        console.error("Failed to load links:", error);
        set({ error: "Failed to load links" });
      } finally {
        set((state) => ({
          loadingStates: { ...state.loadingStates, links: false },
          dataLoadingPromises: { ...state.dataLoadingPromises, links: null },
        }));
      }
    })();

    set((state) => ({
      dataLoadingPromises: { ...state.dataLoadingPromises, links: loadPromise },
    }));

    return loadPromise;
  },

  loadAllData: async () => {
    const state = get();

    if (state.dataLoadingPromises.allData) {
      console.log("All data already loading, returning existing promise");
      return state.dataLoadingPromises.allData;
    }

    console.log("Loading all data from API...");

    const loadPromise = (async () => {
      set({ isLoading: true, error: null });

      try {
        const { properties, persons, connections, links } =
          await extractAllDataFromProperties();

        console.log("Loaded all data:", {
          properties: properties.length,
          persons: persons.length,
          connections: connections.length,
          links: links.length,
        });

        const validatedProperties = properties.map((property) => ({
          ...property,
          location: ensureValidLocation(property.location),
        }));

        // Update all data at once
        get().setProperties(validatedProperties);
        get().setPersons(persons);
        get().setConnections(connections);
        get().setLinks(links);

        console.log("All data loaded successfully");
      } catch (error) {
        console.error("Failed to load all data:", error);
        set({ error: "Failed to load data" });
      } finally {
        set((state) => ({
          isLoading: false,
          dataLoadingPromises: { ...state.dataLoadingPromises, allData: null },
        }));
      }
    })();

    set((state) => ({
      dataLoadingPromises: {
        ...state.dataLoadingPromises,
        allData: loadPromise,
      },
    }));

    return loadPromise;
  },

  // Load detailed data for a specific property with caching
  loadPropertyDetails: async (id: number) => {
    const state = get();

    // Check if already loading
    if (state.dataLoadingPromises.propertyDetails.has(id)) {
      console.log(`Property ${id} details already loading, returning existing promise`);
      return state.dataLoadingPromises.propertyDetails.get(id)!;
    }

    // Check cache first
    const cachedDetails = storage.getPropertyDetails(id);
    if (cachedDetails) {
      console.log(`Property ${id} details found in cache`);
      
      // Update the property in the store with cached data
      const validatedProperty = {
        ...cachedDetails.property,
        location: ensureValidLocation(cachedDetails.property.location),
      };

      set((state) => {
        const updatedProperties = state.properties.map((p) =>
          p.id === id ? validatedProperty : p
        );

        // Merge cached persons, connections, and links
        const existingPersonIds = new Set(state.persons.map((p) => p.id));
        const newPersons = cachedDetails.persons.filter((p: Person) => !existingPersonIds.has(p.id));

        const updatedPersons = [...state.persons, ...newPersons];
        const updatedConnections = [
          ...state.connections.filter((c) => c.property_id !== id),
          ...cachedDetails.connections,
        ];
        const updatedLinks = [
          ...state.links.filter((l) => l.property_id !== id),
          ...cachedDetails.links,
        ];

        return {
          properties: updatedProperties,
          persons: updatedPersons,
          connections: updatedConnections,
          links: updatedLinks,
          selectedProperty: validatedProperty,
        };
      });

      get().applyFilters();
      get().applyPersonFilters();
      return Promise.resolve();
    }

    console.log(`Loading property ${id} details from API...`);

    const loadPromise = (async () => {
      try {
        const { property, persons, connections, links } =
          await propertyAPI.getById(id);

        // Cache the details
        storage.setPropertyDetails(id, { property, persons, connections, links });

        // Update the property in the store with validated location
        const validatedProperty = {
          ...property,
          location: ensureValidLocation(property.location),
        };

        set((state) => {
          const updatedProperties = state.properties.map((p) =>
            p.id === id ? validatedProperty : p
          );

          // Merge new persons, connections, and links
          const existingPersonIds = new Set(state.persons.map((p) => p.id));
          const newPersons = persons.filter((p) => !existingPersonIds.has(p.id));

          const updatedPersons = [...state.persons, ...newPersons];
          const updatedConnections = [
            ...state.connections.filter((c) => c.property_id !== id),
            ...connections,
          ];
          const updatedLinks = [
            ...state.links.filter((l) => l.property_id !== id),
            ...links,
          ];

          // Update cache
          storage.set(STORAGE_KEYS.PROPERTIES, updatedProperties);
          storage.set(STORAGE_KEYS.PERSONS, updatedPersons);
          storage.set(STORAGE_KEYS.CONNECTIONS, updatedConnections);
          storage.set(STORAGE_KEYS.LINKS, updatedLinks);

          return {
            properties: updatedProperties,
            persons: updatedPersons,
            connections: updatedConnections,
            links: updatedLinks,
            selectedProperty: validatedProperty,
          };
        });

        get().applyFilters();
        get().applyPersonFilters();
        
        console.log(`Property ${id} details loaded and cached successfully`);
      } catch (error) {
        console.error("Failed to load property details:", error);
        throw error;
      } finally {
        // Remove from loading promises
        set((state) => {
          const newMap = new Map(state.dataLoadingPromises.propertyDetails);
          newMap.delete(id);
          return {
            dataLoadingPromises: {
              ...state.dataLoadingPromises,
              propertyDetails: newMap,
            },
          };
        });
      }
    })();

    // Add to loading promises
    set((state) => {
      const newMap = new Map(state.dataLoadingPromises.propertyDetails);
      newMap.set(id, loadPromise);
      return {
        dataLoadingPromises: {
          ...state.dataLoadingPromises,
          propertyDetails: newMap,
        },
      };
    });

    return loadPromise;
  },

  // Load detailed data for a specific person with caching
  loadPersonDetails: async (id: number) => {
    const state = get();

    // Check if already loading
    if (state.dataLoadingPromises.personDetails.has(id)) {
      console.log(`Person ${id} details already loading, returning existing promise`);
      return state.dataLoadingPromises.personDetails.get(id)!;
    }

    // Check cache first
    const cachedDetails = storage.getPersonDetails(id);
    if (cachedDetails) {
      console.log(`Person ${id} details found in cache`);
      
      // Update the person in the store with cached data
      set((state) => {
        const updatedPersons = state.persons.map((p) =>
          p.id === id ? cachedDetails.person : p
        );

        // Merge cached properties, connections, and links
        const existingPropertyIds = new Set(state.properties.map((p) => p.id));
        const newProperties = cachedDetails.properties
          .filter((p: Property) => !existingPropertyIds.has(p.id))
          .map((property: Property) => ({
            ...property,
            location: ensureValidLocation(property.location),
          }));

        const updatedProperties = [...state.properties, ...newProperties];
        const updatedConnections = [
          ...state.connections.filter((c) => c.person_id !== id),
          ...cachedDetails.connections,
        ];
        const updatedLinks = [
          ...state.links,
          ...cachedDetails.links.filter(
            (l: Link) => !state.links.some((existing) => existing.id === l.id)
          ),
        ];

        return {
          persons: updatedPersons,
          properties: updatedProperties,
          connections: updatedConnections,
          links: updatedLinks,
          selectedPerson: cachedDetails.person,
        };
      });

      get().applyFilters();
      get().applyPersonFilters();
      return Promise.resolve();
    }

    console.log(`Loading person ${id} details from API...`);

    const loadPromise = (async () => {
      try {
        const { person, properties, connections, links } =
          await personAPI.getById(id);

        // Cache the details
        storage.setPersonDetails(id, { person, properties, connections, links });

        // Update the person in the store
        set((state) => {
          const updatedPersons = state.persons.map((p) =>
            p.id === id ? person : p
          );

          // Merge new properties, connections, and links
          const existingPropertyIds = new Set(state.properties.map((p) => p.id));
          const newProperties = properties
            .filter((p) => !existingPropertyIds.has(p.id))
            .map((property) => ({
              ...property,
              location: ensureValidLocation(property.location),
            }));

          const updatedProperties = [...state.properties, ...newProperties];
          const updatedConnections = [
            ...state.connections.filter((c) => c.person_id !== id),
            ...connections,
          ];
          const updatedLinks = [
            ...state.links,
            ...links.filter(
              (l) => !state.links.some((existing) => existing.id === l.id)
            ),
          ];

          // Update cache
          storage.set(STORAGE_KEYS.PERSONS, updatedPersons);
          storage.set(STORAGE_KEYS.PROPERTIES, updatedProperties);
          storage.set(STORAGE_KEYS.CONNECTIONS, updatedConnections);
          storage.set(STORAGE_KEYS.LINKS, updatedLinks);

          return {
            persons: updatedPersons,
            properties: updatedProperties,
            connections: updatedConnections,
            links: updatedLinks,
            selectedPerson: person,
          };
        });

        get().applyFilters();
        get().applyPersonFilters();
        
        console.log(`Person ${id} details loaded and cached successfully`);
      } catch (error) {
        console.error("Failed to load person details:", error);
        throw error;
      } finally {
        // Remove from loading promises
        set((state) => {
          const newMap = new Map(state.dataLoadingPromises.personDetails);
          newMap.delete(id);
          return {
            dataLoadingPromises: {
              ...state.dataLoadingPromises,
              personDetails: newMap,
            },
          };
        });
      }
    })();

    // Add to loading promises
    set((state) => {
      const newMap = new Map(state.dataLoadingPromises.personDetails);
      newMap.set(id, loadPromise);
      return {
        dataLoadingPromises: {
          ...state.dataLoadingPromises,
          personDetails: newMap,
        },
      };
    });

    return loadPromise;
  },

  // Property CRUD with immediate state updates
  createProperty: async (propertyData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await propertyAPI.create(propertyData);
      if (result.success) {
        // Optimistically add the new property to the state
        const newProperty = {
          ...propertyData,
          id: result.id,
          location: ensureValidLocation(propertyData.location),
        } as Property;

        set((state) => {
          const updatedProperties = [...state.properties, newProperty];
          storage.set(STORAGE_KEYS.PROPERTIES, updatedProperties);
          return { properties: updatedProperties };
        });

        get().applyFilters();

        // Refresh data in background to ensure consistency
        setTimeout(() => get().refreshData(), 1000);
      }
    } catch (error) {
      console.error("Failed to create property:", error);
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
        set((state) => {
          const updatedProperties = state.properties.map((p) =>
            p.id === property.id ? property : p
          );

          storage.set(STORAGE_KEYS.PROPERTIES, updatedProperties);

          return {
            properties: updatedProperties,
            selectedProperty:
              state.selectedProperty?.id === property.id
                ? property
                : state.selectedProperty,
          };
        });
        get().applyFilters();
      }
    } catch (error) {
      console.error("Failed to update property:", error);
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
      await connectionAPI.deleteByPropertyId(id);
      await linkAPI.deleteByPropertyId(id);

      const result = await propertyAPI.delete(id);
      if (result.success) {
        set((state) => {
          const updatedProperties = state.properties.filter((p) => p.id !== id);
          const updatedConnections = state.connections.filter(
            (c) => c.property_id !== id
          );
          const updatedLinks = state.links.filter((l) => l.property_id !== id);

          // Update cache
          storage.set(STORAGE_KEYS.PROPERTIES, updatedProperties);
          storage.set(STORAGE_KEYS.CONNECTIONS, updatedConnections);
          storage.set(STORAGE_KEYS.LINKS, updatedLinks);

          return {
            properties: updatedProperties,
            connections: updatedConnections,
            links: updatedLinks,
            selectedProperty:
              state.selectedProperty?.id === id ? null : state.selectedProperty,
            isPropertyDetailOpen:
              state.selectedProperty?.id === id
                ? false
                : state.isPropertyDetailOpen,
          };
        });
        get().applyFilters();
      }
    } catch (error) {
      console.error("Failed to delete property:", error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Person CRUD with immediate state updates
  createPerson: async (personData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await personAPI.create(personData);
      if (result.success) {
        // Optimistically add the new person to the state
        const newPerson = {
          ...personData,
          id: result.id,
        } as Person;

        set((state) => {
          const updatedPersons = [...state.persons, newPerson];
          storage.set(STORAGE_KEYS.PERSONS, updatedPersons);
          return { persons: updatedPersons };
        });

        get().applyPersonFilters();

        // Refresh data in background to ensure consistency
        setTimeout(() => get().refreshData(), 1000);
      }
    } catch (error) {
      console.error("Failed to create person:", error);
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
        set((state) => {
          const updatedPersons = state.persons.map((p) =>
            p.id === person.id ? person : p
          );
          storage.set(STORAGE_KEYS.PERSONS, updatedPersons);

          return {
            persons: updatedPersons,
            selectedPerson:
              state.selectedPerson?.id === person.id
                ? person
                : state.selectedPerson,
          };
        });
        get().applyPersonFilters();
      }
    } catch (error) {
      console.error("Failed to update person:", error);
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
      await connectionAPI.deleteByPersonId(id);

      const result = await personAPI.delete(id);
      if (result.success) {
        set((state) => {
          const updatedPersons = state.persons.filter((p) => p.id !== id);
          const updatedConnections = state.connections.filter(
            (c) => c.person_id !== id
          );

          storage.set(STORAGE_KEYS.PERSONS, updatedPersons);
          storage.set(STORAGE_KEYS.CONNECTIONS, updatedConnections);

          return {
            persons: updatedPersons,
            connections: updatedConnections,
            selectedPerson:
              state.selectedPerson?.id === id ? null : state.selectedPerson,
            isPersonDetailOpen:
              state.selectedPerson?.id === id
                ? false
                : state.isPersonDetailOpen,
          };
        });
        get().applyPersonFilters();
      }
    } catch (error) {
      console.error("Failed to delete person:", error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Connection CRUD with immediate state updates
  createConnection: async (connectionData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await connectionAPI.create(connectionData);
      if (result.success) {
        // Optimistically add the new connection to the state
        const newConnection = {
          ...connectionData,
          id: result.id,
        } as Connection;

        set((state) => {
          const updatedConnections = [...state.connections, newConnection];
          storage.set(STORAGE_KEYS.CONNECTIONS, updatedConnections);
          return { connections: updatedConnections };
        });

        // Refresh data in background to ensure consistency
        setTimeout(() => get().refreshData(), 1000);
      }
    } catch (error) {
      console.error("Failed to create connection:", error);
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
        set((state) => {
          const updatedConnections = state.connections.filter(
            (c) => c.id !== id
          );
          storage.set(STORAGE_KEYS.CONNECTIONS, updatedConnections);
          return { connections: updatedConnections };
        });
      }
    } catch (error) {
      console.error("Failed to delete connection:", error);
      throw error;
    } finally {
      set((state) => ({
        loadingStates: { ...state.loadingStates, deleting: false },
      }));
    }
  },

  // Link CRUD with immediate state updates
  createLink: async (linkData) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, creating: true },
    }));

    try {
      const result = await linkAPI.create(linkData);
      if (result.success) {
        // Optimistically add the new link to the state
        const newLink = {
          ...linkData,
          id: result.id,
        } as Link;

        set((state) => {
          const updatedLinks = [...state.links, newLink];
          storage.set(STORAGE_KEYS.LINKS, updatedLinks);
          return { links: updatedLinks };
        });

        // Refresh data in background to ensure consistency
        setTimeout(() => get().refreshData(), 1000);
      }
    } catch (error) {
      console.error("Failed to create link:", error);
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
        set((state) => {
          const updatedLinks = state.links.map((l) =>
            l.id === link.id ? link : l
          );
          storage.set(STORAGE_KEYS.LINKS, updatedLinks);
          return { links: updatedLinks };
        });
      }
    } catch (error) {
      console.error("Failed to update link:", error);
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
        set((state) => {
          const updatedLinks = state.links.filter((l) => l.id !== id);
          storage.set(STORAGE_KEYS.LINKS, updatedLinks);
          return { links: updatedLinks };
        });
      }
    } catch (error) {
      console.error("Failed to delete link:", error);
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
    const propertyConnections = state.connections.filter(
      (c) => c.property_id === propertyId
    );
    return propertyConnections
      .map((connection) =>
        state.persons.find((person) => person.id === connection.person_id)
      )
      .filter(Boolean) as Person[];
  },

  getPropertyLinks: (propertyId) => {
    const state = get();
    return state.links.filter((link) => link.property_id === propertyId);
  },

  getPersonProperties: (personId) => {
    const state = get();
    const personConnections = state.connections.filter(
      (c) => c.person_id === personId
    );
    return personConnections
      .map((connection) =>
        state.properties.find(
          (property) => property.id === connection.property_id
        )
      )
      .filter(Boolean) as Property[];
  },

  getPersonConnections: (personId) => {
    const state = get();
    return state.connections.filter((c) => c.person_id === personId);
  },

  getAllTags: () => {
    const state = get();
    const allTags = state.properties.flatMap((property) => property.tags || []);
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
      filtered = filtered.filter((property) => {
        // Search in property fields
        const propertyMatch =
          property.area?.toLowerCase().includes(query) ||
          property.zone?.toLowerCase().includes(query) ||
          property.type?.toLowerCase().includes(query) ||
          property.description?.toLowerCase().includes(query) ||
          property.note?.toLowerCase().includes(query) ||
          property.tags?.some((tag) => tag.toLowerCase().includes(query));

        // Search in connected persons
        const propertyConnections = connections.filter(
          (c) => c.property_id === property.id
        );
        const connectedPersons = propertyConnections
          .map((conn) => persons.find((person) => person.id === conn.person_id))
          .filter(Boolean);

        const personMatch = connectedPersons.some(
          (person) =>
            person?.name?.toLowerCase().includes(query) ||
            person?.phone?.includes(query) ||
            person?.alternative_contact_details?.includes(query) ||
            person?.role?.toLowerCase().includes(query) ||
            person?.about?.toLowerCase().includes(query)
        );

        // Search in connection details
        const connectionMatch = propertyConnections.some(
          (conn) =>
            conn.role?.toLowerCase().includes(query) ||
            conn.remark?.toLowerCase().includes(query)
        );

        return propertyMatch || personMatch || connectionMatch;
      });
    }

    // Zone filter
    if (filters.zone && filters.zone.trim()) {
      filtered = filtered.filter((property) => property.zone === filters.zone);
    }

    // Area filter
    if (filters.area && filters.area.trim()) {
      const areaQuery = filters.area.toLowerCase().trim();
      filtered = filtered.filter((property) =>
        property.area?.toLowerCase().includes(areaQuery)
      );
    }

    // Property type filter
    if (filters.propertyTypes.length > 0) {
      filtered = filtered.filter((property) =>
        filters.propertyTypes.includes(property.type!)
      );
    }

    // Price range filter - Multiple ranges support
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter((property) => {
        return filters.priceRanges.some(([min, max]) => {
          const propertyMin = property.price_min;
          const propertyMax = property.price_max;

          return propertyMin <= max && propertyMax >= min;
        });
      });
    }

    // Size range filter - Multiple ranges support
    if (filters.sizeRanges.length > 0) {
      filtered = filtered.filter((property) => {
        return filters.sizeRanges.some(([min, max]) => {
          const propertyMin = property.size_min;
          const propertyMax = property.size_max;

          return propertyMin <= max && propertyMax >= min;
        });
      });
    }

    // Rating filter
    if (filters.rating !== undefined) {
      filtered = filtered.filter(
        (property) => property.rating >= filters.rating!
      );
    }

    // Tags filter (include)
    if (filters.tags.length > 0) {
      filtered = filtered.filter((property) =>
        filters.tags.some((tag) => property.tags.includes(tag))
      );
    }

    // Excluded tags filter
    if (filters.excludedTags.length > 0) {
      filtered = filtered.filter(
        (property) =>
          !filters.excludedTags.some((tag) => property.tags.includes(tag))
      );
    }

    // Location status filter
    if (filters.hasLocation !== null) {
      filtered = filtered.filter((property) => {
        const hasValidLocation =
          property.location.latitude !== DEFAULT_COORDINATES.latitude ||
          property.location.longitude !== DEFAULT_COORDINATES.longitude;

        return filters.hasLocation ? hasValidLocation : !hasValidLocation;
      });
    }

    // Radius range filter
    if (
      filters.radiusRange &&
      (filters.radiusRange[0] > 0 || filters.radiusRange[1] < 50000)
    ) {
      filtered = filtered.filter((property) => {
        const radius = property.radius || 0;
        return (
          radius >= filters.radiusRange[0] && radius <= filters.radiusRange[1]
        );
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc":
          return a.price_min - b.price_min;
        case "price_desc":
          return b.price_min - a.price_min;
        case "size_asc":
          return a.size_min - b.size_min;
        case "size_desc":
          return b.size_min - a.size_min;
        case "rating_desc":
          return (b.rating || 0) - (a.rating || 0);
        case "oldest":
          return a.id - b.id;
        case "newest":
        default:
          return b.id - a.id;
      }
    });

    set({ filteredProperties: filtered });
  },

  applyPersonFilters: () => {
    const state = get();
    const { persons, personFilters, connections } = state;

    console.log("Applying person filters:", {
      totalPersons: persons.length,
      filters: personFilters,
      connections: connections.length,
    });

    let filtered = [...persons];

    // Search query filter
    if (personFilters.searchQuery && personFilters.searchQuery.trim()) {
      const query = personFilters.searchQuery.toLowerCase().trim();
      console.log("Applying search filter:", query);

      filtered = filtered.filter(
        (person) =>
          person.name?.toLowerCase().includes(query) ||
          person.phone?.includes(query) ||
          person.alternative_contact_details?.includes(query) ||
          person.role?.toLowerCase().includes(query) ||
          person.about?.toLowerCase().includes(query)
      );

      console.log("After search filter:", filtered.length);
    }

    // Role filter
    if (personFilters.roles.length > 0) {
      console.log("Applying role filter:", personFilters.roles);

      filtered = filtered.filter((person) =>
        personFilters.roles.includes(person.role!)
      );

      console.log("After role filter:", filtered.length);
    }

    // Has properties filter
    if (personFilters.hasProperties !== null) {
      console.log(
        "Applying hasProperties filter:",
        personFilters.hasProperties
      );

      filtered = filtered.filter((person) => {
        const hasProperties = connections.some(
          (conn) => conn.person_id === person.id
        );
        return personFilters.hasProperties ? hasProperties : !hasProperties;
      });

      console.log("After hasProperties filter:", filtered.length);
    }

    console.log("Final filtered persons:", filtered.length);
    set({ filteredPersons: filtered });
  },
}));