import { Property, Person, Connection, Link } from '../types';
import { DEFAULT_COORDINATES, API_CONFIG } from '../constants';

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

// Generic API functions for the new endpoint structure
async function fetchData(table: string, params: Record<string, any> = {}): Promise<any> {
  const url = new URL(API_CONFIG.baseUrl);
  url.searchParams.append('table', table);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.data || [];
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function postData(table: string, data: Record<string, any>): Promise<any> {
  const url = new URL(API_CONFIG.baseUrl);
  url.searchParams.append('table', table);

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Post error:', error);
    throw error;
  }
}

async function putData(table: string, data: Record<string, any>): Promise<any> {
  const url = new URL(API_CONFIG.baseUrl);
  url.searchParams.append('table', table);

  try {
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Put error:', error);
    throw error;
  }
}

async function deleteData(table: string, id: number): Promise<any> {
  const url = new URL(API_CONFIG.baseUrl);
  url.searchParams.append('table', table);

  try {
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

// Transform new API data format to frontend format
function transformPropertyFromNewAPI(apiData: any): Property {
  // Handle location field
  let location = DEFAULT_COORDINATES;
  if (apiData.location && typeof apiData.location === 'string') {
    const coords = apiData.location.split(',');
    const latitude = parseFloat(coords[0]);
    const longitude = parseFloat(coords[1]);
    
    if (!isNaN(latitude) && !isNaN(longitude)) {
      location = { latitude, longitude };
    }
  }

  // Handle tags field
  let tags: string[] = [];
  if (apiData.tags) {
    if (typeof apiData.tags === 'string') {
      tags = apiData.tags.split(',').filter(Boolean);
    } else if (Array.isArray(apiData.tags)) {
      tags = apiData.tags;
    }
  }

  return {
    id: Number(apiData.id),
    size_min: Number(apiData.size_min) || 0,
    size_max: Number(apiData.size_max) || 0,
    price_min: Number(apiData.price_min) || 0,
    price_max: Number(apiData.price_max) || 0,
    tags,
    rating: Number(apiData.rating) || 0,
    location,
    radius: Number(apiData.radius) || 0,
    area: apiData.area || '',
    zone: apiData.zone || '',
    description: apiData.description || '',
    note: apiData.note || '',
    type: apiData.type || 'Other',
    created_on: apiData.created_at,
    updated_on: apiData.updated_at,
  };
}

function transformPersonFromNewAPI(apiData: any): Person {
  return {
    id: Number(apiData.id),
    name: apiData.name || '',
    phone: apiData.phone || '',
    about: apiData.about || '',
    role: apiData.role || 'Other Related',
    alternative_contact: apiData.alternative_contact_details || apiData.alternative_contact || '',
  };
}

function transformConnectionFromNewAPI(apiData: any): Connection {
  return {
    id: Number(apiData.id),
    property_id: Number(apiData.property_id),
    person_id: Number(apiData.person_id),
    role: apiData.role || 'Other Related',
    remark: apiData.remark || '',
  };
}

function transformLinkFromNewAPI(apiData: any): Link {
  return {
    id: Number(apiData.id),
    property_id: Number(apiData.property_id),
    link: apiData.link || '',
    type: apiData.type || 'Other',
    anchor: apiData.anchor || '',
    created_at: apiData.created_at,
  };
}

// Transform frontend data to backend format
function transformToBackend(property: Omit<Property, 'id'> | Property): any {
  // Ensure location is always valid before sending to backend
  const validLocation = ensureValidLocation(property.location);
  
  return {
    ...property,
    // Map frontend fields to backend fields exactly as they are in database
    tags: Array.isArray(property.tags) ? property.tags.join(',') : property.tags,
    location: `${validLocation.latitude},${validLocation.longitude}`,
    rating: property.rating || 0, // Required field, default to 0
    // Remove frontend-only fields
    created_on: undefined,
    updated_on: undefined
  };
}

// Property API functions - Updated for new endpoint structure with nested data
export const propertyAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Property[]> => {
    const data = await fetchData(API_CONFIG.tables.properties, filters);
    return data.map((item: any) => transformPropertyFromNewAPI(item));
  },
  
  getById: async (id: number): Promise<{
    property: Property;
    persons: Person[];
    connections: Connection[];
    links: Link[];
  }> => {
    const data = await fetchData(API_CONFIG.tables.properties, { id });
    const item = data[0];
    
    if (!item) {
      throw new Error('Property not found');
    }
    
    return {
      property: transformPropertyFromNewAPI(item),
      persons: (item.persons || []).map((p: any) => transformPersonFromNewAPI(p)),
      connections: (item.connections || []).map((c: any) => transformConnectionFromNewAPI(c)),
      links: (item.links || []).map((l: any) => transformLinkFromNewAPI(l)),
    };
  },
  
  create: async (property: Omit<Property, 'id'>): Promise<{ success: boolean; id: number }> => {
    const backendData = transformToBackend(property);
    // Remove id field for creation
    delete backendData.id;
    return postData(API_CONFIG.tables.properties, backendData);
  },
  
  update: async (property: Property): Promise<{ success: boolean }> => {
    const backendData = transformToBackend(property);
    return putData(API_CONFIG.tables.properties, backendData);
  },
  
  delete: (id: number): Promise<{ success: boolean }> => 
    deleteData(API_CONFIG.tables.properties, id),
  
  search: async (query: string, filters: Record<string, any> = {}): Promise<Property[]> => {
    const data = await fetchData(API_CONFIG.tables.properties, { ...filters, area: query });
    return data.map((item: any) => transformPropertyFromNewAPI(item));
  }
};

// Person API functions - Updated to handle nested data
export const personAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Person[]> => {
    const data = await fetchData(API_CONFIG.tables.persons, filters);
    return data.map((person: any) => transformPersonFromNewAPI(person));
  },
  
  getById: async (id: number): Promise<{
    person: Person;
    properties: Property[];
    connections: Connection[];
    links: Link[];
  }> => {
    const data = await fetchData(API_CONFIG.tables.persons, { id });
    const item = data[0];
    
    if (!item) {
      throw new Error('Person not found');
    }
    
    return {
      person: transformPersonFromNewAPI(item),
      properties: (item.properties || []).map((p: any) => transformPropertyFromNewAPI(p)),
      connections: (item.connections || []).map((c: any) => transformConnectionFromNewAPI(c)),
      links: (item.links || []).map((l: any) => transformLinkFromNewAPI(l)),
    };
  },
  
  create: (person: Omit<Person, 'id'>): Promise<{ success: boolean; id: number }> => 
    postData(API_CONFIG.tables.persons, {
      ...person,
      alternative_contact_details: person.alternative_contact
    }),
  
  update: (person: Person): Promise<{ success: boolean }> => 
    putData(API_CONFIG.tables.persons, {
      ...person,
      alternative_contact_details: person.alternative_contact
    }),
  
  delete: (id: number): Promise<{ success: boolean }> => 
    deleteData(API_CONFIG.tables.persons, id),
  
  search: async (query: string): Promise<Person[]> => {
    const data = await fetchData(API_CONFIG.tables.persons, { name: query });
    return data.map((person: any) => transformPersonFromNewAPI(person));
  }
};

// Connection API functions
export const connectionAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Connection[]> => {
    const data = await fetchData(API_CONFIG.tables.connections, filters);
    return data.map((conn: any) => transformConnectionFromNewAPI(conn));
  },
  
  getByPropertyId: async (propertyId: number): Promise<Connection[]> => {
    const data = await fetchData(API_CONFIG.tables.connections, { property_id: propertyId });
    return data.map((conn: any) => transformConnectionFromNewAPI(conn));
  },
  
  getByPersonId: async (personId: number): Promise<Connection[]> => {
    const data = await fetchData(API_CONFIG.tables.connections, { person_id: personId });
    return data.map((conn: any) => transformConnectionFromNewAPI(conn));
  },
  
  create: (connection: Omit<Connection, 'id'>): Promise<{ success: boolean; id: number }> => 
    postData(API_CONFIG.tables.connections, connection),
  
  update: (connection: Connection): Promise<{ success: boolean }> => 
    putData(API_CONFIG.tables.connections, connection),
  
  delete: (id: number): Promise<{ success: boolean }> => 
    deleteData(API_CONFIG.tables.connections, id),
  
  deleteByPropertyId: async (propertyId: number): Promise<{ success: boolean }> => {
    try {
      const connections = await fetchData(API_CONFIG.tables.connections, { property_id: propertyId });
      await Promise.all(connections.map((conn: any) => deleteData(API_CONFIG.tables.connections, Number(conn.id))));
      return { success: true };
    } catch (error) {
      console.error('Error deleting connections by property ID:', error);
      return { success: false };
    }
  },
  
  deleteByPersonId: async (personId: number): Promise<{ success: boolean }> => {
    try {
      const connections = await fetchData(API_CONFIG.tables.connections, { person_id: personId });
      await Promise.all(connections.map((conn: any) => deleteData(API_CONFIG.tables.connections, Number(conn.id))));
      return { success: true };
    } catch (error) {
      console.error('Error deleting connections by person ID:', error);
      return { success: false };
    }
  }
};

// Link API functions
export const linkAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Link[]> => {
    const data = await fetchData(API_CONFIG.tables.links, filters);
    return data.map((link: any) => transformLinkFromNewAPI(link));
  },
  
  getByPropertyId: async (propertyId: number): Promise<Link[]> => {
    const data = await fetchData(API_CONFIG.tables.links, { property_id: propertyId });
    return data.map((link: any) => transformLinkFromNewAPI(link));
  },
  
  create: (link: Omit<Link, 'id'>): Promise<{ success: boolean; id: number }> => 
    postData(API_CONFIG.tables.links, link),
  
  update: (link: Link): Promise<{ success: boolean }> => 
    putData(API_CONFIG.tables.links, link),
  
  delete: (id: number): Promise<{ success: boolean }> => 
    deleteData(API_CONFIG.tables.links, id),
  
  deleteByPropertyId: async (propertyId: number): Promise<{ success: boolean }> => {
    try {
      const links = await fetchData(API_CONFIG.tables.links, { property_id: propertyId });
      await Promise.all(links.map((link: any) => deleteData(API_CONFIG.tables.links, Number(link.id))));
      return { success: true };
    } catch (error) {
      console.error('Error deleting links by property ID:', error);
      return { success: false };
    }
  }
};

// Helper function to transform API data (keeping for backward compatibility)
export const transformApiData = {
  property: transformPropertyFromNewAPI,
  person: transformPersonFromNewAPI,
  connection: transformConnectionFromNewAPI,
  link: transformLinkFromNewAPI
};

// Function to extract all data from the properties response for initial load
export const extractAllDataFromProperties = async (): Promise<{
  properties: Property[];
  persons: Person[];
  connections: Connection[];
  links: Link[];
}> => {
  try {
    const propertiesData = await fetchData(API_CONFIG.tables.properties, {});
    
    const properties: Property[] = [];
    const persons: Person[] = [];
    const connections: Connection[] = [];
    const links: Link[] = [];
    
    const personIds = new Set<number>();
    
    propertiesData.forEach((item: any) => {
      // Extract property
      properties.push(transformPropertyFromNewAPI(item));
      
      // Extract unique persons from nested data if available
      if (item.persons && Array.isArray(item.persons)) {
        item.persons.forEach((person: any) => {
          if (!personIds.has(Number(person.id))) {
            personIds.add(Number(person.id));
            persons.push(transformPersonFromNewAPI(person));
          }
        });
      }
      
      // Extract connections from nested data if available
      if (item.connections && Array.isArray(item.connections)) {
        item.connections.forEach((connection: any) => {
          connections.push(transformConnectionFromNewAPI(connection));
        });
      }
      
      // Extract links from nested data if available
      if (item.links && Array.isArray(item.links)) {
        item.links.forEach((link: any) => {
          links.push(transformLinkFromNewAPI(link));
        });
      }
    });
    
    return { properties, persons, connections, links };
  } catch (error) {
    console.error('Failed to extract all data from properties:', error);
    throw error;
  }
};