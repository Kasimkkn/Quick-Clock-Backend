import { Optional } from "sequelize";

interface GeoFenceAttributes {
    id: string;
    name: string;
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface GeoFenceCreationAttributes extends Optional<GeoFenceAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export { GeoFenceAttributes, GeoFenceCreationAttributes }