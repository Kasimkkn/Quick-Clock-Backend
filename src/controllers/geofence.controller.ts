import { Request, Response } from 'express';
import { GeoFence } from '../models/geofence.model';
import { v4 as uuidv4 } from 'uuid';
import { isLocationWithinGeoFence } from '../utils/geofence.util';

export const getAllGeoFences = async (req: Request, res: Response): Promise<void> => {
    try {
        const geofences = await GeoFence.findAll({
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Geofences retrieved successfully',
            geofences
        });
    } catch (error) {
        console.error('Error fetching geofences:', error);
        res.status(500).json({ message: 'Server error while fetching geofences' });
    }
};

export const getGeoFenceById = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can select locations"
            })
        }
        const { id } = req.params;
        const geofence = await GeoFence.findByPk(id);

        if (!geofence) {
            res.status(404).json({ message: 'Geofence not found' });
            return;
        }

        res.status(200).json({
            message: 'Geofence retrieved successfully',
            geofence
        });
    } catch (error) {
        console.error('Error fetching geofence:', error);
        res.status(500).json({ message: 'Server error while fetching geofence' });
    }
};

export const createGeoFence = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can select locations"
            })
        }
        const { name, centerLatitude, centerLongitude, radius, active } = req.body;

        if (!name || !centerLatitude || !centerLongitude || !radius) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const newGeoFence = await GeoFence.create({
            id: uuidv4(),
            name,
            centerLatitude,
            centerLongitude,
            radius,
            active: active !== undefined ? active : true
        });

        res.status(201).json({
            message: 'Geofence created successfully',
            geofence: newGeoFence
        });
    } catch (error) {
        console.error('Error creating geofence:', error);
        res.status(500).json({ message: 'Server error while creating geofence' });
    }
};

export const updateGeoFence = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can select locations"
            })
        }
        const { id } = req.params;
        const { name, centerLatitude, centerLongitude, radius, active } = req.body;

        const geofence = await GeoFence.findByPk(id);

        if (!geofence) {
            res.status(404).json({ message: 'Geofence not found' });
            return;
        }

        await geofence.update({
            name: name || geofence.name,
            centerLatitude: centerLatitude !== undefined ? centerLatitude : geofence.centerLatitude,
            centerLongitude: centerLongitude !== undefined ? centerLongitude : geofence.centerLongitude,
            radius: radius !== undefined ? radius : geofence.radius,
            active: active !== undefined ? active : geofence.active
        });

        res.status(200).json({
            message: 'Geofence updated successfully',
            geofence
        });
    } catch (error) {
        console.error('Error updating geofence:', error);
        res.status(500).json({ message: 'Server error while updating geofence' });
    }
};

export const deleteGeoFence = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can select locations"
            })
        }
        const { id } = req.params;

        const geofence = await GeoFence.findByPk(id);

        if (!geofence) {
            res.status(404).json({ message: 'Geofence not found' });
            return;
        }

        await geofence.destroy();

        res.status(200).json({ message: 'Geofence deleted successfully' });
    } catch (error) {
        console.error('Error deleting geofence:', error);
        res.status(500).json({ message: 'Server error while deleting geofence' });
    }
};

export const checkLocationWithinGeoFence = async (req: Request, res: Response): Promise<void> => {
    try {
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            res.status(200).json({
                message: "Please Provide Latitude and Longitude"
            })
            return;
        }

        const isWithinFence = await isLocationWithinGeoFence({ latitude, longitude });

        res.status(200).json({
            message: 'Location checked successfully',
            isWithinFence
        });
    } catch (error) {
        console.error('Error checking location:', error);
        res.status(500).json({ message: 'Server error while checking location' });
    }
}