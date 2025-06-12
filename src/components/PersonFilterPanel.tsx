import React from 'react';
import { useStore } from '../store/store';
import { Check } from 'lucide-react';
import { PERSON_ROLES, UI_TEXT } from '../constants';

const PersonFilterPanel: React.FC = () => {
  const { personFilters, updatePersonFilters, resetPersonFilters } = useStore();

  const handleRoleToggle = (role: typeof PERSON_ROLES[number]) => {
    const currentRoles = [...personFilters.roles];
    const index = currentRoles.indexOf(role);
    
    if (index === -1) {
      currentRoles.push(role);
    } else {
      currentRoles.splice(index, 1);
    }
    
    updatePersonFilters({ roles: currentRoles });
  };

  const handleHasPropertiesChange = (value: boolean | null) => {
    updatePersonFilters({ hasProperties: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{UI_TEXT.labels.filters}</h3>
        <button 
          onClick={resetPersonFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {UI_TEXT.buttons.reset}
        </button>
      </div>

      {/* Role Filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">{UI_TEXT.labels.role}</h4>
        <div className="space-y-2">
          {PERSON_ROLES.map((role) => (
            <button
              key={role}
              className={`flex items-center w-full px-3 py-1.5 text-sm rounded-md border ${
                personFilters.roles.includes(role)
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleRoleToggle(role)}
            >
              <span className="flex-1 text-left">{role}</span>
              {personFilters.roles.includes(role) && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Has Properties Filter */}
      <div>
        <h4 className="text-sm font-medium mb-2">{UI_TEXT.labels.hasProperties}</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${
              personFilters.hasProperties === true
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleHasPropertiesChange(true)}
          >
            Yes
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${
              personFilters.hasProperties === false
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleHasPropertiesChange(false)}
          >
            No
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md border ${
              personFilters.hasProperties === null
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => handleHasPropertiesChange(null)}
          >
            Any
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonFilterPanel;