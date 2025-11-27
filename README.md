# LED Controller

A full-stack LED controller application for Raspberry Pi with web interface and React Native mobile app support.

## Features

- 🌐 Web-based control interface
- 📱 React Native mobile app (in progress)
- 🔌 Real-time WebSocket updates
- 💡 PWM brightness control
- 🎨 Multiple LED modes (Solid, Blink, Pulse, Breathe, SOS)
- 🔘 Physical button support
- ⚡ RESTful API

## Project Structure

```
led-controller/
├── backend/          # Express.js API server
│   ├── controllers/  # Route controllers
│   ├── hardware/     # GPIO hardware abstraction
│   ├── middleware/   # Express middleware
│   └── routes/       # API routes
├── frontend/         # React web interface
│   └── src/
│       ├── hooks/    # Custom React hooks
│       ├── services/ # API service layer
│       └── utils/    # Utility functions
└── LEDControllerApp/ # React Native mobile app
```

## Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment (optional):
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The API will be available at `http://localhost:3001`

## Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Environment Variables

### Backend

- `PORT` - Server port (default: 3001)
- `LED_PIN` - GPIO pin for LED (default: 17)
- `BUTTON_PIN` - GPIO pin for button (default: 27)
- `CORS_ORIGIN` - CORS allowed origin (default: *)
- `NODE_ENV` - Environment (development/production)

## API Endpoints

- `GET /api/led/state` - Get current LED state
- `POST /api/led/on` - Turn LED on
- `POST /api/led/off` - Turn LED off
- `POST /api/led/toggle` - Toggle LED
- `POST /api/led/brightness` - Set brightness (0-100)
- `POST /api/led/mode` - Set LED mode
- `GET /api/health` - Health check

## Improvements Made

### Backend
- ✅ Environment variable configuration
- ✅ Error handling middleware
- ✅ Input validation middleware
- ✅ Try-catch error handling in controllers
- ✅ Improved WebSocket error handling
- ✅ Request logging
- ✅ Graceful hardware initialization

### Frontend
- ✅ Constants and configuration file
- ✅ Custom WebSocket hook with auto-reconnection
- ✅ API service layer with axios interceptors
- ✅ Error display UI
- ✅ Loading states
- ✅ Debounced brightness slider
- ✅ Removed DOM manipulation (using refs)
- ✅ Better error handling

## License

ISC
