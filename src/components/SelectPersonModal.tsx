import React, { useState, useEffect } from 'react';
import { X, Search, Plus, User, Copy, MessageCircle, Phone, Building, MapPin } from 'lucide-react';
import { Person } from '../types';
import { useStore } from '../store/store';
import PersonForm from './PersonForm';
import ConnectPersonModal from './ConnectPersonModal';
import { formatCurrency } from '../utils/formatters';

interface SelectPersonModalProps {
  propertyId: number;
  onClose: () => void;
}

const SelectPersonModal: React.FC<SelectPersonModalProps> = ({ propertyId, onClose }) => {
  const { persons, connections, properties, loadAllData } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load all data when modal opens
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadAllData();
      } catch (error) {
        console.error('Failed to load data for person selection:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [loadAllData]);

  // Sort persons by most recently added (assuming newer IDs are more recent)
  const sortedPersons = [...persons].sort((a, b) => Number(b.id) - Number(a.id));

  const filteredPersons = sortedPersons.filter(person =>
    (person.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.phone ?? '').includes(searchQuery) ||
    (person.alternative_contact ?? '').includes(searchQuery) ||
    (person.about ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (person.role ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get person's connected properties
  const getPersonProperties = (personId: number) => {
    const personConnections = connections.filter(conn => conn.person_id === personId);
    return personConnections.map(conn => {
      const property = properties.find(prop => prop.id === conn.property_id);
      return property ? { property, connection: conn } : null;
    }).filter(Boolean);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/91${cleanPhone}`;
    window.open(url, '_blank');
  };

  const makeCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[50] flex items-center justify-center">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading persons...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[50] flex items-center justify-center">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select Person</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b">
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search by name, phone, role, or about..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <button
              onClick={() => setShowAddPerson(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              <Plus size={18} />
              <span>Add New Person</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y">
            {filteredPersons.map(person => {
              const connectedProperties = getPersonProperties(person.id);
              
              return (
                <div key={person.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                        <User size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{person.name ?? 'Unknown'}</div>
                        {person.role && (
                          <div className="text-sm text-gray-500 mb-1">{person.role}</div>
                        )}
                        {person.about && (
                          <div className="text-sm text-gray-600 mb-2 line-clamp-2">{person.about}</div>
                        )}
                        
                        {/* Connected Properties Count */}
                        {connectedProperties.length > 0 && (
                          <div className="flex items-center text-xs text-blue-600 mb-2">
                            <Building size={12} className="mr-1" />
                            <span>{connectedProperties.length} connected propert{connectedProperties.length === 1 ? 'y' : 'ies'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedPerson(person)}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex-shrink-0 ml-2"
                    >
                      Select
                    </button>
                  </div>

                  {/* Phone number with actions */}
                  {person.phone && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mb-2">
                      <span className="text-sm font-mono">{person.phone}</span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(person.phone);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Copy number"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(person.phone);
                          }}
                          className="p-1 text-green-500 hover:text-green-700"
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            makeCall(person.phone);
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="Call"
                        >
                          <Phone size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Alternative contact if available */}
                  {person.alternative_contact && (
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mb-2">
                      <div>
                        <span className="text-xs text-gray-500">Alt: </span>
                        <span className="text-sm font-mono">{person.alternative_contact}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(person.alternative_contact);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          title="Copy number"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(person.alternative_contact);
                          }}
                          className="p-1 text-green-500 hover:text-green-700"
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            makeCall(person.alternative_contact);
                          }}
                          className="p-1 text-blue-500 hover:text-blue-700"
                          title="Call"
                        >
                          <Phone size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Connected Properties Preview */}
                  {connectedProperties.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">Connected Properties:</h4>
                      <div className="space-y-1 max-h-24 overflow-y-auto">
                        {connectedProperties.slice(0, 2).map(({ property, connection }) => (
                          property && (
                            <div key={property.id} className="bg-blue-50 p-2 rounded text-xs">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{property.area}</div>
                                  <div className="flex items-center text-gray-600 mt-1">
                                    <MapPin size={10} className="mr-1 flex-shrink-0" />
                                    <span className="truncate">{property.zone || 'Unknown Zone'}</span>
                                  </div>
                                  {connection.role && (
                                    <div className="text-blue-600 font-medium">Role: {connection.role}</div>
                                  )}
                                </div>
                                <div className="text-blue-600 font-medium ml-2 flex-shrink-0">
                                  ₹{formatCurrency(property.price_min)}
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                        {connectedProperties.length > 2 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{connectedProperties.length - 2} more properties
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredPersons.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No persons found matching your search
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddPerson && (
        <PersonForm
          onClose={() => setShowAddPerson(false)}
        />
      )}

      {selectedPerson && (
        <ConnectPersonModal
          propertyId={propertyId}
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </>
  );
};

export default SelectPersonModal;