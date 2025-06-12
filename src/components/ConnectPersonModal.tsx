import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Person, Connection } from '../types';
import { useStore } from '../store/store';
import { CONNECTION_ROLES, UI_TEXT } from '../constants';

interface ConnectPersonModalProps {
  propertyId: number;
  person: Person;
  onClose: () => void;
}

const ConnectPersonModal: React.FC<ConnectPersonModalProps> = ({ propertyId, person, onClose }) => {
  const { createConnection, loadingStates } = useStore();
  const [role, setRole] = useState<typeof CONNECTION_ROLES[number]>('Contact Person');
  const [remark, setRemark] = useState('');

  const isLoading = loadingStates.creating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    const newConnection = {
      property_id: propertyId,
      person_id: person.id,
      role,
      remark: remark.trim() || undefined
    };

    try {
      await createConnection(newConnection);
      onClose();
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{UI_TEXT.buttons.connectPerson}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Person Details</label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="font-medium">{person.name}</div>
              <div className="text-sm text-gray-600">{person.phone}</div>
              {person.role && (
                <div className="text-sm text-gray-500 mt-1">Role: {person.role}</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.roleInProperty}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof CONNECTION_ROLES[number])}
              className="w-full border rounded-md p-2"
              required
              disabled={isLoading}
            >
              {CONNECTION_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{UI_TEXT.labels.remarks}</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full border rounded-md p-2"
              rows={3}
              placeholder="Add any additional notes or remarks"
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              <span>{UI_TEXT.buttons.connectPerson}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConnectPersonModal;