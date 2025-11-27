import { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import api from './services/api.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { debounce } from './utils/debounce.js';
import { BRIGHTNESS_DEBOUNCE_MS } from './constants.js';

function App() {
  const [ledState, setLedState] = useState({
    isOn: false,
    mode: 'off',
    brightness: 100,
    pin: 17
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localBrightness, setLocalBrightness] = useState(100);
  
  // Refs for custom inputs (replacing DOM manipulation)
  const blinkSpeedRef = useRef(null);
  const breatheDurationRef = useRef(null);

  // WebSocket message handler
  const handleWebSocketMessage = (message) => {
    if (message.type === 'state') {
      setLedState(message.data);
      setLocalBrightness(message.data.brightness);
      setError(null);
    }
  };

  // WebSocket connection
  const { connected, error: wsError } = useWebSocket(handleWebSocketMessage);

  // Update error state when WebSocket error changes
  useEffect(() => {
    if (wsError) {
      setError(wsError);
    }
  }, [wsError]);

  // Initial state fetch
  useEffect(() => {
    fetchState();
  }, []);

  const fetchState = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/state');
      setLedState(response.data);
      setLocalBrightness(response.data.brightness);
    } catch (err) {
      setError(err.message || 'Failed to fetch LED state');
      console.error('Error fetching state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApiCall = async (apiCall, errorMessage) => {
    try {
      setError(null);
      await apiCall();
    } catch (err) {
      setError(err.message || errorMessage);
      console.error(errorMessage, err);
    }
  };

  const turnOn = () => handleApiCall(() => api.post('/on'), 'Error turning on');
  const turnOff = () => handleApiCall(() => api.post('/off'), 'Error turning off');
  const toggle = () => handleApiCall(() => api.post('/toggle'), 'Error toggling');

  // Debounced brightness update
  const debouncedSetBrightness = useMemo(
    () =>
      debounce(async (value) => {
        try {
          setError(null);
          await api.post('/brightness', { brightness: parseInt(value) });
        } catch (err) {
          setError(err.message || 'Error setting brightness');
          console.error('Error setting brightness:', err);
        }
      }, BRIGHTNESS_DEBOUNCE_MS),
    []
  );

  const handleBrightnessChange = (e) => {
    const value = e.target.value;
    setLocalBrightness(value); // Update local state immediately for UI responsiveness
    debouncedSetBrightness(value); // Debounced API call
  };

  const setMode = async (mode, speed, duration) => {
    await handleApiCall(
      () => api.post('/mode', { mode, speed, duration }),
      'Error setting mode'
    );
  };

  const handleCustomBlink = () => {
    const speed = blinkSpeedRef.current?.value;
    if (speed) {
      setMode('blink', parseInt(speed));
    }
  };

  const handleCustomBreathe = () => {
    const duration = breatheDurationRef.current?.value;
    if (duration) {
      setMode('breathe', null, parseInt(duration));
    }
  };

  return (
    <div className="app">
      <header>
        <h1>🔆 LED Controller</h1>
        <div className={`status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? '● Connected' : '○ Disconnected'}
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="error-banner" onClick={() => setError(null)}>
          <span>⚠️ {error}</span>
          <button className="error-close">×</button>
        </div>
      )}

      <div className="container">
        {/* LED Status Display */}
        <div className="led-display">
          <div className={`led-circle ${ledState.isOn ? 'on' : 'off'}`}>
            {ledState.isOn ? '💡' : '◯'}
          </div>
          <div className="led-info">
            <p><strong>Mode:</strong> {ledState.mode}</p>
            <p><strong>Brightness:</strong> {ledState.brightness}%</p>
            <p><strong>Pin:</strong> GPIO {ledState.pin}</p>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="loading-indicator">
            <span>Loading...</span>
          </div>
        )}

        {/* Basic Controls */}
        <div className="control-section">
          <h2>Basic Controls</h2>
          <div className="button-group">
            <button onClick={turnOn} className="btn btn-on" disabled={loading}>
              Turn ON
            </button>
            <button onClick={turnOff} className="btn btn-off" disabled={loading}>
              Turn OFF
            </button>
            <button onClick={toggle} className="btn btn-toggle" disabled={loading}>
              Toggle
            </button>
          </div>
        </div>

        {/* Brightness Control */}
        <div className="control-section">
          <h2>Brightness (PWM)</h2>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="100"
              value={localBrightness}
              onChange={handleBrightnessChange}
              className="slider"
              disabled={loading}
            />
            <span className="slider-value">{localBrightness}%</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="control-section">
          <h2>Modes</h2>
          <div className="mode-grid">
            <button 
              onClick={() => setMode('on')} 
              className={`mode-btn ${ledState.mode === 'on' ? 'active' : ''}`}
              disabled={loading}
            >
              🔆 Solid
            </button>
            <button 
              onClick={() => setMode('blink', 500)} 
              className={`mode-btn ${ledState.mode === 'blink' ? 'active' : ''}`}
              disabled={loading}
            >
              ✨ Blink
            </button>
            <button 
              onClick={() => setMode('pulse', 100)} 
              className={`mode-btn ${ledState.mode === 'pulse' ? 'active' : ''}`}
              disabled={loading}
            >
              ⚡ Pulse
            </button>
            <button 
              onClick={() => setMode('breathe', 2000)} 
              className={`mode-btn ${ledState.mode === 'breathe' ? 'active' : ''}`}
              disabled={loading}
            >
              🌊 Breathe
            </button>
            <button 
              onClick={() => setMode('sos')} 
              className={`mode-btn ${ledState.mode === 'sos' ? 'active' : ''}`}
              disabled={loading}
            >
              🆘 SOS
            </button>
          </div>
        </div>

        {/* Custom Mode Controls */}
        <div className="control-section">
          <h2>Custom Speed</h2>
          <div className="custom-controls">
            <div className="input-group">
              <label>Blink Speed (ms)</label>
              <input 
                type="number" 
                defaultValue="500" 
                min="50" 
                max="5000"
                ref={blinkSpeedRef}
                disabled={loading}
              />
              <button 
                onClick={handleCustomBlink}
                className="btn btn-small"
                disabled={loading}
              >
                Apply
              </button>
            </div>
            <div className="input-group">
              <label>Breathe Duration (ms)</label>
              <input 
                type="number" 
                defaultValue="2000" 
                min="500" 
                max="10000"
                ref={breatheDurationRef}
                disabled={loading}
              />
              <button 
                onClick={handleCustomBreathe}
                className="btn btn-small"
                disabled={loading}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>Press physical button to toggle LED</p>
      </footer>
    </div>
  );
}

export default App;
