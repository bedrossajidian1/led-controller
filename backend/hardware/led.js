import gpiox from '@iiot2k/gpiox';

class LED {
  constructor(pin) {
    this.pin = pin;
    this.isOn = false;
    this.brightness = 100; // 0-100%
    this.mode = 'off'; // off, on, blink, pulse, breathe
    this.interval = null;
    this.pwmInterval = null;
    
    // Initialize GPIO
    gpiox.init_gpio(this.pin, gpiox.GPIO_MODE_OUTPUT, 0);
  }

  // Basic on/off
  turnOn() {
    this.stopMode();
    this.mode = 'on';
    this.isOn = true;
    gpiox.set_gpio(this.pin, 1);
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
    
    if (this.mode === 'on') {
      this.startPWM(this.brightness);
    }
  }

  startPWM(dutyCycle) {
    this.stopPWM();
    
    if (dutyCycle === 0) {
      gpiox.set_gpio(this.pin, 0);
      return;
    }
    
    if (dutyCycle === 100) {
      gpiox.set_gpio(this.pin, 1);
      return;
    }

    // Software PWM with 1ms period (1000 Hz)
    const period = 1000; // microseconds
    const onTime = (period * dutyCycle) / 100;
    const offTime = period - onTime;

    this.pwmInterval = setInterval(() => {
      gpiox.set_gpio(this.pin, 1);
      setTimeout(() => gpiox.set_gpio(this.pin, 0), onTime / 1000);
    }, period / 1000);
  }

  stopPWM() {
    if (this.pwmInterval) {
      clearInterval(this.pwmInterval);
      this.pwmInterval = null;
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
    
    let brightness = 0;
    let increasing = true;
    const steps = 50;
    const stepDuration = duration / steps;

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
