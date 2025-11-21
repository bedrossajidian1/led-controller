import LED from '../hardware/led.js';
import Button from '../hardware/button.js';

const LED_PIN = 17;    // GPIO 17 (Physical Pin 11)
const BUTTON_PIN = 27; // GPIO 27 (Physical Pin 13)

let led = null;
let button = null;
let wss = null; // WebSocket server reference

// Initialize hardware
export const initHardware = (websocketServer) => {
  wss = websocketServer;
  
  led = new LED(LED_PIN);
  
  // Button toggles LED and broadcasts state
  button = new Button(BUTTON_PIN, () => {
    console.log('Button pressed!');
    led.toggle();
    broadcastState();
  });
  
  console.log('Hardware initialized');
  console.log(`LED: GPIO ${LED_PIN}, Button: GPIO ${BUTTON_PIN}`);
};

// Broadcast LED state to all connected WebSocket clients
const broadcastState = () => {
  if (wss && led) {
    const state = led.getState();
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(JSON.stringify({ type: 'state', data: state }));
      }
    });
  }
};

// Get current LED state
export const getState = (req, res) => {
  if (!led) {
    return res.status(500).json({ error: 'Hardware not initialized' });
  }
  res.json(led.getState());
};

// Turn LED on
export const turnOn = (req, res) => {
  if (!led) {
    return res.status(500).json({ error: 'Hardware not initialized' });
  }
  led.turnOn();
  broadcastState();
  res.json(led.getState());
};

// Turn LED off
export const turnOff = (req, res) => {
  if (!led) {
    return res.status(500).json({ error: 'Hardware not initialized' });
  }
  led.turnOff();
  broadcastState();
  res.json(led.getState());
};

// Toggle LED
export const toggle = (req, res) => {
  if (!led) {
    return res.status(500).json({ error: 'Hardware not initialized' });
  }
  led.toggle();
  broadcastState();
  res.json(led.getState());
};

// Set brightness (0-100)
export const setBrightness = (req, res) => {
  if (!led) {
    return res.status(500).json({ error: 'Hardware not initialized' });
  }
  
  const { brightness } = req.body;
  
  if (brightness === undefined || brightness < 0 || brightness > 100) {
    return res.status(400).json({ error: 'Brightness must be between 0 and 100' });
  }
  
  led.setBrightness(brightness);
  broadcastState();
  res.json(led.getState());
};

// Set mode
export const setMode = (req, res) => {
  if (!led) {
    return res.status(500).json({ error: 'Hardware not initialized' });
  }
  
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
