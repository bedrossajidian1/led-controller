import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Auto-detect hostname (works with both localhost and Pi IP)
const getBaseUrl = () => {
  // If running on mobile/external device, use Pi's IP
  // Otherwise use current hostname
  const hostname = window.location.hostname;
  return hostname === 'localhost' ? 'localhost' : hostname;
};

const BASE_HOST = getBaseUrl();
const API_URL = `http://${BASE_HOST}:3001/api/led`;
const WS_URL = `ws://${BASE_HOST}:3001/ws`;

function App() {
  const [ledState, setLedState] = useState({
    isOn: false,
    mode: 'off',
    brightness: 100,
    pin: 17
  });
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);

  // WebSocket connection
  useEffect(() => {
    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };
    
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'state') {
        setLedState(message.data);
      }
    };
    
    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(websocket);
    
    // Initial state fetch
    fetchState();
    
    return () => {
      websocket.close();
    };
  }, []);

  const fetchState = async () => {
    try {
      const response = await axios.get(`${API_URL}/state`);
      setLedState(response.data);
    } catch (error) {
      console.error('Error fetching state:', error);
    }
  };

  const turnOn = async () => {
    try {
      await axios.post(`${API_URL}/on`);
    } catch (error) {
      console.error('Error turning on:', error);
    }
  };

  const turnOff = async () => {
    try {
      await axios.post(`${API_URL}/off`);
    } catch (error) {
      console.error('Error turning off:', error);
    }
  };

  const toggle = async () => {
    try {
      await axios.post(`${API_URL}/toggle`);
    } catch (error) {
      console.error('Error toggling:', error);
    }
  };

  const setBrightness = async (value) => {
    try {
      await axios.post(`${API_URL}/brightness`, { brightness: parseInt(value) });
    } catch (error) {
      console.error('Error setting brightness:', error);
    }
  };

  const setMode = async (mode, speed, duration) => {
    try {
      await axios.post(`${API_URL}/mode`, { mode, speed, duration });
    } catch (error) {
      console.error('Error setting mode:', error);
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

        {/* Basic Controls */}
        <div className="control-section">
          <h2>Basic Controls</h2>
          <div className="button-group">
            <button onClick={turnOn} className="btn btn-on">
              Turn ON
            </button>
            <button onClick={turnOff} className="btn btn-off">
              Turn OFF
            </button>
            <button onClick={toggle} className="btn btn-toggle">
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
              value={ledState.brightness}
              onChange={(e) => setBrightness(e.target.value)}
              className="slider"
            />
            <span className="slider-value">{ledState.brightness}%</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="control-section">
          <h2>Modes</h2>
          <div className="mode-grid">
            <button 
              onClick={() => setMode('on')} 
              className={`mode-btn ${ledState.mode === 'on' ? 'active' : ''}`}
            >
              🔆 Solid
            </button>
            <button 
              onClick={() => setMode('blink', 500)} 
              className={`mode-btn ${ledState.mode === 'blink' ? 'active' : ''}`}
            >
              ✨ Blink
            </button>
            <button 
              onClick={() => setMode('pulse', 100)} 
              className={`mode-btn ${ledState.mode === 'pulse' ? 'active' : ''}`}
            >
              ⚡ Pulse
            </button>
            <button 
              onClick={() => setMode('breathe', 2000)} 
              className={`mode-btn ${ledState.mode === 'breathe' ? 'active' : ''}`}
            >
              🌊 Breathe
            </button>
            <button 
              onClick={() => setMode('sos')} 
              className={`mode-btn ${ledState.mode === 'sos' ? 'active' : ''}`}
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
                id="blinkSpeed"
              />
              <button 
                onClick={() => {
                  const speed = document.getElementById('blinkSpeed').value;
                  setMode('blink', parseInt(speed));
                }}
                className="btn btn-small"
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
                id="breatheDuration"
              />
              <button 
                onClick={() => {
                  const duration = document.getElementById('breatheDuration').value;
                  setMode('breathe', null, parseInt(duration));
                }}
                className="btn btn-small"
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
