
import { Request, Response } from 'express';
import { User } from '../models/user.model';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { config } from '../config/config';
import { v4 as uuidv4 } from 'uuid';

const generateToken = (userId: string): string => {
    return jwt.sign(
        { id: userId },
        config.jwt.secret as Secret,
        {
            expiresIn: config.jwt.expiresIn,
        } as SignOptions
    );
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(403).json({ message: 'Email and password are required' });
            return;
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            res.status(403).json({ message: 'Invalid email or password' });
            return;
        }

        const isPasswordValid = await user.validatePassword(password);

        if (!isPasswordValid) {
            res.status(403).json({ message: 'Invalid email or password' });
            return;
        }

        const token = generateToken(user.id);

        const userData = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            mobile: user.mobile,
            department: user.department,
            designation: user.designation,
            role: user.role,
            photoUrl: user.photoUrl,
            birthday: user.birthday,
            createdAt: user.createdAt,
            isWfhEnabled: user.isWfhEnabled
        };

        res.status(200).json({
            message: 'Login successful',
            user: userData,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullName, email, password, mobile, department, designation, role, birthday, photoUrl, isWfhEnabled } = req.body;

        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            res.status(409).json({ message: 'User with this email already exists' });
            return;
        }

        const newUser = await User.create({
            id: uuidv4(),
            fullName,
            email,
            password,
            mobile,
            department,
            designation,
            birthday,
            photoUrl,
            isWfhEnabled: isWfhEnabled || false,
            createdAt: new Date(),
            role: role || 'employee',
        });

        const token = generateToken(newUser.id);

        const userData = {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            mobile: newUser.mobile,
            department: newUser.department,
            designation: newUser.designation,
            role: newUser.role,
            isWfhEnabled: newUser.isWfhEnabled,
            createdAt: newUser.createdAt,
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userData,
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        const userData = {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            mobile: user.mobile,
            department: user.department,
            designation: user.designation,
            role: user.role,
            photoUrl: user.photoUrl,
            birthday: user.birthday,
            createdAt: user.createdAt,
            isWfhEnabled: user.isWfhEnabled
        };

        res.status(200).json({ user: userData });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error during getting profile' });
    }
};