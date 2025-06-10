import { Request, Response } from 'express';
import { Holiday } from '../models/holiday.model';
import { v4 as uuidv4 } from 'uuid';

export const getAllHolidays = async (req: Request, res: Response): Promise<void> => {
    try {
        const holidays = await Holiday.findAll({
            order: [['date', 'ASC']]
        });

        res.status(200).json({
            message: 'Holidays retrieved successfully',
            holidays
        });
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ message: 'Server error while fetching holidays' });
    }
};

export const getHolidayById = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "you are not authorized to access this route"
            })
        }
        const { id } = req.params;
        const holiday = await Holiday.findByPk(id);

        if (!holiday) {
            res.status(404).json({ message: 'Holiday not found' });
            return;
        }

        res.status(200).json({
            message: 'Holiday retrieved successfully',
            holiday
        });
    } catch (error) {
        console.error('Error fetching holiday:', error);
        res.status(500).json({ message: 'Server error while fetching holiday' });
    }
};

export const createHoliday = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can Create Holidays"
            })
        }
        const { name, date, description } = req.body;

        if (!name || !date) {
            res.status(400).json({ message: 'Name and date are required' });
            return;
        }

        const existingHoliday = await Holiday.findOne({
            where: { date }
        });

        if (existingHoliday) {
            res.status(409).json({ message: 'A holiday already exists on this date' });
            return;
        }

        const newHoliday = await Holiday.create({
            id: uuidv4(),
            name,
            date,
            description
        });

        res.status(201).json({
            message: 'Holiday created successfully',
            holiday: newHoliday
        });
    } catch (error) {
        console.error('Error creating holiday:', error);
        res.status(500).json({ message: 'Server error while creating holiday' });
    }
};

export const updateHoliday = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can Create Holidays"
            })
        }
        const { id } = req.params;
        const { name, date, description } = req.body;

        const holiday = await Holiday.findByPk(id);

        if (!holiday) {
            res.status(404).json({ message: 'Holiday not found' });
            return;
        }

        if (date && date !== holiday.date) {
            const existingHoliday = await Holiday.findOne({
                where: { date }
            });

            if (existingHoliday) {
                res.status(409).json({ message: 'A holiday already exists on this date' });
                return;
            }
        }

        await holiday.update({
            name: name || holiday.name,
            date: date || holiday.date,
            description: description !== undefined ? description : holiday.description
        });

        res.status(200).json({
            message: 'Holiday updated successfully',
            holiday
        });
    } catch (error) {
        console.error('Error updating holiday:', error);
        res.status(500).json({ message: 'Server error while updating holiday' });
    }
};

export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(400).json({
                message: "only Admins can Create Holidays"
            })
        }
        const { id } = req.params;

        const holiday = await Holiday.findByPk(id);

        if (!holiday) {
            res.status(404).json({ message: 'Holiday not found' });
            return;
        }

        await holiday.destroy();

        res.status(200).json({ message: 'Holiday deleted successfully' });
    } catch (error) {
        console.error('Error deleting holiday:', error);
        res.status(500).json({ message: 'Server error while deleting holiday' });
    }
};