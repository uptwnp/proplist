# Property Management System

A comprehensive property management system built with React, TypeScript, and modern web technologies.

## Features

- **Property Management**: Add, edit, and manage properties with detailed information
- **Person Management**: Manage contacts and their relationships with properties
- **Interactive Map**: View properties on an interactive map with satellite/street view
- **Location Services**: 
  - GPS location detection
  - Address geocoding
  - Plus Code support with Google Maps API integration
  - Coordinate input support
- **Advanced Filtering**: Filter properties by type, price, size, tags, and more
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **PWA Support**: Installable as a Progressive Web App

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd property-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   **Google Maps API Setup (Optional but Recommended):**
   
   For accurate Plus Code conversion, set up Google Maps API:
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com/)
   b. Create a new project or select an existing one
   c. Enable the **Geocoding API**
   d. Create credentials (API Key)
   e. Add your API key to `.env`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
   
   **Note:** Without the Google Maps API key, the app will use a fallback Plus Code conversion method, which may be less accurate.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Plus Code Support

The application supports Plus Codes (Open Location Codes) for precise location input:

### With Google Maps API (Recommended)
- Highly accurate conversion
- Supports all Plus Code formats
- Better error handling
- Automatic validation

### Fallback Method
- Basic Plus Code decoding
- Works without API key
- May have reduced accuracy for some codes

### Supported Plus Code Formats
- Full codes: `7JVW9XPW+XX`
- Short codes: `9XPW+XX`
- Grid codes: `92M2+R8`

## Location Input Methods

The location update modal supports multiple input methods:

1. **Search**: Natural language addresses ("Modal Town, Panipat")
2. **Coordinates**: Latitude, longitude pairs ("29.3865, 76.9957")
3. **Plus Codes**: Open Location Codes ("7JVW9XPW+XX")
4. **GPS**: Current device location
5. **Map Click**: Click directly on the map
6. **Marker Drag**: Drag the location marker

## Technologies Used

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Maps**: MapLibre GL JS, React Map GL
- **Icons**: Lucide React
- **Build Tool**: Vite
- **PWA**: Service Worker, Web App Manifest

## API Integration

The app integrates with a custom REST API for data management. Configure the API endpoint in `src/constants/index.ts`.

## Browser Support

- Modern browsers with ES2020 support
- Progressive Web App features
- Geolocation API support
- Service Worker support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.