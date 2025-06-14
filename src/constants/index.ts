// Property Types - Single selection only
export const PROPERTY_TYPES = [
  "Plot Residential",
  "Shop",
  "House",
  "Colony",
  "Flats",
  "Agriculture Land",
  "Free Zone Land",
  "Godown",
  "Factory",
  "Big Commercial",
  "Plot Industrial",
  "Other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

// Person Roles
export const PERSON_ROLES = [
  "Owner",
  "Dealer",
  "Developer",
  "Affiliate",
  "Padosi",
  "Devloper",
  "Other Related",
] as const;

export type PersonRole = (typeof PERSON_ROLES)[number];

// Connection Roles
export const CONNECTION_ROLES = [
  "Owner",
  "Dealer",
  "Developer",
  "Affiliate",
  "Padosi",
  "Devloper",
  "Other Related",
] as const;

export type ConnectionRole = (typeof CONNECTION_ROLES)[number];

// Link Types
export const LINK_TYPES = [
  "Website",
  "Social Media",
  "Document",
  "Image",
  "Video",
  "Map",
  "Other",
] as const;

export type LinkType = (typeof LINK_TYPES)[number];

// Suggested Tags for Properties
export const SUGGESTED_TAGS = [
  "corner plot",
  "main road",
  "gated community",
  "near hospital",
  "near market",
  "water supply",
  "electricity",
  "park facing",
  "east facing",
  "west facing",
  "prime location",
] as const;

// Enhanced Property Type Icons (using available Lucide React icon names)
export const PROPERTY_TYPE_ICONS = {
  "Plot Residential": "LandPlot",
  Shop: "Store",
  House: "Home", // Changed from 'House' to 'Home' which is available
  Colony: "Building2",
  Flats: "Building",
  "Agriculture Land": "Wheat",
  "Free Zone Land": "TreePine",
  Godown: "Warehouse",
  Factory: "Factory",
  "Big Commercial": "Building",
  "Plot Industrial": "Grid2x2Check",
  Other: "MapPin", // Changed from 'MapPinHouse' to 'MapPin' which is available
} as const;

// Enhanced Property Type Colors for Map Markers with better contrast
export const PROPERTY_TYPE_COLORS = {
  "Plot Residential": "#2563EB", // Blue-600 - Residential properties
  Shop: "#059669", // Emerald-600 - Commercial shops
  House: "#7C3AED", // Violet-600 - Individual houses
  Colony: "#DC2626", // Red-600 - Housing colonies
  Flats: "#EA580C", // Orange-600 - Apartment buildings
  "Agriculture Land": "#65A30D", // Lime-600 - Agricultural land
  "Free Zone Land": "#0891B2", // Cyan-600 - Special zones
  Godown: "#6B7280", // Gray-500 - Storage facilities
  Factory: "#991B1B", // Red-800 - Industrial factories
  "Big Commercial": "#16A34A", // Green-600 - Large commercial
  "Plot Industrial": "#92400E", // Amber-800 - Industrial plots
  Other: "#4B5563", // Gray-600 - Other properties
} as const;

// Rating Options (1-5 scale, required field)
export const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

// Property Zones
export const PROPERTY_ZONES = [
  "Modal Town",
  "Sat Kartar",
  "Sondhapur",
  "Sodhapur",
  "Gohana Road",
  "Kabri Road",
  "Sector 24",
  "Babail Road",
  "Kutani Road",

  "Tehsil Camp",
  "Devi Mandir Road",
  "Sector 7 Side",
  "Sector 13 - 17",
  "Toll Side",

  "Nangal Kheri",
  "Outer Sanoli Road",
  "Outer Delhi Road",
  "Outer Karnal Road",
  "Outer Jind Road Road",
  "Other",
  "Outside Panipat",
] as const;

// Document Types
export const DOCUMENT_TYPES = [
  "Clear Title",
  "Power of Attorney",
  "Sale Deed",
  "Registry",
  "Mutation",
  "NOC",
] as const;

// Default Coordinates (Panipat, Haryana - updated to match the API data)
export const DEFAULT_COORDINATES = {
  latitude: 29.3864726,
  longitude: 77.0037487,
} as const;

// Price Ranges (in rupees)
export const PRICE_RANGES = [
  [0, 30], // 0 - 30 Lakhs
  [30, 60], // 30 - 60 Lakhs
  [60, 90], // 60 - 90 Lakhs
  [90, 120], // 90 Lakhs - 1.2 Crore
  [120, 150], // 1.2 Cr - 1.5 Cr
  [150, 200], // 1.5 Cr - 2 Cr
  [200, 250], // 2 Cr - 2.5 Cr
  [250, 300], // 2.5 Cr - 3 Cr
  [300, 400], // 3 Cr - 4 Cr
  [400, 500], // 4 Cr - 5 Cr
  [500, 1000], // 5 Cr - 10 Cr
  [1000, 100000], // 10 Cr+
] as const;

export const SIZE_RANGES = [
  [0, 50], // Below 50 Gaj (small plots/flats)
  [50, 100], // 50 - 100 Gaj
  [100, 150], // 100 - 150 Gaj
  [150, 200], // 150 - 200 Gaj
  [200, 300], // 200 - 300 Gaj
  [300, 500], // 300 - 500 Gaj
  [500, 1000], // 500 - 1000 Gaj
  [1000, 5000], // 1000+ Gaj (farms, factories, etc.)
] as const;

// Radius Ranges (in meters) for filtering
export const RADIUS_RANGES = [
  [0, 0], // No radius
  [1, 100], // 1m - 100m
  [100, 500], // 100m - 500m
  [500, 1000], // 500m - 1km
  [1000, 2000], // 1km - 2km
  [2000, 5000], // 2km - 5km
  [5000, 10000], // 5km - 10km
  [10000, 20000], // 10km - 20km
  [20000, 50000], // 20km - 50km
] as const;

// Sort Options
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "size_asc", label: "Size: Small to Large" },
  { value: "size_desc", label: "Size: Large to Small" },
  { value: "rating_desc", label: "Highest Rated" },
] as const;

// Radius Steps (in meters)
export const RADIUS_STEPS = [
  0, 20, 50, 100, 200, 300, 500, 700, 1000, 2000, 3000, 4000, 5000, 7000, 10000,
  15000, 20000, 25000, 30000, 50000,
] as const;

// Pagination - Fixed to use 40 items per page
export const ITEMS_PER_PAGE = 40;

// App Version for cache management
export const APP_VERSION = "2.1.1";

// Map Configuration with zoom limits
export const MAP_CONFIG = {
  defaultZoom: 12,
  focusZoom: 16,
  detailZoom: 16,
  minZoom: 8, // Minimum zoom level (more zoomed out)
  maxZoom: 18, // Maximum zoom level (more zoomed in)
  satelliteUrl:
    "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  streetUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
} as const;

// API Configuration - Updated for new endpoint
export const API_CONFIG = {
  baseUrl: "https://prop.digiheadway.in/api/v3/listing/2.php",
  tables: {
    properties: "v3_properties",
    persons: "v3_person",
    connections: "v3_connections",
    links: "v3_links",
  },
} as const;

// Form Field Placeholders
export const PLACEHOLDERS = {
  property: {
    area: "Enter area/address details",
    description: "Gali Width, Per Gaj, Dimensions, Facing, Legal",
    notes: "Add any additional notes",
    tags: "Type to search or add new tag...",
    zone: "Select zone type",
  },
  person: {
    name: "Enter full name",
    phone: "Enter phone number",
    alternativeContact: "Enter alternative contact",
    about: "Add details about this person",
  },
  link: {
    url: "Enter URL (https://example.com)",
    anchor: "Enter display text (optional)",
    type: "Select link type",
  },
  search: {
    properties: "Search by area, zone...",
    persons: "Search by name, phone...",
    selectPerson: "Search by name or phone...",
    tags: "Search tags...",
    location: "Search for a location...",
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  loadProperties: "Failed to load properties",
  loadPersons: "Failed to load persons",
  loadConnections: "Failed to load connections",
  loadLinks: "Failed to load links",
  createProperty: "Failed to create property",
  updateProperty: "Failed to update property",
  deleteProperty: "Failed to delete property",
  createPerson: "Failed to create person",
  updatePerson: "Failed to update person",
  deletePerson: "Failed to delete person",
  createConnection: "Failed to create connection",
  deleteConnection: "Failed to delete connection",
  createLink: "Failed to create link",
  updateLink: "Failed to update link",
  deleteLink: "Failed to delete link",
  gpsNotSupported: "GPS is not supported in your browser",
  gpsError:
    "Unable to get your location. Please check your GPS settings and try again.",
  invalidCoordinates: "Invalid coordinates provided",
  geocodingError:
    "Unable to find location. Please try a different search term.",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  propertyCreated: "Property created successfully",
  propertyUpdated: "Property updated successfully",
  propertyDeleted: "Property deleted successfully",
  personCreated: "Person created successfully",
  personUpdated: "Person updated successfully",
  personDeleted: "Person deleted successfully",
  connectionCreated: "Connection created successfully",
  connectionDeleted: "Connection removed successfully",
  linkCreated: "Link added successfully",
  linkUpdated: "Link updated successfully",
  linkDeleted: "Link deleted successfully",
  locationUpdated: "Location updated successfully",
} as const;

// Confirmation Messages
export const CONFIRMATION_MESSAGES = {
  deleteProperty: (name: string) =>
    `Are you sure you want to delete "${name}"? This will permanently remove the property and all its connections. This action cannot be undone.`,
  deletePerson: (name: string) =>
    `Are you sure you want to delete "${name}"? This will permanently remove the person and all their property connections. This action cannot be undone.`,
  removeConnection: (name: string) =>
    `Are you sure you want to remove ${name} from this property? This action cannot be undone.`,
  deleteLink: (anchor: string) =>
    `Are you sure you want to delete the link "${anchor}"? This action cannot be undone.`,
} as const;

// UI Text
export const UI_TEXT = {
  buttons: {
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    retry: "Retry",
    close: "Close",
    apply: "Apply",
    reset: "Reset all",
    showRange: "Show range",
    hideRange: "Hide range",
    addProperty: "Add Property",
    addPerson: "Add Person",
    addLink: "Add Link",
    editProperty: "Edit Property",
    editPerson: "Edit Person",
    editLink: "Edit Link",
    updateProperty: "Update Property",
    updatePerson: "Update Person",
    updateLink: "Update Link",
    deleteProperty: "Delete Property",
    deletePerson: "Delete Person",
    deleteLink: "Delete Link",
    connectPerson: "Connect Person",
    addNewPerson: "Add New Person",
    selectPerson: "Select Person",
    updateLocation: "Update Location",
    useCurrentLocation: "Use current location",
    openInMaps: "Open in Google Maps",
    manageTags: "Manage Tags",
    addTag: "Add Tag",
    editTag: "Edit Tag",
    deleteTag: "Delete Tag",
    createTag: "Create Tag",
    updateTag: "Update Tag",
    searchLocation: "Search Location",
  },
  labels: {
    properties: "Properties",
    persons: "Persons",
    links: "Links",
    filters: "Filters",
    propertyDetails: "Property Details",
    contactPersons: "Contact Persons",
    connectedProperties: "Connected Properties",
    locationCoverage: "Location & Coverage",
    coordinates: "Coordinates",
    coverageRadius: "Coverage Radius",
    propertyType: "Property Type",
    propertyTypes: "Property Types",
    size: "Size",
    price: "Price",
    priceRange: "Price Range",
    sizeRange: "Size (sq yd)",
    area: "Area/Address",
    description: "Description",
    notes: "Notes",
    tags: "Tags",
    includeTags: "Include Tags",
    excludeTags: "Exclude Tags",
    zone: "Zone",
    name: "Name",
    phone: "Phone",
    alternativeContact: "Alternative Contact",
    role: "Role",
    about: "About",
    hasProperties: "Has Properties",
    roleInProperty: "Role in Property",
    remarks: "Remarks (Optional)",
    rating: "Rating",
    tagName: "Tag Name",
    availableTags: "Available Tags",
    selectedTags: "Selected Tags",
    sortBy: "Sort By",
    url: "URL",
    linkType: "Link Type",
    displayText: "Display Text",
    resourceLinks: "Resource Links",
    hasLocation: "Location Status",
    radiusRange: "Coverage Radius",
  },
  placeholders: PLACEHOLDERS,
  noData: {
    properties: "No properties found matching your criteria.",
    persons: "No persons found matching your criteria.",
    links: "No links added yet.",
    searchResults: "No persons found matching your search",
    contactPersons: "No contact persons available",
    addSomeone: "Add someone to get started",
    noTags: "No tags available",
    noSelectedTags: "No tags selected",
  },
} as const;
