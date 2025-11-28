import gpiox from '@iiot2k/gpiox';

class Button {
  constructor(pin, callback) {
    this.pin = pin;
    this.callback = callback;
    this.debounceTimeout = null;
    this.debounceDelay = 50; // ms
    this.isPressed = false;
    
    // Initialize GPIO as input with pull-up resistor
    // init_gpio(pin, mode, state) - state is ignored for input modes
    if (!gpiox.init_gpio(this.pin, gpiox.GPIO_MODE_INPUT_PULLUP, 0)) {
      throw new Error(`Failed to initialize button on GPIO ${this.pin}`);
    }
    
    // Read initial state (should be HIGH/1 with pull-up when not pressed)
    const initialState = gpiox.get_gpio(this.pin);
    this.lastState = initialState;
    console.log(`Button initialized on GPIO ${this.pin}, initial state: ${initialState}`);
    
    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    this.pollInterval = setInterval(() => {
      try {
        const currentState = gpiox.get_gpio(this.pin);
        
        // Button pressed (LOW/0 because of pull-up resistor)
        // Detect falling edge: transition from HIGH (1) to LOW (0)
        if (currentState === 0 && this.lastState === 1 && !this.isPressed) {
          this.isPressed = true;
          this.handlePress();
        }
        
        // Button released (HIGH/1) - reset pressed flag
        if (currentState === 1 && this.lastState === 0) {
          this.isPressed = false;
        }
        
        this.lastState = currentState;
      } catch (error) {
        console.error(`Error reading button GPIO ${this.pin}:`, error);
      }
    }, 10); // Poll every 10ms
  }

  handlePress() {
    // Debounce - only trigger callback after button has been stable
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      // Verify button is still pressed before triggering callback
      try {
        const currentState = gpiox.get_gpio(this.pin);
        if (currentState === 0 && this.callback) {
          console.log(`Button press detected on GPIO ${this.pin}`);
          this.callback();
        }
      } catch (error) {
        console.error(`Error in button press handler:`, error);
      }
    }, this.debounceDelay);
  }

  getState() {
    try {
      const currentState = gpiox.get_gpio(this.pin);
      return {
        pin: this.pin,
        currentState: currentState,
        lastState: this.lastState,
        isPressed: this.isPressed,
        // State interpretation: 0 = pressed (LOW), 1 = not pressed (HIGH with pull-up)
        buttonPressed: currentState === 0,
      };
    } catch (error) {
      console.error(`Error reading button state:`, error);
      return {
        pin: this.pin,
        error: error.message,
      };
    }
  }

  cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    gpiox.deinit_gpio(this.pin);
  }
}

export default Button;
