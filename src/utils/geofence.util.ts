
import { GeoFence } from '../models/geofence.model';

interface GeoLocation {
    latitude: number;
    longitude: number;
}

export const isLocationWithinGeoFence = async (location: GeoLocation): Promise<boolean> => {
    try {
        const geofences = await GeoFence.findAll({
            where: { active: true }
        });

        if (geofences.length === 0) return true;

        return geofences.some(fence => {
            const R = 6371e3; // Earth radius in meters
            const φ1 = (location.latitude * Math.PI) / 180;
            const φ2 = (fence.centerLatitude * Math.PI) / 180;
            const Δφ = ((fence.centerLatitude - location.latitude) * Math.PI) / 180;
            const Δλ = ((fence.centerLongitude - location.longitude) * Math.PI) / 180;

            const a =
                Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return distance <= fence.radius;
        });
    } catch (error) {
        console.error('Error checking geofence:', error);
        // Default to true if there's an error
        return true;
    }
};