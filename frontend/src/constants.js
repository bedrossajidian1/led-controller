// Configuration constants
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' ? 'localhost' : hostname;
};

export const BASE_HOST = getBaseUrl();
export const API_URL = `http://${BASE_HOST}:3001/api/led`;
export const WS_URL = `ws://${BASE_HOST}:3001/ws`;

export const WS_RECONNECT_DELAY = 3000; // 3 seconds
export const WS_RECONNECT_MAX_ATTEMPTS = 10;
export const BRIGHTNESS_DEBOUNCE_MS = 150; // Debounce delay for brightness slider

export const LED_MODES = {
  OFF: 'off',
  ON: 'on',
  BLINK: 'blink',
  PULSE: 'pulse',
  BREATHE: 'breathe',
  SOS: 'sos',
};

