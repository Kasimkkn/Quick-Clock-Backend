import { Optional } from "sequelize";

interface HolidayAttributes {
    id: string;
    name: string;
    date: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

interface HolidayCreationAttributes extends Optional<HolidayAttributes, 'id' | 'createdAt' | 'updatedAt'> { }

export { HolidayAttributes, HolidayCreationAttributes }