import React, { useState } from 'react';
import { useStore } from '../store/store';
import { User, MapPin, Phone, Edit, ChevronLeft, ChevronRight, Copy, MessageCircle, Trash2, Building, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import ConfirmationModal from './ConfirmationModal';

const ITEMS_PER_PAGE = 10;

const PersonList: React.FC = () => {
  const { 
    filteredPersons, 
    properties, 
    connections, 
    setSelectedProperty,
    togglePropertyDetail,
    togglePersonForm,
    deletePerson,
    loadingStates,
  } = useStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  
  const totalPages = Math.ceil(filteredPersons.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPersons = filteredPersons.slice(startIndex, endIndex);

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

  const handleDeletePerson = (personId: number, personName: string) => {
    setConfirmDelete({ id: personId, name: personName });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;

    try {
      await deletePerson(confirmDelete.id);
    } catch (error) {
      console.error('Failed to delete person:', error);
    }

    setConfirmDelete(null);
  };

  // Show loading state
  if (loadingStates.persons) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading persons...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto divide-y">
          {filteredPersons.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No persons found matching your criteria.</p>
            </div>
          ) : (
            currentPersons.map(person => {
              const connectedProperties = getPersonProperties(person.id);
              
              return (
                <div key={person.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-gray-500" />
                        <h3 className="font-medium">{person.name}</h3>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{person.role}</div>
                      
                      {/* Person About */}
                      {person.about && (
                        <div className="bg-gray-50 p-2 rounded border mt-2">
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            About
                          </div>
                          <div className="text-sm text-gray-700">{person.about}</div>
                        </div>
                      )}
                      
                      {/* Phone number with actions */}
                      {person.phone && (
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mt-2">
                          <span className="text-sm font-mono">{person.phone}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => copyToClipboard(person.phone)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy number"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => openWhatsApp(person.phone)}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              onClick={() => makeCall(person.phone)}
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
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border mt-1">
                          <div>
                            <span className="text-xs text-gray-500">Alt: </span>
                            <span className="text-sm font-mono">{person.alternative_contact}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => copyToClipboard(person.alternative_contact)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                              title="Copy number"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => openWhatsApp(person.alternative_contact)}
                              className="p-1 text-green-500 hover:text-green-700"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </button>
                            <button
                              onClick={() => makeCall(person.alternative_contact)}
                              className="p-1 text-blue-500 hover:text-blue-700"
                              title="Call"
                            >
                              <Phone size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <button
                        onClick={() => togglePersonForm(person)}
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit person"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person.id, person.name)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete person"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {connectedProperties.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Building size={14} className="text-blue-600" />
                        <h4 className="text-sm font-medium text-gray-600">
                          Connected Properties ({connectedProperties.length})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {connectedProperties.map(({ property, connection }) => (
                          property && (
                            <div 
                              key={property.id}
                              className="bg-gray-50 p-3 rounded-md text-sm cursor-pointer hover:bg-gray-100 border"
                              onClick={() => {
                                setSelectedProperty(property);
                                togglePropertyDetail(true);
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 mb-1">{property.area}</div>
                                  <div className="flex items-center text-gray-600 mb-1">
                                    <MapPin size={12} className="mr-1 flex-shrink-0" />
                                    <span className="truncate">{property.zone || 'Unknown Zone'}</span>
                                  </div>
                                  {connection.role && (
                                    <div className="text-blue-600 font-medium text-xs">
                                      Role: {connection.role}
                                    </div>
                                  )}
                                  {connection.remark && (
                                    <div className="text-gray-500 text-xs mt-1 italic">
                                      Note: {connection.remark}
                                    </div>
                                  )}
                                </div>
                                <div className="text-blue-600 font-medium ml-2 flex-shrink-0">
                                  ₹{formatCurrency(property.price_min)}
                                </div>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t bg-white">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!confirmDelete}
        title="Delete Person"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This will permanently remove the person and all their property connections. This action cannot be undone.`}
        confirmText="Delete Person"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
        type="danger"
      />
    </>
  );
};

export default PersonList;