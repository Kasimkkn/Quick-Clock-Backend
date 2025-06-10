import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { GeoFenceAttributes, GeoFenceCreationAttributes } from '../types/geofence.types';

class GeoFence extends Model<GeoFenceAttributes, GeoFenceCreationAttributes> implements GeoFenceAttributes {
    public id!: string;
    public name!: string;
    public centerLatitude!: number;
    public centerLongitude!: number;
    public radius!: number;
    public active!: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

GeoFence.init(
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
        centerLatitude: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        centerLongitude: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        radius: {
            type: DataTypes.FLOAT,
            allowNull: false,
            comment: 'Radius in meters',
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
        tableName: 'geofences',
    }
);

export { GeoFence };
