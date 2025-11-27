import gpiox from '@iiot2k/gpiox';

class LED {
  constructor(pin) {
    this.pin = pin;
    this.isOn = false;
    this.brightness = 100; // 0-100%
    this.mode = 'off'; // off, on, blink, pulse, breathe
    this.interval = null;
    this.pwmInterval = null;
    this.pwmTimeout = null;
    
    // Initialize GPIO
    gpiox.init_gpio(this.pin, gpiox.GPIO_MODE_OUTPUT, 0);
  }

  // Basic on/off
  turnOn() {
    this.stopMode();
    this.mode = 'on';
    this.isOn = true;
    // Apply current brightness setting
    this.startPWM(this.brightness);
  }

  turnOff() {
    this.stopMode();
    this.mode = 'off';
    this.isOn = false;
    gpiox.set_gpio(this.pin, 0);
  }

  toggle() {
    if (this.isOn) {
      this.turnOff();
    } else {
      this.turnOn();
    }
  }

  // Software PWM for brightness control
  setBrightness(percent) {
    this.brightness = Math.max(0, Math.min(100, percent));
    
    // Apply brightness if LED is currently on (not in blink/pulse/sos mode)
    if (this.mode === 'on' || (this.isOn && !this.interval)) {
      this.startPWM(this.brightness);
    }
  }

  startPWM(dutyCycle) {
    this.stopPWM();
    
    const clampedDuty = Math.max(0, Math.min(100, dutyCycle));
    
    if (clampedDuty === 0) {
      gpiox.set_gpio(this.pin, 0);
      this.isOn = false;
      return;
    }
    
    if (clampedDuty === 100) {
      gpiox.set_gpio(this.pin, 1);
      this.isOn = true;
      return;
    }

    // Software PWM with 10ms period (100 Hz) for better stability
    // Using longer period for more reliable timing with JavaScript
    const period = 10; // milliseconds
    const onTime = (period * clampedDuty) / 100;
    const offTime = period - onTime;
    this.isOn = true;

    // Use recursive setTimeout for accurate timing of on/off transitions
    const pwmCycle = () => {
      gpiox.set_gpio(this.pin, 1);
      this.pwmTimeout = setTimeout(() => {
        gpiox.set_gpio(this.pin, 0);
        this.pwmTimeout = setTimeout(pwmCycle, offTime);
      }, onTime);
    };

    pwmCycle();
  }

  stopPWM() {
    if (this.pwmInterval) {
      clearInterval(this.pwmInterval);
      this.pwmInterval = null;
    }
    if (this.pwmTimeout) {
      clearTimeout(this.pwmTimeout);
      this.pwmTimeout = null;
    }
  }

  // Blink mode
  startBlink(speed = 500) {
    this.stopMode();
    this.mode = 'blink';
    
    this.interval = setInterval(() => {
      this.isOn = !this.isOn;
      gpiox.set_gpio(this.pin, this.isOn ? 1 : 0);
    }, speed);
  }

  // Pulse mode (fast blink)
  startPulse(speed = 100) {
    this.stopMode();
    this.mode = 'pulse';
    
    this.interval = setInterval(() => {
      this.isOn = !this.isOn;
      gpiox.set_gpio(this.pin, this.isOn ? 1 : 0);
    }, speed);
  }

  // Breathe mode (smooth fade in/out)
  startBreathe(duration = 2000) {
    this.stopMode();
    this.mode = 'breathe';
    this.isOn = true;
    
    let brightness = 0;
    let increasing = true;
    const steps = 50;
    const stepDuration = duration / (steps * 2); // Divide by 2 for complete cycle

    this.interval = setInterval(() => {
      if (increasing) {
        brightness += 100 / steps;
        if (brightness >= 100) {
          brightness = 100;
          increasing = false;
        }
      } else {
        brightness -= 100 / steps;
        if (brightness <= 0) {
          brightness = 0;
          increasing = true;
        }
      }
      
      // Update brightness and apply PWM
      this.brightness = brightness;
      this.startPWM(brightness);
    }, stepDuration);
  }

  // SOS mode
  startSOS() {
    this.stopMode();
    this.mode = 'sos';
    
    const dot = 200;
    const dash = 600;
    const gap = 200;
    const letterGap = 600;

    const sequence = [
      // S: ...
      dot, gap, dot, gap, dot, letterGap,
      // O: ---
      dash, gap, dash, gap, dash, letterGap,
      // S: ...
      dot, gap, dot, gap, dot, letterGap * 3
    ];

    let step = 0;
    let isSignal = true;

    const executeSequence = () => {
      if (step >= sequence.length) {
        step = 0;
      }

      if (isSignal) {
        gpiox.set_gpio(this.pin, 1);
      } else {
        gpiox.set_gpio(this.pin, 0);
      }

      const duration = sequence[step];
      isSignal = !isSignal;
      step++;

      this.interval = setTimeout(executeSequence, duration);
    };

    executeSequence();
  }

  stopMode() {
    if (this.interval) {
      clearInterval(this.interval);
      clearTimeout(this.interval);
      this.interval = null;
    }
    this.stopPWM();
  }

  getState() {
    return {
      isOn: this.isOn,
      mode: this.mode,
      brightness: this.brightness,
      pin: this.pin
    };
  }

  cleanup() {
    this.stopMode();
    gpiox.set_gpio(this.pin, 0);
    gpiox.deinit_gpio(this.pin);
  }
}

export default LED;
