import { Router } from 'express';
import * as geofenceController from '../controllers/geofence.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Employee routes
router.get('/', authenticate, geofenceController.getAllGeoFences);
router.post('/check-location', authenticate, geofenceController.checkLocationWithinGeoFence);

// Admin routes
router.get('/:id', authenticate, geofenceController.getGeoFenceById);
router.post('/', authenticate, geofenceController.createGeoFence);
router.put('/:id', authenticate, geofenceController.updateGeoFence);
router.delete('/:id', authenticate, geofenceController.deleteGeoFence);

export default router;