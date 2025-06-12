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

// Generic API functions
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

// Transform backend data to frontend format
function transformFromBackend(apiData: any): any {
  return {
    ...apiData,
    id: Number(apiData.id),
    // Handle tags field
    tags: typeof apiData.tags === 'string' ? 
      apiData.tags.split(',').filter(Boolean) : 
      (Array.isArray(apiData.tags) ? apiData.tags : []),
    // Handle location field
    location: typeof apiData.location === 'string' ? 
      (() => {
        const coords = apiData.location.split(',');
        const latitude = parseFloat(coords[0]);
        const longitude = parseFloat(coords[1]);
        
        // Use backup coordinates if parsing fails or coordinates are invalid
        if (isNaN(latitude) || isNaN(longitude)) {
          return DEFAULT_COORDINATES;
        }
        
        return { latitude, longitude };
      })() : 
      ensureValidLocation(apiData.location),
    // Ensure numeric fields
    size_min: Number(apiData.size_min) || 0,
    size_max: Number(apiData.size_max) || 0,
    price_min: Number(apiData.price_min) || 0,
    price_max: Number(apiData.price_max) || 0,
    radius: Number(apiData.radius) || 0,
    rating: Number(apiData.rating) || 0 // Required field
  };
}

// Property API functions
export const propertyAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Property[]> => {
    const data = await fetchData(API_CONFIG.tables.properties, filters);
    return data.map(transformFromBackend);
  },
  
  getById: async (id: number): Promise<Property> => {
    const data = await fetchData(API_CONFIG.tables.properties, { id });
    return transformFromBackend(data[0]);
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
    return data.map(transformFromBackend);
  }
};

// Person API functions
export const personAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Person[]> => {
    const data = await fetchData(API_CONFIG.tables.persons, filters);
    return data.map((person: any) => ({
      ...person,
      id: Number(person.id),
      alternative_contact: person.alternative_contact_details
    }));
  },
  
  getById: async (id: number): Promise<Person> => {
    const data = await fetchData(API_CONFIG.tables.persons, { id });
    const person = data[0];
    return {
      ...person,
      id: Number(person.id),
      alternative_contact: person.alternative_contact_details
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
    return data.map((person: any) => ({
      ...person,
      id: Number(person.id),
      alternative_contact: person.alternative_contact_details
    }));
  }
};

// Connection API functions
export const connectionAPI = {
  getAll: async (filters: Record<string, any> = {}): Promise<Connection[]> => {
    const data = await fetchData(API_CONFIG.tables.connections, filters);
    return data.map((conn: any) => ({
      ...conn,
      id: Number(conn.id),
      property_id: Number(conn.property_id),
      person_id: Number(conn.person_id)
    }));
  },
  
  getByPropertyId: async (propertyId: number): Promise<Connection[]> => {
    const data = await fetchData(API_CONFIG.tables.connections, { property_id: propertyId });
    return data.map((conn: any) => ({
      ...conn,
      id: Number(conn.id),
      property_id: Number(conn.property_id),
      person_id: Number(conn.person_id)
    }));
  },
  
  getByPersonId: async (personId: number): Promise<Connection[]> => {
    const data = await fetchData(API_CONFIG.tables.connections, { person_id: personId });
    return data.map((conn: any) => ({
      ...conn,
      id: Number(conn.id),
      property_id: Number(conn.property_id),
      person_id: Number(conn.person_id)
    }));
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
    return data.map((link: any) => ({
      ...link,
      id: Number(link.id),
      property_id: Number(link.property_id)
    }));
  },
  
  getByPropertyId: async (propertyId: number): Promise<Link[]> => {
    const data = await fetchData(API_CONFIG.tables.links, { property_id: propertyId });
    return data.map((link: any) => ({
      ...link,
      id: Number(link.id),
      property_id: Number(link.property_id)
    }));
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
  property: transformFromBackend,
  
  person: (apiPerson: any): Person => ({
    ...apiPerson,
    id: Number(apiPerson.id),
    alternative_contact: apiPerson.alternative_contact_details
  }),
  
  connection: (apiConnection: any): Connection => ({
    ...apiConnection,
    id: Number(apiConnection.id),
    property_id: Number(apiConnection.property_id),
    person_id: Number(apiConnection.person_id)
  }),
  
  link: (apiLink: any): Link => ({
    ...apiLink,
    id: Number(apiLink.id),
    property_id: Number(apiLink.property_id)
  })
};