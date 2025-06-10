import { Request, Response } from 'express';
import { User } from '../models/user.model';

// Get all users/employees
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Users retrieved successfully',
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            message: 'User retrieved successfully',
            user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error while fetching user' });
    }
};

// Update user
export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to update users' });
            return;
        }
        const { id } = req.params;
        const { fullName, email, mobile, department, designation, photoUrl, birthday, isWfhEnabled } = req.body;

        // Find the user
        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Only admin can update other users
        if (req.userId !== id && !req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to update this user' });
            return;
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                res.status(409).json({ message: 'Email already in use' });
                return;
            }
        }

        if (fullName) {
            user.fullName = fullName;
        }

        if (email) {
            user.email = email;
        }

        if (mobile) {
            user.mobile = mobile;
        }

        if (department) {
            user.department = department;
        }

        if (designation) {
            user.designation = designation;
        }

        if (photoUrl) {
            user.photoUrl = photoUrl;
        }

        if (birthday) {
            user.birthday = birthday;
        }

        if (isWfhEnabled !== undefined) {
            user.isWfhEnabled = isWfhEnabled;
        }

        await user.save();


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
            updatedAt: user.updatedAt
        };

        res.status(200).json({
            message: 'User updated successfully',
            user: userData
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error while updating user' });
    }
};

// Update user role (Admin only)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to update user roles' });
            return;
        }
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !['admin', 'employee'].includes(role)) {
            res.status(400).json({ message: 'Invalid role. Must be either "admin" or "employee"' });
            return;
        }

        // Find the user
        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Update role
        await user.update({ role });

        res.status(200).json({
            message: 'User role updated successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error while updating user role' });
    }
};

// Change password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        // Find the user
        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        // Only the user themselves or an admin can change password
        if (req.userId !== id && !req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to change this user\'s password' });
            return;
        }

        // If user is changing their own password, verify current password
        if (req.userId === id) {
            const isPasswordValid = await user.validatePassword(currentPassword);
            if (!isPasswordValid) {
                res.status(403).json({ message: 'Current password is incorrect' });
                return;
            }
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error while changing password' });
    }
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.isAdmin) {
            res.status(403).json({ message: 'You are not authorized to delete users' });
            return;
        }
        const { id } = req.params;

        // Prevent deleting the last admin
        if (req.userId === id) {
            const adminCount = await User.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                res.status(400).json({ message: 'Cannot delete the last admin account' });
                return;
            }
        }

        // Find and delete the user
        const user = await User.findByPk(id);

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        await user.destroy();

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};