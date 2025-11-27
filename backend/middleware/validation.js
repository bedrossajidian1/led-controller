// Input validation middleware

export const validateBrightness = (req, res, next) => {
  const { brightness } = req.body;

  if (brightness === undefined) {
    return res.status(400).json({ error: 'Brightness is required' });
  }

  const brightnessNum = parseInt(brightness);
  if (isNaN(brightnessNum) || brightnessNum < 0 || brightnessNum > 100) {
    return res.status(400).json({
      error: 'Brightness must be a number between 0 and 100',
    });
  }

  req.body.brightness = brightnessNum;
  next();
};

export const validateMode = (req, res, next) => {
  const { mode, speed, duration } = req.body;

  if (!mode || typeof mode !== 'string') {
    return res.status(400).json({ error: 'Mode is required and must be a string' });
  }

  const validModes = ['off', 'on', 'blink', 'pulse', 'breathe', 'sos'];
  if (!validModes.includes(mode)) {
    return res.status(400).json({
      error: `Invalid mode. Must be one of: ${validModes.join(', ')}`,
    });
  }

  // Validate optional parameters
  if (speed !== undefined) {
    const speedNum = parseInt(speed);
    if (isNaN(speedNum) || speedNum < 10 || speedNum > 10000) {
      return res.status(400).json({
        error: 'Speed must be a number between 10 and 10000 milliseconds',
      });
    }
    req.body.speed = speedNum;
  }

  if (duration !== undefined) {
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 100 || durationNum > 60000) {
      return res.status(400).json({
        error: 'Duration must be a number between 100 and 60000 milliseconds',
      });
    }
    req.body.duration = durationNum;
  }

  next();
};

