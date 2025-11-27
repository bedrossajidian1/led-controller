// Configuration file with environment variable support
export const config = {
  port: process.env.PORT || 3001,
  ledPin: parseInt(process.env.LED_PIN) || 17,
  buttonPin: parseInt(process.env.BUTTON_PIN) || 27,
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  environment: process.env.NODE_ENV || 'development',
};

