import React from 'react';
import { LogOut } from 'lucide-react';
import { useStore } from '../store/store';

interface HiddenLogoutButtonProps {
  show: boolean;
}

const HiddenLogoutButton: React.FC<HiddenLogoutButtonProps> = ({ show }) => {
  const { logout } = useStore();

  if (!show) return null;

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="mt-2 flex justify-center">
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200 hover:border-red-300"
        title="Logout from system"
      >
        <LogOut size={12} />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default HiddenLogoutButton;