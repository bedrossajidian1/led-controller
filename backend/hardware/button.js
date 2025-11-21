import gpiox from '@iiot2k/gpiox';

class Button {
  constructor(pin, callback) {
    this.pin = pin;
    this.callback = callback;
    this.lastState = 0;
    this.debounceTimeout = null;
    this.debounceDelay = 50; // ms
    
    // Initialize GPIO as input with pull-up resistor
    // init_gpio(pin, mode, state) - state is ignored for input modes
    if (!gpiox.init_gpio(this.pin, gpiox.GPIO_MODE_INPUT_PULLUP, 0)) {
      throw new Error(`Failed to initialize button on GPIO ${this.pin}`);
    }
    
    // Start monitoring
    this.startMonitoring();
  }

  startMonitoring() {
    this.pollInterval = setInterval(() => {
      const currentState = gpiox.get_gpio(this.pin);
      
      // Button pressed (LOW because of pull-up)
      if (currentState === 0 && this.lastState === 1) {
        this.handlePress();
      }
      
      this.lastState = currentState;
    }, 10); // Poll every 10ms
  }

  handlePress() {
    // Debounce
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      if (this.callback) {
        this.callback();
      }
    }, this.debounceDelay);
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
