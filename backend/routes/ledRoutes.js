import express from 'express';
import * as ledController from '../controllers/ledController.js';
import { validateBrightness, validateMode } from '../middleware/validation.js';

const router = express.Router();

// Get current state
router.get('/state', ledController.getState);

// Basic controls
router.post('/on', ledController.turnOn);
router.post('/off', ledController.turnOff);
router.post('/toggle', ledController.toggle);

// Advanced controls
router.post('/brightness', validateBrightness, ledController.setBrightness);
router.post('/mode', validateMode, ledController.setMode);

export default router;
