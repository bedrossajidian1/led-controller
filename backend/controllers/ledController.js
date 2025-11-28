import LED from '../hardware/led.js';
import Button from '../hardware/button.js';
import { config } from '../config.js';

const LED_PIN = config.ledPin;
const BUTTON_PIN = config.buttonPin;

let led = null;
let button = null;
let wss = null; // WebSocket server reference

// Initialize hardware
export const initHardware = (websocketServer) => {
  try {
    wss = websocketServer;
    
    led = new LED(LED_PIN);
    
    // Button toggles LED and broadcasts state
    button = new Button(BUTTON_PIN, () => {
      console.log('Button pressed!');
      try {
        led.toggle();
        broadcastState();
      } catch (error) {
        console.error('Error handling button press:', error);
      }
    });
    
    console.log('✅ Hardware initialized');
    console.log(`LED: GPIO ${LED_PIN}, Button: GPIO ${BUTTON_PIN}`);
  } catch (error) {
    console.error('❌ Hardware initialization failed:', error.message);
    throw error;
  }
};

// Broadcast LED state to all connected WebSocket clients
const broadcastState = () => {
  if (wss && led) {
    try {
      const state = led.getState();
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // OPEN
          try {
            client.send(JSON.stringify({ type: 'state', data: state }));
          } catch (error) {
            console.error('Error sending WebSocket message:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error broadcasting state:', error);
    }
  }
};

// Get current LED state
export const getState = (req, res, next) => {
  if (!led) {
    return res.status(503).json({ error: 'Hardware not initialized' });
  }
  try {
    res.json(led.getState());
  } catch (error) {
    next(error);
  }
};

// Turn LED on
export const turnOn = (req, res, next) => {
  if (!led) {
    return res.status(503).json({ error: 'Hardware not initialized' });
  }
  try {
    led.turnOn();
    broadcastState();
    res.json(led.getState());
  } catch (error) {
    next(error);
  }
};

// Turn LED off
export const turnOff = (req, res, next) => {
  if (!led) {
    return res.status(503).json({ error: 'Hardware not initialized' });
  }
  try {
    led.turnOff();
    broadcastState();
    res.json(led.getState());
  } catch (error) {
    next(error);
  }
};

// Toggle LED
export const toggle = (req, res, next) => {
  if (!led) {
    return res.status(503).json({ error: 'Hardware not initialized' });
  }
  try {
    led.toggle();
    broadcastState();
    res.json(led.getState());
  } catch (error) {
    next(error);
  }
};

// Set brightness (0-100)
export const setBrightness = (req, res, next) => {
  if (!led) {
    return res.status(503).json({ error: 'Hardware not initialized' });
  }
  
  try {
    const { brightness } = req.body;
    led.setBrightness(brightness);
    broadcastState();
    res.json(led.getState());
  } catch (error) {
    next(error);
  }
};

// Set mode
export const setMode = (req, res, next) => {
  if (!led) {
    return res.status(503).json({ error: 'Hardware not initialized' });
  }
  
  try {
    const { mode, speed, duration } = req.body;
    
    switch (mode) {
      case 'off':
        led.turnOff();
        break;
      case 'on':
        led.turnOn();
        break;
      case 'blink':
        led.startBlink(speed || 500);
        break;
      case 'pulse':
        led.startPulse(speed || 100);
        break;
      case 'breathe':
        led.startBreathe(duration || 2000);
        break;
      case 'sos':
        led.startSOS();
        break;
      default:
        return res.status(400).json({ error: 'Invalid mode' });
    }
    
    broadcastState();
    res.json(led.getState());
  } catch (error) {
    next(error);
  }
};

// Get button state (for debugging)
export const getButtonState = (req, res, next) => {
  if (!button) {
    return res.status(503).json({ error: 'Button not initialized' });
  }
  try {
    const state = button.getState();
    res.json(state);
  } catch (error) {
    next(error);
  }
};

// Cleanup on shutdown
export const cleanup = () => {
  if (led) {
    led.cleanup();
  }
  if (button) {
    button.cleanup();
  }
  console.log('Hardware cleaned up');
};
