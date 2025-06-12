import { 
  PROPERTY_TYPES, 
  PERSON_ROLES,
  CONNECTION_ROLES
} from '../constants';

export type PropertyType = typeof PROPERTY_TYPES[number];
export type PersonRole = typeof PERSON_ROLES[number];
export type ConnectionRole = typeof CONNECTION_ROLES[number];

export interface Property {
  id: number;
  size_min: number;
  size_max: number;
  price_min: number;
  price_max: number;
  tags: string[];
  rating: number; // Required field (int(2), No null)
  location: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  area?: string; // New field from database schema
  zone?: string;
  description?: string;
  note?: string;
  type?: PropertyType; // Optional in database
  created_on?: string;
  updated_on?: string;
}

export interface Person {
  id: number;
  name: string;
  phone: string;
  about?: string;
  role?: PersonRole;
  alternative_contact?: string;
}

export interface Connection {
  id: number;
  property_id: number;
  person_id: number;
  role: ConnectionRole;
  remark?: string;
}

export interface Link {
  id: number;
  property_id: number;
  link: string;
  type?: string;
  anchor?: string;
  created_at?: string;
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export type SortOption = 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc' | 'rating_desc' | 'newest' | 'oldest';

export interface FilterState {
  priceRange: [number, number];
  sizeRange: [number, number];
  propertyTypes: PropertyType[];
  searchQuery: string;
  tags: string[];
  excludedTags: string[];
  rating?: number;
  sortBy: SortOption;
  hasLocation: boolean | null; // New filter: true = has location, false = no location, null = all
  radiusRange: [number, number]; // New filter: radius range in meters
}

export interface PersonFilterState {
  searchQuery: string;
  roles: PersonRole[];
  hasProperties: boolean | null;
}

export interface Tag {
  id: number;
  name: string;
  usage_count?: number;
}