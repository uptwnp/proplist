// Authentication utilities
const AUTH_STORAGE_KEY = 'property_auth';
const PIN_VERSION_KEY = 'property_pin_version';

// Hardcoded PIN - change this value to invalidate all existing sessions
const CURRENT_PIN = '1357'; // Your new PIN here
const PIN_VERSION = 'v3'; // Increment this when PIN changes to logout all users

export interface AuthData {
  isAuthenticated: boolean;
  loginTime: number;
  pinVersion: string;
}

export const authUtils = {
  // Check if user is authenticated and session is valid
  isAuthenticated(): boolean {
    try {
      const authData = this.getAuthData();
      if (!authData || !authData.isAuthenticated) {
        return false;
      }

      // Check if PIN version matches (logout if PIN was changed)
      if (authData.pinVersion !== PIN_VERSION) {
        console.log('PIN version mismatch, logging out user');
        this.logout();
        return false;
      }

      // Check if session has expired (3 days)
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
      const isExpired = Date.now() - authData.loginTime > threeDaysInMs;
      
      if (isExpired) {
        console.log('Session expired, logging out user');
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.logout();
      return false;
    }
  },

  // Verify PIN and login user
  async login(enteredPin: string): Promise<boolean> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (enteredPin === CURRENT_PIN) {
      const authData: AuthData = {
        isAuthenticated: true,
        loginTime: Date.now(),
        pinVersion: PIN_VERSION
      };

      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        console.log('User logged in successfully');
        return true;
      } catch (error) {
        console.error('Error saving auth data:', error);
        return false;
      }
    }

    return false;
  },

  // Logout user
  logout(): void {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('User logged out');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  // Get stored auth data
  getAuthData(): AuthData | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading auth data:', error);
      return null;
    }
  },

  // Get remaining session time in milliseconds
  getRemainingSessionTime(): number {
    const authData = this.getAuthData();
    if (!authData || !authData.isAuthenticated) {
      return 0;
    }

    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - authData.loginTime;
    const remaining = threeDaysInMs - elapsed;

    return Math.max(0, remaining);
  },

  // Format remaining time for display
  formatRemainingTime(): string {
    const remaining = this.getRemainingSessionTime();
    if (remaining === 0) return 'Expired';

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }
};

// Export the current PIN for backend reference (in a real app, this would be in backend)
export const getCurrentPin = () => CURRENT_PIN;
export const getCurrentPinVersion = () => PIN_VERSION;