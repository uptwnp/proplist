import React, { useState } from 'react';
import { Person } from '../types';
import { X, Loader2 } from 'lucide-react';
import { useStore } from '../store/store';
import { PERSON_ROLES, UI_TEXT } from '../constants';

interface PersonFormProps {
  person?: Person;
  onClose: () => void;
}

const PersonForm: React.FC<PersonFormProps> = ({ person, onClose }) => {
  const { createPerson, updatePerson, loadingStates, isMobileView } = useStore();
  
  const [formData, setFormData] = useState<Partial<Person>>(person || {
    name: '',
    phone: '',
    role: 'Owner'
  });

  const isLoading = loadingStates.creating || loadingStates.updating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      if (person) {
        await updatePerson(formData as Person);
      } else {
        const { id, ...newPersonData } = formData as Person;
        await createPerson(newPersonData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save person:', error);
    }
  };

  return (
    <div className={`fixed bg-black bg-opacity-50 z-[60] flex items-center justify-center ${
      isMobileView ? 'inset-0' : 'inset-0'
    }`}>
      <div className={`bg-white w-full ${
        isMobileView 
          ? 'h-full max-w-none rounded-none flex flex-col' 
          : 'rounded-lg max-w-md'
      }`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {person ? UI_TEXT.buttons.editPerson : UI_TEXT.buttons.addPerson}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={`p-4 space-y-4 ${
          isMobileView ? 'flex-1 overflow-y-auto' : ''
        }`}>
          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.name}</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border rounded-md p-2"
              placeholder={UI_TEXT.placeholders.person.name}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.phone}</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border rounded-md p-2"
              placeholder={UI_TEXT.placeholders.person.phone}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.alternativeContact}</label>
            <input
              type="tel"
              value={formData.alternative_contact || ''}
              onChange={e => setFormData({...formData, alternative_contact: e.target.value})}
              className="w-full border rounded-md p-2"
              placeholder={UI_TEXT.placeholders.person.alternativeContact}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.role}</label>
            <select
              value={formData.role || ''}
              onChange={e => setFormData({...formData, role: e.target.value as typeof PERSON_ROLES[number]})}
              className="w-full border rounded-md p-2"
              required
              disabled={isLoading}
            >
              <option value="">Select a role</option>
              {PERSON_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.about}</label>
            <textarea
              value={formData.about || ''}
              onChange={e => setFormData({...formData, about: e.target.value})}
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder={UI_TEXT.placeholders.person.about}
              disabled={isLoading}
            />
          </div>

          <div className={`flex justify-end space-x-3 pt-4 ${
            isMobileView ? 'sticky bottom-0 bg-white border-t -mx-4 px-4 py-4' : ''
          }`}>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              {UI_TEXT.buttons.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              <span>
                {person ? UI_TEXT.buttons.updatePerson : UI_TEXT.buttons.addPerson}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonForm;