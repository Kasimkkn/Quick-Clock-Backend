import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { HolidayAttributes, HolidayCreationAttributes } from '../types/holiday.types';

class Holiday extends Model<HolidayAttributes, HolidayCreationAttributes> implements HolidayAttributes {
    public id!: string;
    public name!: string;
    public date!: string;
    public description?: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Holiday.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'holidays',
        indexes: [
            {
                unique: true,
                fields: ['date'],
                name: 'idx_holiday_date',
            },
        ],
    }
);

export { Holiday };
